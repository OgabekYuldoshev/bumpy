import { stringify, parse } from "flatted";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import sift from "sift";
import { firstBy } from "thenby";
import type { BumpyOptions, Collection, CollectionOperations, Data, FindOptions, InferSchema, Operations, SortOptions, WithBaseField } from "./types";
import { baseFieldSchema, generateCuid } from "./utils";

class Bumpy<
  TName extends string,
  TSchema extends z.ZodSchema,
  TCollection extends Collection<TName, TSchema> = Collection<TName, TSchema>> {
  private filePath: string = ''
  private data: Partial<Data<TCollection>> = {}
  private operations: Partial<CollectionOperations<TCollection>> = {}

  constructor(private options: BumpyOptions<TCollection>) { }

  public async initialize() {
    const parsedPath = path.parse(this.options.basePath);

    if (!parsedPath.ext || parsedPath.ext !== ".json") {
      throw new Error("Base path must be a valid JSON file");
    }

    const rootPath = path.join(process.cwd(), parsedPath.dir);
    this.filePath = path.join(rootPath, parsedPath.base);

    if (!existsSync(rootPath)) {
      await mkdir(rootPath, { recursive: true });
    }

    if (!existsSync(this.filePath)) {
      const initialData = this.options.collections.reduce((acc, collection) => {
        acc[collection.name as TCollection['name']] = {};
        return acc;
      }, {} as Record<TCollection['name'], {}>);

      await writeFile(this.filePath, stringify(initialData));
      this.data = initialData;
    } else {
      const fileContent = await readFile(this.filePath, "utf-8");
      const parsedContent = parse(fileContent) as Data<TCollection>

      let hasDiff = false
      for (const collection of this.options.collections) {
        if (collection.name in parsedContent) continue;
        this.data[collection.name] = {};
        if (!hasDiff) {
          hasDiff = true
        }
      }

      this.data = { ...this.data, ...parsedContent } as Data<TCollection>

      if (hasDiff) {
        await this.saveToFile();
      }
    }

    for (const collection of this.options.collections) {
      (this.operations[collection.name] as any) = this.createOperations(collection)
    }
  }

  private async saveToFile(): Promise<void> {
    await writeFile(this.filePath, stringify(this.data));
  }


  private applySorting<T>(items: T[], sort: SortOptions): T[] {
    let sortChain = null;

    for (const [key, order] of Object.entries(sort)) {
      const sortFn = firstBy(key, { direction: order === "desc" ? -1 : 1 });
      sortChain = sortChain ? sortChain.thenBy(key, { direction: order === "desc" ? -1 : 1 }) : sortFn;
    }

    return sortChain ? [...items].sort(sortChain as any) : items;
  }

  private createOperations<S extends z.ZodSchema>(
    collection: TCollection
  ): Operations<S> {
    return {
      create: async (data: InferSchema<S>) => {
        const validated = collection.schema.parse(data) as InferSchema<S>
        const now = new Date().toISOString();
        const newDoc: WithBaseField<InferSchema<S>> = {
          ...validated,
          id: generateCuid(),
          createdAt: now,
          updatedAt: now,
        } satisfies WithBaseField<InferSchema<S>>

        if (!this.data[collection.name]) {
          this.data[collection.name] = {};
        }

        (this.data[collection.name] as any)[newDoc.id] = newDoc;
        await this.saveToFile();
        return newDoc;
      },

      createMany: async (dataArray: InferSchema<S>[]) => {
        const results: WithBaseField<InferSchema<S>>[] = [];

        for (const data of dataArray) {
          const newDoc = await this.operations[collection.name]?.create(data);
          if (newDoc) {
            results.push(newDoc);
          }
        }

        return results;
      },

      findOne: async (query) => {
        const items = Object.values(this.data[collection.name] || {});
        return items.find(sift(query)) || null;
      },

      findMany: async (
        query,
        options: FindOptions = {}
      ) => {
        const { sort } = options;
        let items = Object.values(this.data[collection.name] || {}).filter(sift(query));

        if (sort) {
          items = this.applySorting(items, sort);
        }

        return items;
      },

      update: async (
        query,
        data: Partial<InferSchema<S>>
      ) => {
        const items = this.data[collection.name] || {};
        const item = Object.values(items).find(sift(query));

        if (!item) return null;

        const updated = {
          ...item,
          ...data,
          updatedAt: new Date().toISOString(),
        };

        const validatedData = await baseFieldSchema.merge(collection.schema as any).parseAsync(updated) as WithBaseField<InferSchema<S>>

        items[item.id as string] = validatedData

        this.data[collection.name] = items;

        await this.saveToFile();

        return updated;
      },

      updateMany: async (
        query,
        data
      ) => {
        const items = this.data[collection.name] || {};
        const matchingItems = Object.values(items).filter(sift(query));
        const updatedItems: WithBaseField<InferSchema<S>>[] = [];

        for (const item of matchingItems) {
          const updated = await this.operations[collection.name]?.update(
            { id: item.id } as any,
            data
          );
          if (updated) {
            updatedItems.push(updated);
          }
        }

        return updatedItems;
      },

      delete: async (
        query
      ) => {
        const items = this.data[collection.name] || {};
        const item = Object.values(items).find(sift(query));

        if (!item) return false;

        delete items[item.id as string];
        this.data[collection.name] = items;
        await this.saveToFile();

        return true;
      },

      deleteMany: async (
        query
      ) => {
        const items = this.data[collection.name] || {};
        const matchingItems = Object.values(items).filter(sift(query));

        for (const item of matchingItems) {
          delete items[item.id as string];
        }

        this.data[collection.name] = items;
        await this.saveToFile();

        return matchingItems.length;
      },

      count: async (
        query
      ) => {
        const items = Object.values(this.data[collection.name] || {});
        return items.filter(sift(query || {})).length;
      },
    };
  }

  public getCollection<T extends TCollection['name']>(collectionName: T) {
    const operations = this.operations[collectionName];
    if (!operations) {
      throw new Error(`Collection ${collectionName} not found`);
    }
    return operations;
  }
}

export function createBumpy<N extends string, S extends z.ZodSchema, C extends Collection<N, S>>(options: BumpyOptions<C>) {
  return new Bumpy(options)
}

export function createCollection<N extends string, S extends z.ZodSchema>(options: Collection<N, S>): Collection<N, S> {
  return Object.freeze(options)
}