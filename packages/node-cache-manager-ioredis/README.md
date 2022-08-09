[![codecov](https://codecov.io/gh/Tirke/node-cache-manager-ioredis/branch/main/graph/badge.svg?token=8B6YUE99N3)](https://codecov.io/gh/Tirke/node-cache-manager-ioredis)
[![npm version](https://badge.fury.io/js/@tirke%2Fnode-cache-manager-ioredis.svg)](https://badge.fury.io/js/@tirke%2Fnode-cache-manager-ioredis)
# IORedis store for node cache manager

This is a rewrite of [dabroek/node-cache-manager-ioredis](https://github.com/dabroek/node-cache-manager-ioredis).
It uses TypeScript with updated dependencies and missing features added.
It aims to provide **the most simple wrapper possible** by just passing the configuration to the underlying [`ioredis`](https://github.com/luin/ioredis) package.

Installation
------------

```sh
npm install @tirke/cache-manager-ioredis
```
```sh
yarn add @tirke/cache-manager-ioredis
```
```sh
pnpm add @tirke/cache-manager-ioredis
```

Usage Examples
--------------

### Using promises

```typescript
import RedisStore, { Store } from '@tirke/cache-manager-ioredis'
import { caching } from 'cache-manager'

const redisCache = caching({
  store: RedisStore,
  host: 'localhost', // default value
  port: 6379, // default value
  password: 'XXXXX',
  db: 0,
  ttl: 600,
})

// listen for redis connection error event
const cache = redisCache.store as Store
const redisClient = cache.getClient();
redisClient.on('error', (error: unknown) => {
  // handle error here
  console.log(error)
})

await redisCache.set('foo', 'bar', { ttl: 5 })
const result = await redisCache.get('foo')
await redisCache.del('foo')
```
