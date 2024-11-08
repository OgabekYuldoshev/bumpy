import { existsSync } from "fs";
import path from "path";
import { parse } from "flatted";
import { readFile } from "fs/promises";
import { describe, expect, test } from "vitest";
import { z } from "zod";
import { createBumpy } from "../src/bumpy";
import { createCollection } from "../src/collection";
describe("Bumpy tests", async () => {
    const databasePath = "./meta/db.json"

    const db = await createBumpy({
        basePath: databasePath,
        collections: [
            createCollection({
                name: 'posts',
                schema: z.object({
                    title: z.string(),
                    desc: z.string()
                })
            })
        ]
    })

    test("should initialize databse file", () => {
        expect(existsSync(path.join(process.cwd(), databasePath))).toBe(true)
    })

    test("should parse databse file", async () => {
        const basePath = path.join(process.cwd(), databasePath)
        const content = await readFile(basePath, 'utf8')
        expect(parse(content)).toStrictEqual({
            posts: {}
        })
    })

    test("should have posts collection", () => {
        expect("posts" in db).toBe(true)
        expect("post" in db).toBe(false)
    })

})