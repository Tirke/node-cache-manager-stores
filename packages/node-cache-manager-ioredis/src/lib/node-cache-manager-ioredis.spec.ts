import { caching } from 'cache-manager'
import Redis, { RedisOptions } from 'ioredis'

import { ioRedisStore, RedisCache } from './node-cache-manager-ioredis'

let redisCache: RedisCache
let customRedisCache: RedisCache

const TTL_NO_EXPIRE = -2

const config = {
  host: '127.0.0.1',
  port: 6379,
  password: undefined,
  db: 0,
}

beforeEach(async () => {
  // redisCache = await caching(ioRedisStore, {
  //   instanceConfig: {
  //     host: config.host,
  //     port: config.port,
  //     password: config.password,
  //     db: config.db,
  //   },
  // })
  //
  // await redisCache.reset()
  //
  // customRedisCache = await caching(ioRedisStore, {
  //   instanceConfig: {
  //     host: config.host,
  //     port: config.port,
  //     password: config.password,
  //     db: config.db,
  //   },
  //   isCacheable: (val) => {
  //     if (val === undefined) {
  //       return true
  //     }
  //     return val !== 'FooBarString'
  //   },
  // })
  //
  // await customRedisCache.reset()
})

describe('init', () => {
  it('should create a store with password instead of auth_pass (auth_pass is deprecated for redis > 2.5)', async () => {
    const redisPwdCache = await caching(ioRedisStore, {
      instanceConfig: {
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.db,
      },
    })

    const cache = redisPwdCache.store
    const opts = cache.client.options as RedisOptions

    expect(opts.password).toEqual(null)
    await expect(redisPwdCache.set('pwdfoo', 'pwdbar', 12)).resolves.not.toThrow()
  })

  it('should create a store with an external Redis instance', async () => {
    const externalRedisInstanceCache = await caching(ioRedisStore, {
      redisInstance: new Redis({
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.db,
      }),
    })

    const cache = externalRedisInstanceCache.store
    const opts = cache.client.options as RedisOptions

    expect(opts.password).toEqual(null)
    await expect(externalRedisInstanceCache.set('extfoo', 'extbar', 12)).resolves.not.toThrow()
  })

  it('should create a store without caching args', async () => {
    const noArgsInstance = await caching(ioRedisStore)
    await expect(noArgsInstance.set('extfoo', 'extbar', 12)).resolves.not.toThrow()
  })

  it('should create a store with a default ttl', async () => {
    const defaultTtlInstance = await caching(ioRedisStore, {
      instanceConfig: {
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.db,
      },
      ttl: 5,
    })
    await expect(defaultTtlInstance.set('extfoo', 'extbar')).resolves.not.toThrow()
    expect(await defaultTtlInstance.store.ttl('extfoo')).toEqual(5)
  })
})

describe('set', () => {
  it('should return a promise', async () => {
    expect(redisCache.set('foo', 'bar')).toBeInstanceOf(Promise)
  })

  it('should resolve promise on success', async () => {
    expect(await redisCache.set('foo', 'bar')).toBeUndefined()
  })

  it('should store a value without ttl', async () => {
    expect(await redisCache.set('foo', 'bar')).toBeUndefined()
  })

  it('should store a value with a specific ttl', async () => {
    expect(await redisCache.set('foo', 'bar', 34)).toBeUndefined()
    expect(await redisCache.store.ttl('foo')).toEqual(34)
  })

  it('should store a value with a infinite ttl', async () => {
    expect(await redisCache.set('foo', 'bar', 0)).toBeUndefined()
    expect(await redisCache.store.ttl('foo')).toEqual(-1)
  })

  it('should not store undefined', async () => {
    expect.assertions(1)
    await expect(redisCache.set('foo', undefined)).rejects.toEqual(Error('undefined is not cacheable'))
  })

  it('should not store null', async () => {
    expect.assertions(1)
    await expect(redisCache.set('foo', null)).rejects.toEqual(Error('null is not cacheable'))
  })

  it('should store an undefined value if permitted by isCacheable', async () => {
    const cache = customRedisCache.store
    expect(cache.isCacheable(undefined)).toBe(true)
    await customRedisCache.set('foo3', undefined)
    expect(await customRedisCache.get('foo3')).toBe('undefined')
  })

  it('should throw on circular object stringifies', async () => {
    const allowNullCache = await caching(ioRedisStore, {
      instanceConfig: {
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.db,
      },
      ttl: 18,
      isCacheable: () => {
        return true
      },
    })
    const foo: { a: any } = { a: undefined }
    foo.a = foo
    await expect(allowNullCache.set('foo3', foo)).rejects.toThrow()
  })

  it('should not store a value disallowed by isCacheable', async () => {
    const cache = customRedisCache.store
    expect(cache.isCacheable('FooBarString')).toBe(false)
    await expect(customRedisCache.set('foo', 'FooBarString')).rejects.toEqual(Error('FooBarString is not cacheable'))
  })

  it('should return an error if there is an error acquiring a connection', async () => {
    const cache = redisCache.store
    await cache.client.quit()
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
    const cache = redisCache.store
    await cache.client.quit()
    await expect(redisCache.get('foo')).rejects.toEqual(Error('Connection is closed.'))
  })

  it('should return null when the key is invalid', async () => {
    expect(await redisCache.get('invalidKey')).toBeUndefined()
  })

  it('should return an error if there is an error acquiring a connection', async () => {
    const cache = redisCache.store
    await cache.client.quit()
    await expect(redisCache.get('foo')).rejects.toEqual(Error('Connection is closed.'))
  })
})

describe('mget', () => {
  it('should retrieve multiple values', async () => {
    await redisCache.store.mset([
      ['foo', 'bar'],
      ['baz', 'foo'],
    ])
    expect(await redisCache.store.mget('foo', 'baz')).toEqual(['bar', 'foo'])
  })

  it('should retrieve multiple values with options', async () => {
    await redisCache.store.mset(
      [
        ['foo', 'bar'],
        ['foo1', 'bar1'],
      ],
      12,
    )

    expect(await redisCache.store.mget('foo', 'foo1')).toEqual(['bar', 'bar1'])
  })

  it('should return an error if there is an error acquiring a connection', async () => {
    const cache = redisCache.store
    await cache.client.quit()
    await expect(cache.mget('foo')).rejects.toEqual(Error('Connection is closed.'))
  })
})

describe('mset', () => {
  it('should store a value with default ttl', async () => {
    expect(
      await redisCache.store.mset([
        ['foo', 'bar'],
        ['foo2', 'bar2'],
      ]),
    ).toBeUndefined()
    expect(await redisCache.store.mget('foo', 'foo2')).toEqual(['bar', 'bar2'])
    expect(await redisCache.store.ttl('foo')).toEqual(-1)
  })

  it('should store a value with a specific ttl', async () => {
    expect(
      await redisCache.store.mset(
        [
          ['foo', 'bar'],
          ['foo2', 'bar2'],
        ],
        60,
      ),
    ).toBeUndefined()

    expect(await redisCache.store.ttl('foo')).toEqual(60)
  })

  it('should store a value with a infinite ttl', async () => {
    await redisCache.store.mset(
      [
        ['foo', 'bar'],
        ['foo2', 'bar2'],
      ],
      0,
    )
    expect(await redisCache.store.ttl('foo')).toEqual(-1)
  })

  it('should not be able to store a null value (not cacheable)', () =>
    expect(redisCache.store.mset([['foo2', null]])).rejects.toThrow())

  it('should not be able to store not cacheable value with ttl', () =>
    expect(redisCache.store.mset([['foo2', null]], 15)).rejects.toThrow())

  it('should store an undefined value if permitted by isCacheable', async () => {
    expect(customRedisCache.store.isCacheable(undefined)).toBe(true)
    await customRedisCache.store.mset([
      ['foo3', undefined],
      ['foo4', undefined],
    ])
    await expect(customRedisCache.store.mget('foo3', 'foo4')).resolves.toStrictEqual(['undefined', 'undefined'])
  })

  it('should not store a value disallowed by isCacheable', async () => {
    expect(customRedisCache.store.isCacheable('FooBarString')).toBe(false)
    await expect(customRedisCache.store.mset([['foobar', 'FooBarString']])).rejects.toBeDefined()
  })

  it('should return an error if there is an error acquiring a connection', async () => {
    await redisCache.store.client.disconnect()
    await expect(redisCache.store.mset([['foo', 'bar']])).rejects.toBeDefined()
  })
})

describe('del', () => {
  it('should delete a value for a given key', async () => {
    await redisCache.set('foo', 'bar')
    expect(await redisCache.del('foo')).toBeUndefined()
    expect(await redisCache.get('foo')).toBeUndefined()
  })

  it('should return an error if there is an error acquiring a connection', async () => {
    const cache = redisCache.store
    await cache.client.quit()
    await expect(redisCache.del('foo')).rejects.toEqual(Error('Connection is closed.'))
  })
})

describe('mdel', () => {
  it('should delete a unlimited number of keys', async () => {
    await redisCache.store.mset([
      ['foo', 'bar'],
      ['foo2', 'bar2'],
    ])
    expect(await redisCache.store.mdel('foo', 'foo2')).toBeUndefined()
    expect(await redisCache.store.mget('foo', 'foo2')).toEqual([undefined, undefined])
  })
})

describe('reset', () => {
  it('should flush underlying db', async () => {
    await expect(redisCache.reset()).resolves.not.toThrow()
  })

  it('should return an error if there is an error acquiring a connection', async () => {
    const cache = redisCache.store
    await cache.client.quit()
    await expect(redisCache.reset()).rejects.toEqual(Error('Connection is closed.'))
  })
})

describe('ttl', () => {
  it('should retrieve ttl for a given key', async () => {
    await redisCache.set('foo', 'bar', 18)
    expect(await redisCache.store.ttl('foo')).toEqual(18)
  })

  it('should retrieve ttl for an invalid key', async () => {
    expect(await redisCache.store.ttl('invalid')).toEqual(TTL_NO_EXPIRE)
  })

  it('should return an error if there is an error acquiring a connection', async () => {
    const cache = redisCache.store
    await cache.client.quit()
    await expect(cache.ttl('toto')).rejects.toEqual(Error('Connection is closed.'))
  })

  it('external Redis instance should respect top level ttl', async () => {
    const externalRedisInstanceCache = await caching(ioRedisStore, {
      redisInstance: new Redis({
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.db,
      }),
      ttl: 120,
    })

    await externalRedisInstanceCache.set('foo', 'bar')
    expect(await externalRedisInstanceCache.store.ttl('foo')).toEqual(120)
  })
})

describe('keys', () => {
  it('should return a promise', async () => {
    expect(redisCache.store.keys('foo')).toBeInstanceOf(Promise)
  })

  it('should return an array of keys for the given pattern', async () => {
    await redisCache.set('foo', 'bar')
    expect(await redisCache.store.keys('f*')).toEqual(['foo'])
  })

  it('should return an array of keys without pattern', async () => {
    await redisCache.set('foo', 'bar')
    expect(await redisCache.store.keys()).toEqual(['foo'])
  })

  it('should return an error if there is an error acquiring a connection', async () => {
    const cache = redisCache.store
    await cache.client.quit()
    await expect(cache.keys('toto')).rejects.toEqual(Error('Connection is closed.'))
  })
})

describe('isCacheable', () => {
  it('should return true when the value is not undefined', () => {
    const cache = redisCache.store
    expect(cache.isCacheable(0)).toBe(true)
    expect(cache.isCacheable(100)).toBe(true)
    expect(cache.isCacheable('')).toBe(true)
    expect(cache.isCacheable('test')).toBe(true)
  })

  it('should return false when the value is undefined', () => {
    const cache = redisCache.store
    expect(cache.isCacheable(undefined)).toBe(false)
  })

  it('should return false when the value is null', () => {
    const cache = redisCache.store
    expect(cache.isCacheable(null)).toBe(false)
  })
})

describe('redis error event', () => {
  it('should return an error when the redis server is unavailable', (done) => {
    const cache = customRedisCache.store
    cache.client.on('error', (err) => {
      expect(err).not.toEqual(null)
      done()
    })
    cache.client.emit('error', 'Something unexpected')
  })
})

describe('defaults are set by redis itself', () => {
  let defaultRedisCache: RedisCache

  beforeEach(async () => {
    defaultRedisCache = await caching(ioRedisStore, {
      ttl: 12,
    })
  })

  it('should default the host to `127.0.0.1`', () => {
    const cache = defaultRedisCache.store
    const redis = cache.client as Redis
    expect(redis.options.host).toEqual('localhost')
  })

  it('should default the port to 6379', () => {
    const cache = defaultRedisCache.store
    const redis = cache.client as Redis
    expect(redis.options.port).toEqual(6379)
  })
})

describe('wrap function', () => {
  const getUser = async (id: number) => ({ id })

  it('should be able to cache objects', async () => {
    const userId = 123

    await redisCache.wrap(`user`, () => getUser(userId))

    expect(await redisCache.wrap(`user`, () => getUser(userId + 1))).toEqual({ id: userId })
  })
})

it.skip('should create a cluster store with a default ttl', async () => {
  const defaultTtlInstance = await caching(ioRedisStore, {
    clusterConfig: {
      nodes: [
        { host: '172.38.0.11', port: config.port },
        { host: '172.38.0.12', port: config.port },
        { host: '172.38.0.13', port: config.port },
      ],
    },
    ttl: 5,
  })
  await expect(defaultTtlInstance.set('extfoo', 'extbar')).resolves.not.toThrow()
  expect(await defaultTtlInstance.store.ttl('extfoo')).toEqual(5)
})
