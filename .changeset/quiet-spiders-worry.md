---
'@tirke/node-cache-manager-ioredis': major
---

Changed import from default to named one

Package was previously imported as a default import
```typescript
import RedisStore from '@tirke/cache-manager-ioredis'
```

This could lead to some difficulties when transpiling and importing with require in node.

The package is now exporting a new named import
```typescript
import { IoRedisStore } from '@tirke/cache-manager-ioredis'
```

