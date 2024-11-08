import { beforeAll, describe, expect, test } from "vitest";
import { z } from "zod";
import { type Collection, createCollection } from "../src/collection";

describe("Collection tests", () => {
    let collection: Collection<string, z.ZodSchema>

    beforeAll(() => {
        collection = createCollection({
            name: "user",
            schema: z.object({
                name: z.string(),
                email: z.string().email(),
            })
        })
    });

    test("should check collection name", () => {
        expect(collection.name).toEqual("user")
    })

    test("should not change collection name", () => {
        expect(
            () => {
                collection.name = 'test'
            }
        ).toThrowError(TypeError)
    })

    test("should parse collection schema", async () => {
        const data = await collection.schema.parseAsync({
            name: 'Test',
            email: 'test@example.com',
        })
        expect(data.email).toBe('test@example.com')
    })
})