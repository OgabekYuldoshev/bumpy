import type { z } from "zod"

export type Collection<Name, Schema> = {
    name: Name,
    schema: Schema
}

export function createCollection<Name extends string, Schema extends z.ZodSchema>(option: Collection<Name, Schema>): Collection<Name, Schema> {
    Object.freeze(option)
    return option
}