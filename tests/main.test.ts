import { beforeAll, describe, expect, test, beforeEach } from "vitest";
import { createBumpy, createCollection } from "../src";
import { z } from "zod";
import path from "path";
import { existsSync } from "fs";
import { readFile, rmdir } from "fs/promises";
import { parse } from "flatted";


describe("Bumpy tests", async () => {
    let databaseContent: any = {}

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
        const databaseDir = path.join(process.cwd(), './.meta')
        if (existsSync(databaseDir)) {
            await rmdir(databaseDir, { recursive: true })
        }

        await db.initialize()
    })

    beforeEach(async () => {
        const databasePath = path.join(process.cwd(), './.meta/db.json')
        const content = await readFile(databasePath, 'utf8')
        databaseContent = parse(content)
    })

    test("should initialize", () => {
        const databasePath = path.join(process.cwd(), './.meta/db.json')
        expect(existsSync(databasePath)).toBe(true)
    })

    test("should initialize collection", async () => {
        expect("users" in databaseContent).toBe(true)
        expect("posts" in databaseContent).toBe(true)
    })

    test("should create method", async () => {
        const users = db.getCollection("users")
        const newUser = await users.create({
            fullname: "John Doe",
            email: "john.doe@example.com"
        })

        expect(newUser.email).toEqual("john.doe@example.com")
    })

    test("should createMany method", async () => {
        const users = db.getCollection("users")
        const newUsers = await users.createMany([
            { fullname: "Alice Johnson", email: "shared.email@example.com" },
            { fullname: "Bob Smith", email: "shared.email@example.com" },
            { fullname: "Catherine Lee", email: "shared.email@example.com" },
            { fullname: "David Brown", email: "shared.email@example.com" },
            { fullname: "Ella Davis", email: "ella.davis@example.com" },
            { fullname: "Frank Wilson", email: "frank.wilson@example.com" },
            { fullname: "Grace Martinez", email: "grace.martinez@example.com" },
            { fullname: "Henry Garcia", email: "henry.garcia@example.com" },
            { fullname: "Ivy Miller", email: "ivy.miller@example.com" },
            { fullname: "Jack Taylor", email: "jack.taylor@example.com" },
            { fullname: "Karen Anderson", email: "karen.anderson@example.com" },
            { fullname: "Leo Thomas", email: "leo.thomas@example.com" },
            { fullname: "Mia Robinson", email: "mia.robinson@example.com" },
            { fullname: "Nina Harris", email: "nina.harris@example.com" },
            { fullname: "Oscar Clark", email: "oscar.clark@example.com" },
            { fullname: "Paula Lewis", email: "paula.lewis@example.com" },
            { fullname: "Quinn Walker", email: "quinn.walker@example.com" },
            { fullname: "Ruby Hall", email: "ruby.hall@example.com" },
            { fullname: "Sam Young", email: "sam.young@example.com" },
            { fullname: "Tina King", email: "tina.king@example.com" },
            { fullname: "John Smith", email: "john.smith@example.com" },
            { fullname: "John Smith 2", email: "john.smith@example.com" },
            { fullname: "Another Person", email: "a.p@example.com" }
        ])
        expect(newUsers.length).toEqual(23)
        expect(newUsers[newUsers.length - 1]?.email).toEqual("a.p@example.com")
    })

    test("should delete method", async () => {
        const users = db.getCollection("users")
        const deletedUser = await users.delete({
            email: "a.p@example.com"
        })
        expect(deletedUser).toEqual(true)
    })

    test("should deleteMany method", async () => {
        const users = db.getCollection("users")
        const deletedUser = await users.deleteMany({
            email: "john.smith@example.com"
        })

        expect(deletedUser).toEqual(2)
    })

    test("should count method", async () => {
        const users = db.getCollection("users")
        const userCount = await users.count()
        expect(userCount).toEqual(21)
    })


    test("should update user", async () => {
        const users = db.getCollection("users")
        const updatedUser = await users.update({
            email: "john.doe@example.com",
        }, {
            fullname: "John Doe (Updated)"
        })

        expect(updatedUser?.fullname).toEqual("John Doe (Updated)")
    })

    test("should updateMany user", async () => {
        const users = db.getCollection("users")
        const updatedUser = await users.updateMany({
            email: "john.doe@example.com",
        }, {
            fullname: "John Doe (Updated) 1"
        })

        expect(updatedUser[0]?.fullname).toEqual("John Doe (Updated) 1")
    })

    test("should find user", async () => {
        const users = db.getCollection("users")
        const oscarUser = await users.findOne({
            email: "oscar.clark@example.com",
        })
        expect(oscarUser?.fullname).toEqual("Oscar Clark")
    })

    test("should find user to be null", async () => {
        const users = db.getCollection("users")

        const testUser = await users.findOne({
            email: "test@example.com",
        })
        expect(testUser).toBe(null)
    })

    test("should findMany user", async () => {
        const users = db.getCollection("users")

        const foundUsers = await users.findMany({
            email: "shared.email@example.com",
        })
        expect(foundUsers.length).toBe(4)
    })

    test("should findMany user with sort", async () => {
        const users = db.getCollection("users")

        const foundUsers = await users.findMany({}, {
            sort: {
                email: 'desc'
            }
        })
        expect(foundUsers[0]?.fullname).toBe("Tina King")
    })
})