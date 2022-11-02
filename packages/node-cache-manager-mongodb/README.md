[![npm version](https://badge.fury.io/js/@tirke%2Fnode-cache-manager-mongodb.svg)](https://badge.fury.io/js/@tirke%2Fnode-cache-manager-mongodb)

# MongoDB store for node cache manager

MongoDB cache store for [node-cache-manager](https://github.com/BryanDonovan/node-cache-manager).
This is a rewrite of [v4l3r10/node-cache-manager-mongodb](https://github.com/v4l3r10/node-cache-manager-mongodb).

## Installation

```sh
npm install @tirke/node-cache-manager-mongodb
```

```sh
yarn add @tirke/node-cache-manager-mongodb
```

```sh
pnpm add @tirke/node-cache-manager-mongodb
```

## Usage Examples

### Init

I wanted to provide more type-safe ways to init the `cache-manager`.

```typescript
import { caching } from 'cache-manager'

import { mongoDbStore } from './node-cache-manager-mongodb'

const mongoCache = await caching(mongoDbStore, {
  url: 'mongodb://localhost:27017',
  mongoConfig: { auth: { password: '<password>', username: '<user>' } },
})
```

### Generic usage with promises

```typescript
import { caching } from 'cache-manager'

import { mongoDbStore } from './node-cache-manager-mongodb'

const mongoCache = await caching(mongoDbStore, {
  url: 'mongodb://localhost:27017',
  mongoConfig: { auth: { password: '<password>', username: '<user>' } },
})

await mongoCache.set('foo', 'bar', { ttl: 5 })
const result = await mongoCache.get('foo')
await mongoCache.del('foo')
```
