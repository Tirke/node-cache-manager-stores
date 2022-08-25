---
'@tirke/node-cache-manager-ioredis': minor
---

README example was not working because the root params where not passed to the created IORedis instance.
This should now work. README now also contains intended ways to instantiate the cache-manager.
