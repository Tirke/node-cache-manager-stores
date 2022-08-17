import { Cache, caching } from 'cache-manager'
import Redis, { Callback, RedisOptions } from 'ioredis'

import { IoRedisStore, Store } from './node-cache-manager-ioredis'

let redisCache: Cache
let customRedisCache: Cache

const TTL_NO_EXPIRE = -2

const config = {
  host: '127.0.0.1',
  port: 6379,
  password: undefined,
  db: 0,
  ttl: 5,
}

beforeEach((done) => {
  redisCache = caching({
    store: IoRedisStore,
    ttl: config.ttl,
    instanceConfig: {
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
    },
  })

  customRedisCache = caching({
    store: IoRedisStore,
    instanceConfig: {
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
    },
    ttl: config.ttl,
    isCacheableValue: (val) => {
      if (val === undefined) {
        return true
      }
      return val !== 'FooBarString'
    },
  })
  ;(redisCache.store as Store).getClient().once('ready', () => redisCache.reset(done))
})

describe('init', () => {
  it('should create a store with password instead of auth_pass (auth_pass is deprecated for redis > 2.5)', (done) => {
    const redisPwdCache = caching({
      store: IoRedisStore,
      ttl: config.ttl,
      instanceConfig: {
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.db,
      },
    })

    const cache = redisPwdCache.store as Store
    const opts = cache.getClient().options as RedisOptions

    expect(opts.password).toEqual(null)
    redisPwdCache.set('pwdfoo', 'pwdbar', { ttl: 12 }, (err) => {
      expect(err).toEqual(null)
      redisCache.del('pwdfoo', (errDel) => {
        expect(errDel).toEqual(null)
        done()
      })
    })
  })

  it('should create a store with an external Redis instance', (done) => {
    const externalRedisInstanceCache = caching({
      store: IoRedisStore,
      redisInstance: new Redis({
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.db,
      }),
      ttl: config.ttl,
    })

    const cache = externalRedisInstanceCache.store as Store
    const opts = cache.getClient().options as RedisOptions

    expect(opts.password).toEqual(null)
    externalRedisInstanceCache.set('extfoo', 'extbar', { ttl: 12 }, (err) => {
      expect(err).toEqual(null)
      redisCache.del('extfoo', (errDel) => {
        expect(errDel).toEqual(null)
        done()
      })
    })
  })
})

describe('set', () => {
  it('should return a promise', async () => {
    expect(redisCache.set('foo', 'bar')).toBeInstanceOf(Promise)
  })

  it('should resolve promise on success', async () => {
    expect(await redisCache.set('foo', 'bar')).toEqual('OK')
  })

  it('should store a value without ttl', async () => {
    expect(await redisCache.set('foo', 'bar')).toEqual('OK')
  })

  it('should store a value with a specific ttl', async () => {
    expect(await redisCache.set('foo', 'bar', config.ttl)).toEqual('OK')
    expect(await redisCache.store.ttl?.('foo')).toEqual(config.ttl)
  })

  it('should store a value with a infinite ttl', async () => {
    expect(await redisCache.set('foo', 'bar', 0)).toEqual('OK')
    expect(await redisCache.store.ttl?.('foo')).toEqual(-1)
  })

  it('should store a value without callback', async () => {
    await redisCache.set('foo', 'baz')
    expect(await redisCache.get('foo')).toEqual('baz')
  })

  it('should not store undefined', async () => {
    expect.assertions(1)
    await expect(redisCache.set('foo', undefined)).rejects.toEqual(Error('undefined is not cacheable'))
  })

  it('should not store null', async () => {
    expect.assertions(1)
    await expect(redisCache.set('foo', null)).rejects.toEqual(Error('null is not cacheable'))
  })

  it('should store an undefined value if permitted by isCacheableValue', async () => {
    const cache = customRedisCache.store as Store
    expect(cache.isCacheableValue(undefined)).toBe(true)
    await customRedisCache.set('foo3', undefined)
    expect(await customRedisCache.get('foo3')).toBe('undefined')
  })

  it('should throw on circular object stringifies', async () => {
    const allowNullCache = caching({
      store: IoRedisStore,
      instanceConfig: {
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.db,
      },
      ttl: config.ttl,
      isCacheableValue: () => {
        return true
      },
    })
    const foo: { a: any } = { a: undefined }
    foo.a = foo
    await expect(allowNullCache.set('foo3', foo)).rejects.toThrow()
  })

  it('should not store a value disallowed by isCacheableValue', async () => {
    const cache = customRedisCache.store as Store
    expect(cache.isCacheableValue('FooBarString')).toBe(false)
    await expect(customRedisCache.set('foo', 'FooBarString')).rejects.toEqual(Error('FooBarString is not cacheable'))
  })

  it('should return an error if there is an error acquiring a connection', async () => {
    const cache = redisCache.store as Store
    await cache.getClient().quit()
    await expect(redisCache.set('foo', 'bar')).rejects.toEqual(Error('Connection is closed.'))
  })
})

describe('get', () => {
  it('should return a promise', async () => {
    expect(redisCache.get('foo')).toBeInstanceOf(Promise)
  })

  it('should retrieve a value for a given key', async () => {
    const value = 'bar'
    await redisCache.set('foo', value)
    expect(await redisCache.get('foo')).toEqual(value)
  })

  it('should reject promise on error', async () => {
    const cache = redisCache.store as Store
    await cache.getClient().quit()
    await expect(redisCache.get('foo')).rejects.toEqual(Error('Connection is closed.'))
  })

  it('should retrieve a value using a callback', (done) => {
    const value = 'bar'
    redisCache.set('foo', value, { ttl: 12 }, () => {
      redisCache.get('foo', (err, result) => {
        expect(err).toEqual(null)
        expect(result).toEqual(value)
        done()
      })
    })
  })

  it('should return null when the key is invalid', async () => {
    expect(await redisCache.get('invalidKey')).toBeNull()
  })

  it('should return an error if there is an error acquiring a connection', async () => {
    const cache = redisCache.store as Store
    await cache.getClient().quit()
    await expect(redisCache.get('foo')).rejects.toEqual(Error('Connection is closed.'))
  })
})

describe('mget', () => {
  it('should retrieve multiple values', async () => {
    await redisCache.set('foo', 'bar')
    await redisCache.set('baz', 'foo')
    expect(await redisCache.store.mget?.(['foo', 'baz', null])).toEqual(['bar', 'foo', null])
  })

  it('should retrieve multiple values with options', (done) => {
    redisCache.set('foo', 'bar', 12, () => {
      redisCache.set('foo1', 'bar1', 12, () => {
        redisCache.store
          .mget?.(['foo', 'foo1', 'foo2'], {}, (err: any, result: any) => {
            expect(err).toEqual(null)
            expect(result).toEqual(['bar', 'bar1', null])
            done()
          })
          .catch((err) => done(err))
      })
    })
  })

  it('should retrieve multiple values with options and varargs', async () => {
    await redisCache.set('foo', 'bar')
    await redisCache.set('baz', 'foo')
    expect(await redisCache.store.mget?.('foo', 'baz', 'bar', {})).toEqual(['bar', 'foo', null])
  })

  it('should return an error if there is an error acquiring a connection', async () => {
    const cache = redisCache.store as Store
    await cache.getClient().quit()
    await expect(cache.mget('foo')).rejects.toEqual(Error('Connection is closed.'))
  })
})

describe('del', () => {
  it('should delete a value for a given key', async () => {
    await redisCache.set('foo', 'bar')
    expect(await redisCache.del('foo')).toEqual(1)
    expect(await redisCache.get('foo')).toEqual(null)
  })

  it('should return an error if there is an error acquiring a connection', async () => {
    const cache = redisCache.store as Store
    await cache.getClient().quit()
    await expect(redisCache.del('foo')).rejects.toEqual(Error('Connection is closed.'))
  })
})

describe('reset', () => {
  it('should flush underlying db', async () => {
    await expect(redisCache.reset()).resolves.not.toThrow()
  })

  it('should return an error if there is an error acquiring a connection', async () => {
    const cache = redisCache.store as Store
    await cache.getClient().quit()
    await expect(redisCache.reset()).rejects.toEqual(Error('Connection is closed.'))
  })
})

describe('ttl', () => {
  it('should retrieve ttl for a given key', async () => {
    await redisCache.set('foo', 'bar')
    expect(await redisCache.store.ttl?.('foo')).toEqual(config.ttl)
  })

  it('should retrieve ttl for an invalid key', async () => {
    expect(await redisCache.store.ttl?.('invalid')).toEqual(TTL_NO_EXPIRE)
  })

  it('should return an error if there is an error acquiring a connection', async () => {
    const cache = redisCache.store as Store
    await cache.getClient().quit()
    await expect(cache.ttl('toto')).rejects.toEqual(Error('Connection is closed.'))
  })

  it('external Redis instance should respect top level ttl', async () => {
    const externalRedisInstanceCache = caching({
      store: IoRedisStore,
      redisInstance: new Redis({
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.db,
      }),
      ttl: 120,
    })

    await externalRedisInstanceCache.set('foo', 'bar')
    expect(await externalRedisInstanceCache.store.ttl?.('foo')).toEqual(120)
  })
})

describe('keys', () => {
  it('should return a promise', async () => {
    expect(redisCache.store.keys?.('foo')).toBeInstanceOf(Promise)
  })

  it('should return an array of keys for the given pattern', async () => {
    await redisCache.set('foo', 'bar')
    expect(await redisCache.store.keys?.('f*')).toEqual(['foo'])
  })

  it('should return an array of keys for the given pattern with callback', (done) => {
    redisCache.set('foo', 'bar', 12, () => {
      redisCache.store.keys?.((err: any, result: any) => {
        expect(err).toEqual(null)
        expect(result).toEqual(['foo'])
        done()
      })
    })
  })

  it('should return an array of keys without pattern', async () => {
    await redisCache.set('foo', 'bar')
    expect(await redisCache.store.keys?.()).toEqual(['foo'])
  })

  it('should return an error if there is an error acquiring a connection', async () => {
    const cache = redisCache.store as Store
    await cache.getClient().quit()
    await expect(cache.keys('toto')).rejects.toEqual(Error('Connection is closed.'))
  })
})

describe('isCacheableValue', () => {
  it('should return true when the value is not undefined', () => {
    const cache = redisCache.store as Store
    expect(cache.isCacheableValue(0)).toBe(true)
    expect(cache.isCacheableValue(100)).toBe(true)
    expect(cache.isCacheableValue('')).toBe(true)
    expect(cache.isCacheableValue('test')).toBe(true)
  })

  it('should return false when the value is undefined', () => {
    const cache = redisCache.store as Store
    expect(cache.isCacheableValue(undefined)).toBe(false)
  })

  it('should return false when the value is null', () => {
    const cache = redisCache.store as Store
    expect(cache.isCacheableValue(null)).toBe(false)
  })
})

describe('redis error event', () => {
  it('should return an error when the redis server is unavailable', (done) => {
    const cache = customRedisCache.store as Store
    cache.getClient().on('error', (err) => {
      expect(err).not.toEqual(null)
      done()
    })
    cache.getClient().emit('error', 'Something unexpected')
  })
})

describe('defaults are set by redis itself', () => {
  let defaultRedisCache: Cache

  beforeEach(() => {
    defaultRedisCache = caching({
      store: IoRedisStore,
      ttl: 12,
    })
  })

  it('should default the host to `127.0.0.1`', () => {
    const cache = defaultRedisCache.store as Store
    const redis = cache.getClient() as Redis
    expect(redis.options.host).toEqual('localhost')
  })

  it('should default the port to 6379', () => {
    const cache = defaultRedisCache.store as Store
    const redis = cache.getClient() as Redis
    expect(redis.options.port).toEqual(6379)
  })
})

describe('wrap function', () => {
  // Simulate retrieving a user from a database
  function getUser(id: number, cb: (err: Error | null, user?: { id: number }) => void) {
    setTimeout(() => {
      cb(null, { id: id })
    }, 100)
  }

  // Simulate retrieving a user from a database with Promise
  async function getUserPromise(id: number): Promise<{ id: number }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ id: id })
      }, 100)
    })
  }

  it('should be able to cache objects', (done) => {
    const userId = 123
    redisCache.wrap(
      'wrap-user',
      (cb: Callback) => {
        getUser(userId, cb)
      },
      (err, user) => {
        expect(err).toBeNull()
        expect(user.id).toEqual(userId)
        redisCache.wrap(
          'wrap-user',
          (cb: Callback) => {
            getUser(userId + 1, cb)
          },
          (err, user) => {
            expect(err).toBeNull()
            expect(user.id).toEqual(userId)
            done()
          },
        )
      },
    )
  })

  it('should work with promises', async () => {
    const userId = 123

    const user = await redisCache.wrap('wrap-promise', () => getUserPromise(userId))
    expect(user.id).toEqual(userId)
    const cached = await redisCache.wrap('wrap-promise', () => getUserPromise(userId + 1))
    expect(cached.id).toEqual(userId)
  })
})
