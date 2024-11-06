import path from "path"
import { existsSync } from "fs"

import { DEFAULT_NAME } from "./constants"
import { mkdir, writeFile } from "fs/promises"
import { stringify } from 'flatted';
import type { z } from "zod";

export interface BumpyOptions<Schema> {
  path?: string
  schema: Schema
}

export async function createBumpy<Schema extends Record<string, z.ZodType<unknown, z.ZodObjectDef>>>(options: BumpyOptions<Schema>) {

  let dName = DEFAULT_NAME
  let dPath = path.resolve(process.cwd(), "./")

  // Check path is existing
  if (options.path) {
    const { ext, name, dir, base } = path.parse(options.path)

    if (ext && ext !== '.json') {
      throw new Error("Invalid file extension")
    }

    let directory: string

    if (ext) {
      dName = name
      directory = dir
    } else {
      directory = path.join(dir, base)
    }

    dPath = path.resolve(process.cwd(), directory)
  }
  // initialize the database
  if (!existsSync(dPath)) {
    await mkdir(dPath)
  }

  const dFile = path.join(dPath, `${dName}.json`)

  if (!existsSync(dFile)) {
    await writeFile(dFile, stringify({}))
  }

  type SchemaKey = keyof typeof options.schema

  const collection: Record<SchemaKey, () => string> = {} as Record<SchemaKey, () => string>

  for (const [key, schema] of Object.entries(options.schema)) {
    collection[key as SchemaKey] = () => ""
  }


  const obj = {
    name: dName,
    path: dPath,
    ...collection
  }

  return obj
}