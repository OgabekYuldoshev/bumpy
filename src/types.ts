import type { Query } from "sift";
import type { z } from "zod";

export type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

export type SnakeCase<T extends string> =
	T extends `${infer First}${infer Rest}`
	? `${First extends Lowercase<First> ? '' : '_'}${Lowercase<First>}${SnakeCase<Rest>}`
	: T;

export type InferSchema<T extends z.ZodSchema> = z.infer<T>;

export type Collection<Name extends string, Schema extends z.ZodSchema> = {
	readonly name: Name;
	readonly schema: Schema;
};

export type BumpyOptions<T extends Collection<string, z.ZodSchema>> = {
	basePath: string;
	collections: ReadonlyArray<T>;
};

export type WithBaseField<T> = Prettify<
	{
		readonly id: string;
		createdAt: Date;
		updatedAt: Date;
	} & T
>;

export type Data<T extends Collection<string, z.ZodSchema>> = Prettify<
	Record<
		T["name"],
		Prettify<Record<string, WithBaseField<InferSchema<T["schema"]>>>>
	>
>;

export type CollectionOperations<T extends Collection<string, z.ZodSchema>> = {
	[K in T["name"]]: T extends Collection<K, infer S extends z.ZodSchema>
	? Operations<S>
	: never;
};

export type SortOptions = {
	[key: string]: "asc" | "desc";
};

export type FindOptions = {
	sort?: SortOptions;
};

export type Operations<S extends z.ZodSchema> = {
	create: (data: InferSchema<S>) => Promise<WithBaseField<InferSchema<S>>>;
	createMany: (
		data: InferSchema<S>[],
	) => Promise<WithBaseField<InferSchema<S>>[]>;
	findOne: (
		query: Query<WithBaseField<InferSchema<S>>>,
	) => Promise<WithBaseField<InferSchema<S>> | null>;
	findMany: (
		query: Query<WithBaseField<InferSchema<S>>>,
		options?: FindOptions,
	) => Promise<WithBaseField<InferSchema<S>>[]>;
	update: (
		query: Query<WithBaseField<InferSchema<S>>>,
		data: Partial<InferSchema<S>>,
	) => Promise<WithBaseField<InferSchema<S>> | null>;
	updateMany: (
		query: Query<WithBaseField<InferSchema<S>>>,
		data: Partial<InferSchema<S>>,
	) => Promise<WithBaseField<InferSchema<S>>[]>;
	delete: (query: Query<WithBaseField<InferSchema<S>>>) => Promise<boolean>;
	deleteMany: (query: Query<WithBaseField<InferSchema<S>>>) => Promise<number>;
	count: (query?: Query<WithBaseField<InferSchema<S>>>) => Promise<number>;
};
