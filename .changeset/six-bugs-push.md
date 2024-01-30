---
"@tirke/node-cache-manager-mongodb": minor
---

Can now specify a custom collection name.
Default collection name will remain cache if unspecified.

```typescript
import { caching } from 'cache-manager'

import { mongoDbStore } from './node-cache-manager-mongodb'

const mongoCache = await caching(mongoDbStore, {
  url: 'mongodb://localhost:27017',
  collectionName: 'custom-collection-name',
  mongoConfig: { auth: { password: '<password>', username: '<user>' } },
})
```
