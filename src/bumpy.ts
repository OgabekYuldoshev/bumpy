import { existsSync } from "fs";

import path from "path";

import { stringify } from "flatted";
import { mkdir, writeFile } from "fs/promises";
import type { z } from "zod";
import type { Collection } from "./collection";
import { DEFAULT_NAME } from "./constants";
import { type OperationReturn, createOperation } from "./operation";
import type { Prettify } from "./types";

export interface BumpyOptions<N, S> {
  basePath?: string;
  collections: Array<Collection<N, S>>;
  onInit?(): void;
}

export type BumpyReturn<N extends string, S extends z.Schema> = Record<N, OperationReturn<S>>;

export async function createBumpy<N extends string, S extends z.ZodSchema>(
  options: BumpyOptions<N, S>,
): Promise<Prettify<BumpyReturn<N, S>>> {
  let databaseName = DEFAULT_NAME;
  let databasePath = path.join(process.cwd(), "./");

  if (options.basePath) {
    const { ext, name, dir, base } = path.parse(options.basePath);

    if (ext && ext !== ".json") {
      throw new Error("Invalid file extension");
    }

    let directory: string;

    if (ext) {
      databaseName = name;
      directory = dir;
    } else {
      directory = path.join(dir, base);
    }

    databasePath = path.join(process.cwd(), directory);
  }

  if (!existsSync(databasePath)) {
    await mkdir(databasePath, { recursive: true });
  }

  const databaseFile = path.join(databasePath, `${databaseName}.json`);

  if (!existsSync(databaseFile)) {
    await writeFile(databaseFile, stringify({}));
  }

  options.onInit?.();

  const collection: Record<N, OperationReturn<S>> = {} as Record<
    N,
    OperationReturn<S>
  >;

  for (const { name, schema } of options.collections) {
    collection[name as N] = await createOperation({
      name,
      schema,
      databaseFile,
    });
  }

  return collection;
}
