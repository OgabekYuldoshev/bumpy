import { describe, expect, test } from "vitest";
import { createBumpy } from "../src/createBumpy";
import { z } from "zod";

describe("Dumpy Database tests", () => {
  test("Test", async () => {
    const db = await createBumpy({
      path: './meta/db.json',
      schema: {
        utils: z.object({
          test: z.string()
        })
      }
    })


    expect(db.name).toBe("db")
    expect(db.utils()).toBe("Salom")
  })
})