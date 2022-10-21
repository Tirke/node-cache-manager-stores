[![codecov](https://codecov.io/gh/Tirke/node-cache-manager-ioredis/branch/main/graph/badge.svg?token=8B6YUE99N3)](https://codecov.io/gh/Tirke/node-cache-manager-ioredis)
[![npm version](https://badge.fury.io/js/@tirke%2Fnode-cache-manager-ioredis.svg)](https://badge.fury.io/js/@tirke%2Fnode-cache-manager-ioredis)

# IORedis store for node cache manager

Redis cache store for [node-cache-manager](https://github.com/BryanDonovan/node-cache-manager).

This is a rewrite of [dabroek/node-cache-manager-ioredis](https://github.com/dabroek/node-cache-manager-ioredis).
It uses TypeScript with updated dependencies and missing features added.
It aims to provide **the most simple wrapper possible** by just passing the configuration to the underlying [`ioredis`](https://github.com/luin/ioredis) package.

## Installation

```sh
npm install @tirke/node-cache-manager-ioredis
```

```sh
yarn add @tirke/node-cache-manager-ioredis
```

```sh
pnpm add @tirke/node-cache-manager-ioredis
```

## Usage Examples

All examples have changed a bit since the new major version of `node-cache-manager`

### Init

I wanted to provide more type-safe ways to init the `cache-manager`.

```typescript
import { IoRedisStore, Store } from '@tirke/node-cache-manager-ioredis'
import { caching } from 'cache-manager'

// Default
const defaultRedisCache = caching({
  store: IoRedisStore,
  host: 'localhost', // default value
  port: 6379, // default value
  password: 'XXXXX',
  db: 0,
  ttl: 600,
})

// With instanceConfig acceptingt type RedisOptions
const instanceRedisCache = caching({
  store: IoRedisStore,
  instanceConfig: {
    host: 'localhost', // default value
    port: 6379, // default value
    password: 'XXXXX',
  },
  ttl: 600,
})

// With clusterConfig acceptingt type ClusterConfig
const clusterRedisCache = caching({
  store: IoRedisStore,
  clusterConfig: {
    nodes: [
      { port: 6380, host: '127.0.0.1' },
      { port: 6381, host: '127.0.0.1' },
    ],
  },
  ttl: 600,
})

// Finaly passing a instiantiated IORedis instance type Redis | Cluster
import Redis from 'ioredis'
const instance = new Redis()
const instantiatedRedisCache = caching({
  store: IoRedisStore,
  redisInstance: instance,
  ttl: 600,
})
```

### Generic usage with promises

```typescript
import { IoRedisStore, Store } from '@tirke/node-cache-manager-ioredis'
import { caching } from 'cache-manager'

const redisCache = caching({
  store: IoRedisStore,
  host: 'localhost', // default value
  port: 6379, // default value
  password: 'XXXXX',
  db: 0,
  ttl: 600,
})

// listen for redis connection error event
const cache = redisCache.store as Store
const redisClient = cache.getClient()
redisClient.on('error', (error: unknown) => {
  // handle error here
  console.log(error)
})

await redisCache.set('foo', 'bar', { ttl: 5 })
const result = await redisCache.get('foo')
await redisCache.del('foo')
```
