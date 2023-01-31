# @tirke/node-cache-manager-ioredis

## 3.1.0

### Minor Changes

- IoRedis package is now bundled with ESM and CJS compatibility ([#145](https://github.com/Tirke/node-cache-manager-stores/pull/145))

## 3.0.1

### Patch Changes

- [`64805e9`](https://github.com/Tirke/node-cache-manager-stores/commit/64805e9d6d7b6697fa783c3c000ed555bc4a8726) Thanks [@Tirke](https://github.com/Tirke)! - Correct package.json github repo links

## 3.0.0

### Major Changes

- [`40f233d`](https://github.com/Tirke/node-cache-manager-ioredis/commit/40f233d7756ca813a6e0d607054601e15b6840ff) Thanks [@Tirke](https://github.com/Tirke)! - node-cache-manager-ioredis is now compatible with new cache-manager@5 major version

  The new major version of `cache-manager` introduced breaking changes around the API to create a cache manager instance.
  I also had to rewrite most code because `cache-manager` is now based on promises everywhere so I could ditch the callbacks.
  Examples in the README have been updated to reflect the changes.

  For a before / after example:

  ```typescript
  // Before

  import { IoRedisStore } from '@tirke/node-cache-manager-ioredis'
  import { caching } from 'cache-manager'

  const redisCache = caching({
    store: IoRedisStore,
    host: 'localhost', // default value
    port: 6379, // default value
    password: 'XXXXX',
    ttl: 600,
  })
  ```

  ```typescript
  // After

  import { ioRedisStore, RedisCache } from '@tirke/node-cache-manager-ioredis'
  import { caching } from 'cache-manager'

  const redisCache: RedisCache = caching(ioRedisStore, {
    host: 'localhost', // default value
    port: 6379, // default value
    password: 'XXXXX',
    ttl: 600,
  })
  ```

## 2.1.0

### Minor Changes

- [`91269b6`](https://github.com/Tirke/node-cache-manager-ioredis/commit/91269b6f8e7e79514f7732a89847e7ee270b9183) Thanks [@Tirke](https://github.com/Tirke)! - README example was not working because the root params where not passed to the created IORedis instance.
  This should now work. README now also contains intended ways to instantiate the cache-manager.

## 2.0.1

### Patch Changes

- [`44b0b2e`](https://github.com/Tirke/node-cache-manager-ioredis/commit/44b0b2e8c15cb3cc12114990770bb3f2b1bc83b4) Thanks [@Tirke](https://github.com/Tirke)! - Put the correct package names in the READMEs

## 2.0.0

### Major Changes

- [`d4e0e63`](https://github.com/Tirke/node-cache-manager-ioredis/commit/d4e0e638ae1319bb049fd1a929a7a26ef13aee11) Thanks [@Tirke](https://github.com/Tirke)! - Changed import from default to named one

  Package was previously imported as a default import

  ```typescript
  import RedisStore from '@tirke/cache-manager-ioredis'
  ```

  This could lead to some difficulties when transpiling and importing with require in node.

  The package is now exporting a new named import

  ```typescript
  import { IoRedisStore } from '@tirke/cache-manager-ioredis'
  ```

## 1.0.3

### Patch Changes

- [`03da035`](https://github.com/Tirke/node-cache-manager-ioredis/commit/03da03593f981cebb13673f7dcc784ae4c4e99c3) Thanks [@Tirke](https://github.com/Tirke)! - Bump deps and revert index change

## 1.0.2

### Patch Changes

- [`3d6dfaa`](https://github.com/Tirke/node-cache-manager-ioredis/commit/3d6dfaaa248d3261329d48c6508d53ce505522ba) Thanks [@Tirke](https://github.com/Tirke)! - Removed index file at package root

## 1.0.1

### Patch Changes

- [`5757ee1`](https://github.com/Tirke/node-cache-manager-ioredis/commit/5757ee1785520207e946e8f2d134bc4048dd7240) Thanks [@Tirke](https://github.com/Tirke)! - updated package readme

## 1.0.0

### Major Changes

- [`3d03f2c`](https://github.com/Tirke/node-cache-manager-ioredis/commit/3d03f2c7fcafc0a424f96208defd6b35d2fbfc8f) Thanks [@Tirke](https://github.com/Tirke)! - Full TypeScript rewrite of node-cache-manager-ioredis with bumped dependencies and added features like `mget` and `del` returning a Promise.
