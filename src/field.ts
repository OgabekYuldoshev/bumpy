import type { Prettify } from "./types"
import { generateCuid } from "./utils"

export type Field<T> = Prettify<{
    readonly cuid: string,
    createdAt: string,
    updatedAt: string,
} & T>

export function createField<T extends object>(values: T): Field<T> {
    const field = Object.create(
        {
            ...values,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            cuid: {
                value: generateCuid(),
                writable: false,
                configurable: false,
                enumerable: true,
            }
        })

    return new Proxy(field, {
        set(target, p, newValue, receiver) {
            target.updatedAt = new Date().toISOString()
            return Reflect.set(target, p, newValue, receiver)
        },
    })
}
