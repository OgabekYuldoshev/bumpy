Bumpy is a lightweight, schema-validated document database for Node.js applications that stores data in JSON files. It provides a simple yet powerful API for performing CRUD operations with TypeScript support.

## Installation

```bash
npm install bumpy-fs
# or
yarn add bumpy-fs
```

## Basic Usage

```typescript
import { createBumpy, createCollection } from 'bumpy';
import { z } from 'zod';

// Define your schema
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0)
});

// Create a collection
const Users = createCollection({
  name: 'users',
  schema: UserSchema
});

// Create the database
const db = createBumpy({
  basePath: './data/db.json',
  collections: [Users]
});

// Initialize the database
await db.initialize()

// Get collection reference
const users = db.getCollection('users');

// Start using the database
await users.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});
```

## API Reference

### Creating a Database

#### `createBumpy(options)`

Creates a new database instance.

```typescript
interface BumpyOptions<C> {
  basePath: string;      // Path to the JSON file
  collections: C[];      // Array of collections
}

const db = await createBumpy({
  basePath: './data/db.json',
  collections: [Users]
});
```

### Creating Collections

#### `createCollection(options)`

Creates a new collection with schema validation.

```typescript
interface Collection<N, S> {
  name: N;              // Collection name
  schema: S;            // Zod schema
}

const Users = createCollection({
  name: 'users',
  schema: UserSchema
});
```

### Collection Operations

Each collection provides the following operations:

#### Create Operations

```typescript
// Create a single document
const create = async (data: T) => Promise<T & BaseFields>

// Create multiple documents
const createMany = async (data: T[]) => Promise<(T & BaseFields)[]>
```

#### Read Operations

```typescript
// Find a single document
const findOne = async (query: Query) => Promise<T | null>

// Find multiple documents
const findMany = async (query: Query, options?: FindOptions) => Promise<T[]>

// Count documents
const count = async (query?: Query) => Promise<number>

interface FindOptions {
  sort?: {
    [key: string]: 'asc' | 'desc'
  }
}
```

#### Update Operations

```typescript
// Update a single document
const update = async (query: Query, data: Partial<T>) => Promise<T | null>

// Update multiple documents
const updateMany = async (query: Query, data: Partial<T>) => Promise<T[]>
```

#### Delete Operations

```typescript
// Delete a single document
const delete = async (query: Query) => Promise<boolean>

// Delete multiple documents
const deleteMany = async (query: Query) => Promise<number>
```

### Base Fields

Every document automatically includes these base fields:

```typescript
interface BaseFields {
  id: string;           // Unique identifier
  createdAt: string;    // ISO date string
  updatedAt: string;    // ISO date string
}
```

### Querying

Bumpy uses MongoDB-like query syntax powered by the `sift` library:

```typescript
// Find by exact match
await users.findOne({ name: 'John Doe' });

// Use operators
await users.findMany({ age: { $gt: 21 } });

// Complex queries
await users.findMany({
  $and: [
    { age: { $gte: 18 } },
    { email: { $regex: /@gmail\.com$/ } }
  ]
});
```

### Sorting

You can sort results using the `sort` option:

```typescript
await users.findMany(
  { age: { $gt: 18 } },
  {
    sort: {
      age: 'desc',
      name: 'asc'
    }
  }
);
```

## Examples

### Complete CRUD Example

```typescript
// Initialize database
const db = await createBumpy({
  basePath: './data/db.json',
  collections: [Users]
});

const users = db.getCollection('users');

// Create
const user = await users.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

// Read
const foundUser = await users.findOne({ id: user.id });
const allAdults = await users.findMany({ age: { $gte: 18 } });

// Update
const updated = await users.update(
  { id: user.id },
  { age: 31 }
);

// Delete
const deleted = await users.delete({ id: user.id });
```

### Bulk Operations Example

```typescript
// Create multiple users
const newUsers = await users.createMany([
  { name: 'Alice', email: 'alice@example.com', age: 25 },
  { name: 'Bob', email: 'bob@example.com', age: 30 }
]);

// Update multiple users
const updated = await users.updateMany(
  { age: { $lt: 30 } },
  { status: 'young' }
);

// Delete multiple users
const deletedCount = await users.deleteMany({ age: { $lt: 18 } });
```

## Error Handling

Bumpy uses Zod for schema validation and will throw validation errors if the data doesn't match the schema. It's recommended to wrap operations in try-catch blocks:

```typescript
try {
  await users.create({
    name: 'John',
    email: 'invalid-email',  // Will throw validation error
    age: 30
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Validation failed:', error.errors);
  } else {
    console.error('Operation failed:', error);
  }
}
```

## Best Practices

1. Always define schemas for your collections to ensure data integrity
2. Use TypeScript for better type safety and autocompletion
3. Handle validation errors appropriately
4. Use query operators for complex queries
5. Consider using indexes for large datasets (not yet implemented)
6. Backup your JSON database file regularly
7. Don't use this for large-scale applications where a traditional database would be more appropriate

## Limitations

1. No support for relationships/joins between collections
2. All data is loaded into memory
3. No built-in indexing
4. Not suitable for concurrent access by multiple processes
5. Limited query performance for large datasets

The library is best suited for:
- Small to medium-sized applications
- Development and prototyping
- Applications with simple data requirements
- Single-process applications
- Scenarios where a full database server is overkill