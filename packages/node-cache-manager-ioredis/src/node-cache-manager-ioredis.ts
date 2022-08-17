import Redis, { ClusterOptions, Cluster, ClusterNode, RedisOptions, RedisKey } from 'ioredis'

type ClusterConfig = {
  nodes: ClusterNode[]
  options?: ClusterOptions
}

type CreateArgs = {
  store: { create: (args: CreateArgs) => RedisStore }
  isCacheableValue?: (value: any) => boolean
  ttl?: number
  redisInstance?: Redis | Cluster
  clusterConfig?: ClusterConfig
  instanceConfig?: RedisOptions
}

type Callback<T> = (error: any, result: T | undefined) => void
type NumberCallback = (error: any, result: number | undefined) => void
type ErrorCallback = (error: any) => void

type Args = {
  store: { create: (args: CreateArgs) => RedisStore }
  isCacheableValue: (value: any) => boolean
  ttl?: number
  redisInstance?: Redis | Cluster
  clusterConfig?: ClusterConfig
  instanceConfig?: RedisOptions
}

export type Store = RedisStore

type RedisValue = string | Buffer | number

class RedisStore {
  private readonly client!: Redis | Cluster
  readonly internalTtl: number | undefined
  readonly isCacheableValue: (value: any) => boolean

  constructor(args: Args) {
    this.internalTtl = args.ttl
    this.isCacheableValue = args.isCacheableValue

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
      this.client = new Redis()
    }
  }

  getClient() {
    return this.client
  }

  set(
    key: RedisKey,
    value: RedisValue,
    options?:
      | {
      ttl?: number
    }
      | number,
    cb?: ErrorCallback,
  ) {
    return new Promise((resolve, reject) => {
      if (!cb) {
        cb = (err: any, result?: any) => (err ? reject(err) : resolve(result))
      }

      if (!this.isCacheableValue(value)) {
        return cb(new Error(`${value} is not cacheable`))
      }

      const val = JSON.stringify(value) || '"undefined"'
      const ttl = (typeof options === 'number' ? options : options?.ttl) ?? this.internalTtl

      if (ttl) {
        this.client.setex(key, ttl, val, handleResponse(cb))
      } else {
        this.client.set(key, val, handleResponse(cb))
      }
    })
  }

  async get<T>(key: RedisKey, options: Record<string, unknown> | Callback<T>, cb?: Callback<T>) {
    return new Promise((resolve, reject) => {
      if (typeof options === 'function') {
        cb = options as Callback<T>
      }

      if (!cb) {
        cb = (err: any, result?: any) => (err ? reject(err) : resolve(result))
      }

      this.client.get(key, handleResponse(cb, { parse: true }))
    })
  }

  async mget<T>(...args: any[]) {
    let cb: Callback<T>

    if (typeof args[args.length - 1] === 'function') {
      cb = args.pop()
    }

    if (isObject(args[args.length - 1])) {
      args.pop()
    }

    if (Array.isArray(args[0])) {
      args = args[0]
    }

    return new Promise((resolve, reject) => {
      if (!cb) {
        cb = (err: any, result?: any) => (err ? reject(err) : resolve(result))
      }
      this.client.mget(args, handleResponse(cb, { parse: true }))
    })
  }

  async del(key: RedisKey, cb?: NumberCallback) {
    return new Promise((resolve, reject) => {
      if (!cb) {
        cb = (err: any, result?: number) => (err ? reject(err) : resolve(result))
      }

      this.client.del(key, handleResponse(cb))
    })
  }

  async reset<T>(cb?: Callback<T>) {
    return new Promise((resolve, reject) => {
      if (!cb) {
        cb = (err: any, result?: any) => (err ? reject(err) : resolve(result))
      }
      this.client.flushdb(handleResponse(cb))
    })
  }

  async keys<T>(pattern?: string | Callback<T>, cb?: Callback<T>) {
    return new Promise((resolve, reject) => {
      if (typeof pattern === 'function') {
        cb = pattern as Callback<T>
        pattern = '*'
      }

      if (!pattern) {
        pattern = '*'
      }

      if (!cb) {
        cb = (err: any, result?: any) => (err ? reject(err) : resolve(result))
      }
      this.client.keys(pattern, handleResponse(cb))
    })
  }

  async ttl<T>(key: string, cb?: Callback<T>) {
    return new Promise((resolve, reject) => {
      if (!cb) {
        cb = (err: any, result?: any) => (err ? reject(err) : resolve(result))
      }

      this.client.ttl(key, handleResponse(cb))
    })
  }
}

function handleResponse(cb: (err: any, res?: any) => void, opts: { parse?: boolean } = {}) {
  return (err: any, result?: any) => {
    if (err) {
      return cb && cb(err)
    }

    if (opts.parse) {
      const isMultiple = Array.isArray(result)
      if (!isMultiple) {
        result = [result]
      }

      result = result.map((res: any) => JSON.parse(res))
      result = isMultiple ? result : result[0]
    }

    return cb && cb(null, result)
  }
}

function isObject(value: any): value is Record<string, unknown> {
  return value && value instanceof Object && value.constructor === Object
}

export default {
  create(args: CreateArgs) {
    const isCacheableValue = args.isCacheableValue || ((value) => value !== undefined && value !== null)
    return new RedisStore({ ...args, isCacheableValue })
  },
}
