import { parse } from "flatted";
import { readFile } from "fs/promises";
import type { z } from "zod";
import { updateDatabaseFile } from "./utils";

export type OperationOption<N, S> = {
    name: N,
    schema: S,
    databaseFile: string
};

export type OperationReturn<S extends z.ZodSchema> = {
    create: (values: z.infer<S>) => void,
}
export async function createOperation<N extends string, S extends z.ZodSchema>(options: OperationOption<N, S>): Promise<OperationReturn<S>> {
    // Read database json content
    const databseContent = await readFile(options.databaseFile, "utf8")
    // Parse database json content
    const parsedValue = parse(databseContent)
    // Check if connection don't exist then initilaze 
    if (!(options.name in parsedValue)) {
        // Set the collection
        parsedValue[options.name] = {}
        // Initialize the collection to database json
        await updateDatabaseFile(options.databaseFile, parsedValue)
    }

    return {
        create(values) { }
    }
}
