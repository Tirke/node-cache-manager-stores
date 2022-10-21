---
'@tirke/node-cache-manager-ioredis': major
---

node-cache-manager-ioredis is now compatible with new cache-manager@5 major version

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
