import type { Store, Config, Cache } from 'cache-manager'
import Redis, { ClusterOptions, Cluster, ClusterNode, RedisOptions, RedisKey } from 'ioredis'

export type RedisCache = Cache<IoRedisStore>

interface IoRedisStore extends Store {
  readonly isCacheable: (value: unknown) => boolean

  get client(): Redis | Cluster
}

type ClusterConfig = {
  nodes: ClusterNode[]
  options?: ClusterOptions
}

type Args = {
  redisInstance?: Redis | Cluster
  clusterConfig?: ClusterConfig
  instanceConfig?: RedisOptions
} & Config &
  RedisOptions

const getVal = (value: unknown) => JSON.stringify(value) || '"undefined"'

class RedisStore implements IoRedisStore {
  public readonly client!: Redis | Cluster
  readonly internalTtl: number | undefined
  readonly isCacheable: (value: unknown) => boolean

  constructor(args: Args) {
    this.internalTtl = args.ttl
    this.isCacheable = args.isCacheable || ((value: unknown) => value !== undefined && value !== null)

    if (args.instanceConfig) {
      this.client = new Redis(args.instanceConfig)
    }

    if (args.clusterConfig) {
      this.client = new Redis.Cluster(args.clusterConfig.nodes, args.clusterConfig.options)
    }

    if (args.redisInstance) {
      this.client = args.redisInstance
    }

    if (!args.instanceConfig && !args.clusterConfig && !args.redisInstance) {
      this.client = new Redis(args)
    }
  }

  async set<T>(key: RedisKey, value: T, ttl?: number) {
    if (!this.isCacheable(value)) {
      throw new Error(`${value} is not cacheable`)
    }
    const actualTtl = ttl ?? this.internalTtl

    if (actualTtl) {
      await this.client.setex(key, actualTtl, getVal(value))
    } else {
      await this.client.set(key, getVal(value))
    }
  }

  async get<T>(key: RedisKey): Promise<T | undefined> {
    const value = await this.client.get(key)
    if (value === null || value === undefined) {
      return undefined
    }

    return JSON.parse(value)
  }

  async mset(args: [string, unknown][], ttl?: number) {
    const actualTtl = ttl ?? this.internalTtl
    if (actualTtl) {
      const multi = this.client.multi()
      for (const [key, value] of args) {
        if (!this.isCacheable(value)) {
          throw new Error(`${value} is not cacheable`)
        }
        multi.setex(key, actualTtl, getVal(value))
      }
      await multi.exec()
      return
    }

    await this.client.mset(
      args.flatMap(([key, value]) => {
        if (!this.isCacheable(value)) {
          throw new Error(`${value} is not cacheable`)
        }
        return [key, getVal(value)]
      }),
    )
  }

  async mget(...args: string[]) {
    const values = await this.client.mget(args)
    return values.map((val) => (val === null || val === undefined ? undefined : (JSON.parse(val) as unknown)))
  }

  async mdel(...args: string[]) {
    await this.client.del(args)
  }

  async del(key: RedisKey) {
    await this.client.del(key)
  }

  async reset() {
    await this.client.flushall()
  }

  async keys(pattern = '*') {
    return this.client.keys(pattern)
  }

  async ttl(key: string) {
    return this.client.ttl(key)
  }
}

export const ioRedisStore = async (args?: Args) => {
  if (!args) {
    return new RedisStore({})
  }

  return new RedisStore(args)
}
