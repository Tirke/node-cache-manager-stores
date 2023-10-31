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
Everything is now based on promises everywhere, no more callbacks.

### TTL

TTL value is forwarded directly to ioredis which uses seconds as unit.

### Init

I wanted to provide more type-safe ways to init the `cache-manager`.

```typescript
import { ioRedisStore } from '@tirke/node-cache-manager-ioredis'
import { caching } from 'cache-manager'

// Default
const defaultRedisCache = caching(ioRedisStore, {
  host: 'localhost', // default value
  port: 6379, // default value
  password: 'XXXXX',
  ttl: 60,
})

// With instanceConfig accepting type RedisOptions
const instanceRedisCache = caching(ioRedisStore, {
  instanceConfig: {
    host: 'localhost', // default value
    port: 6379, // default value
    password: 'XXXXX',
  },
  ttl: 60,
})

// With clusterConfig accepting type ClusterConfig
const clusterRedisCache = caching(ioRedisStore, {
  clusterConfig: {
    nodes: [
      { port: 6380, host: '127.0.0.1' },
      { port: 6381, host: '127.0.0.1' },
    ],
  },
  ttl: 60,
})

// Finally passing a instiantiated IORedis instance type Redis | Cluster
import Redis from 'ioredis'
const instance = new Redis()
const instantiatedRedisCache = caching(ioRedisStore, {
  redisInstance: instance,
  ttl: 60,
})
```

### Generic usage

```typescript
import { ioRedisStore, RedisCache } from '@tirke/node-cache-manager-ioredis'
import { caching } from 'cache-manager'

const redisCache: RedisCache = caching(ioRedisStore, {
  host: 'localhost', // default value
  port: 6379, // default value
  password: 'XXXXX',
  ttl: 600,
})

// listen for redis connection error event
const cache = redisCache.store
cache.client.on('error', (error: unknown) => {
  // handle error here
  console.log(error)
})

await redisCache.set('foo', 'bar', { ttl: 5 })
const result = await redisCache.get('foo')
await redisCache.del('foo')
```

### Flush all DBs
```typescript
import { ioRedisStore, RedisCache } from '@tirke/node-cache-manager-ioredis'
import { caching } from 'cache-manager'

const redisCache: RedisCache = caching(ioRedisStore, {
  host: 'localhost', // default value
  port: 6379, // default value
  password: 'XXXXX',
  ttl: 600,
})

// listen for redis connection error event
const cache = redisCache.store
cache.client.on('error', (error: unknown) => {
  // handle error here
  console.log(error)
})

// it uses `flushall` under the hood, so it drops all DBs
await redisCache.reset()
```
