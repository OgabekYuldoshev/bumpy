import { beforeAll, describe, expect, test } from "vitest";
import { createBumpy, createCollection } from "../src";
import { z } from "zod";
import path from "path";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { parse } from "flatted";


describe("Bumpy tests", async () => {
    const db = createBumpy({
        basePath: './.meta/db.json',
        collections: [
            createCollection({
                name: "posts",
                schema: z.object({
                    title: z.string(),
                    content: z.string(),
                })
            }),
            createCollection({
                name: 'users',
                schema: z.object({
                    fullname: z.string(),
                    email: z.string().email()
                })
            })
        ]
    })

    beforeAll(async () => {
        await db.initialize()
    })

    test("should initialize", () => {
        const databasePath = path.join(process.cwd(), './.meta/db.json')
        expect(existsSync(databasePath)).toBe(true)
    })

    test("should initialize collection", async () => {
        const databasePath = path.join(process.cwd(), './.meta/db.json')
        const content = await readFile(databasePath, 'utf8')
        const parsedContent = parse(content)
        expect("users" in parsedContent).toBe(true)
        expect("posts" in parsedContent).toBe(true)
        expect(parsedContent['users']).toEqual({})
        expect(parsedContent['posts']).toEqual({})
    })

})