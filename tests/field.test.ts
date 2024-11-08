import { describe, expect, test } from "vitest";
import { createField } from "../src/field";

describe("Field tests", () => {
    test("should create field", () => {
        const field = createField({
            name: "name",
            type: "string"
        })
        expect(field).toHaveProperty("cuid");
        expect(field).toHaveProperty("name");
        expect(field).not.toHaveProperty("test");
    })
})