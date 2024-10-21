import { caching } from 'cache-manager'
import { MongoClient } from 'mongodb'

import { mongoDbStore, MongoCache } from './node-cache-manager-mongodb'

let mongoCache: MongoCache

beforeEach(async () => {
  mongoCache = await caching(mongoDbStore, {
    url: 'mongodb://localhost:27017',
    mongoConfig: {},
  })

  await mongoCache.reset()
})

describe('client', () => {
  it('should create a store', async () => {
    const localCache = await caching(mongoDbStore, {
      url: 'mongodb://localhost:27017',
      mongoConfig: {},
    })

    await localCache.set('foo', 'bar')

    expect(await localCache.get('foo')).toEqual('bar')
    await localCache.reset()
  })

  it('should throw an error if no args are provided', async () => {
    await expect(caching(mongoDbStore)).rejects.toThrowError('please provide a URL and config to init the mongo client')
  })

  it('should create a local client if no url is provided', async () => {
    const localCache = await caching(mongoDbStore, {
      mongoConfig: {},
    })

    await localCache.set('foo', 'bar')

    expect(await localCache.get('foo')).toEqual('bar')
    await localCache.reset()
  })

  it('should throw if an empty args object is provided', async () => {
    await expect(caching(mongoDbStore, {})).rejects.toThrowError('MongoDB connection URL and mongoConfig are required')
  })

  it('should return an error if there is an error acquiring a connection', async () => {
    await mongoCache.store.client.close()
    await expect(mongoCache.set('foo', 'bar')).rejects.toThrow('connected')
  })
})

describe('set and ttl', () => {
  it('should store a value using a caching wide defined ttl', async () => {
    const cacheWithTLL = await caching(mongoDbStore, {
      url: 'mongodb://localhost:27017',
      ttl: 60,
      mongoConfig: {},
    })

    await cacheWithTLL.set('foo', 'bar')
    const ttl = await cacheWithTLL.store.ttl('foo')

    expect(ttl).toEqual(60)
    await cacheWithTLL.reset()
  })

  it('should store a value without any ttl', async () => {
    await mongoCache.set('foo', 'bar')
    const ttl = await mongoCache.store.ttl('foo')

    expect(ttl).toEqual(-1)
  })

  it('should store a value with a specific ttl', async () => {
    await mongoCache.set('foo', 'bar', 34)
    expect(await mongoCache.store.ttl('foo')).toEqual(34)
  })

  it('should store a value with a infinite ttl', async () => {
    await mongoCache.set('foo', 'bar', 0)
    expect(await mongoCache.store.ttl('foo')).toEqual(-1)
  })

  it('should not store undefined', async () => {
    await expect(mongoCache.set('foo', undefined)).rejects.toEqual(Error('undefined is not cacheable'))
  })

  it('should not store null', async () => {
    await expect(mongoCache.set('foo', null)).rejects.toEqual(Error('null is not cacheable'))
  })

  it('should store an undefined value if permitted by isCacheable', async () => {
    const customCache = await caching(mongoDbStore, {
      url: 'mongodb://localhost:27017',
      ttl: 60,
      isCacheable: () => true,
      mongoConfig: {},
    })

    expect(customCache.store.isCacheable(undefined)).toBe(true)
    await customCache.set('foo3', undefined)
    expect(await customCache.get('foo3')).toBeNull()
    await customCache.reset()
  })
})

describe('get', () => {
  it('should retrieve a value for a given key', async () => {
    const value = 'bar'
    await mongoCache.set('foo', value)
    expect(await mongoCache.get('foo')).toEqual(value)
  })

  it('should return null when the key is invalid', async () => {
    expect(await mongoCache.get('invalidKey')).toBeUndefined()
  })
})

describe('mget', () => {
  it('should retrieve multiple values', async () => {
    await mongoCache.store.mset([
      ['foo', 'bar'],
      ['baz', 'foo'],
    ])
    expect(await mongoCache.store.mget('foo', 'baz')).toEqual(expect.arrayContaining(['bar', 'foo']))
  })
})

describe('mset', () => {
  it('should store a value using a caching wide defined ttl', async () => {
    const cacheWithTLL = await caching(mongoDbStore, {
      url: 'mongodb://localhost:27017',
      ttl: 60,
      mongoConfig: {},
    })

    await cacheWithTLL.store.mset([
      ['foo', 'bar'],
      ['foo2', 'bar2'],
    ])
    const ttl = await cacheWithTLL.store.ttl('foo2')

    expect(ttl).toEqual(60)
    await cacheWithTLL.reset()
  })

  it('should store a value without any ttl', async () => {
    await mongoCache.store.mset([
      ['foo', 'bar'],
      ['foo2', 'bar2'],
    ])
    const ttl = await mongoCache.store.ttl('foo2')

    expect(ttl).toEqual(-1)
  })

  it('should store a value with a specific ttl', async () => {
    await mongoCache.store.mset(
      [
        ['foo', 'bar'],
        ['foo2', 'bar2'],
      ],
      60,
    )
    expect(await mongoCache.store.ttl('foo2')).toEqual(60)
  })

  it('should store a value with a infinite ttl', async () => {
    await mongoCache.store.mset(
      [
        ['foo', 'bar'],
        ['foo2', 'bar2'],
      ],
      0,
    )
    expect(await mongoCache.store.ttl('foo2')).toEqual(-1)
  })

  it('should not be able to store a null value (not cacheable)', () =>
    expect(mongoCache.store.mset([['foo2', null]])).rejects.toThrow())

  it('should not be able to store not cacheable value with ttl', () =>
    expect(mongoCache.store.mset([['foo2', null]], 15)).rejects.toThrow())

  it('should store an undefined value if permitted by isCacheable', async () => {
    const customCache = await caching(mongoDbStore, {
      url: 'mongodb://localhost:27017',
      ttl: 60,
      isCacheable: () => true,
      mongoConfig: {},
    })
    expect(customCache.store.isCacheable(undefined)).toBe(true)
    await customCache.store.mset([
      ['foo3', undefined],
      ['foo4', undefined],
    ])
    await expect(customCache.store.mget('foo3', 'foo4')).resolves.toStrictEqual([null, null])
    await customCache.reset()
  })
})

describe('del', () => {
  it('should delete a value for a given key', async () => {
    await mongoCache.set('foo', 'bar')
    expect(await mongoCache.get('foo')).toEqual('bar')
    expect(await mongoCache.del('foo'))
    expect(await mongoCache.get('foo')).toBeUndefined()
  })
})

describe('mdel', () => {
  it('should delete a unlimited number of keys', async () => {
    await mongoCache.store.mset([
      ['foo', 'bar'],
      ['foo2', 'bar2'],
    ])
    expect(await mongoCache.store.mget('foo', 'foo2')).toEqual(expect.arrayContaining(['bar', 'bar2']))
    await mongoCache.store.mdel('foo', 'foo2')
    expect(await mongoCache.store.mget('foo', 'foo2')).toEqual([undefined, undefined])
  })
})

describe('reset', () => {
  it('should flush underlying db', async () => {
    await mongoCache.set('foo', 'bar')
    await expect(mongoCache.reset()).resolves.not.toThrow()
    expect(await mongoCache.get('foo')).toBeUndefined()
  })
})

describe('ttl', () => {
  it('should retrieve ttl for an invalid key', async () => {
    expect(await mongoCache.store.ttl('invalid')).toEqual(-1)
  })
})

describe('keys', () => {
  it('should return an array of keys for the given pattern', async () => {
    await mongoCache.set('foo', 'bar')
    expect(await mongoCache.store.keys('f*')).toEqual(['foo'])
  })

  it('should return an array of keys without pattern', async () => {
    await mongoCache.store.mset([
      ['foo', 'bar'],
      ['foo2', 'bar2'],
      ['foo3', 'bar3'],
    ])
    expect(await mongoCache.store.keys()).toEqual(['foo', 'foo2', 'foo3'])
  })
})

describe('wrap function', () => {
  const getUser = async (id: number) => ({ id })

  it('should be able to cache objects', async () => {
    const userId = 123

    await mongoCache.wrap(`user`, () => getUser(userId))

    expect(await mongoCache.wrap(`user`, () => getUser(userId + 1))).toEqual({ id: userId })
  })
})

describe('collectionName', () => {
  it('should use a custom collection name', async () => {
    const cacheWithCustomCollName = await caching(mongoDbStore, {
      collectionName: 'custom-collection',
      url: 'mongodb://localhost:27017',
      ttl: 60,
      mongoConfig: {},
    })

    await cacheWithCustomCollName.set('foo', 'bar')
    const collections = await cacheWithCustomCollName.store.db.listCollections().toArray()

    expect(collections[0].name).toEqual('custom-collection')

    await cacheWithCustomCollName.reset()
  })

  it('should use cache as the default collection name', async () => {
    const baseCache = await caching(mongoDbStore, {
      url: 'mongodb://localhost:27017',
      ttl: 60,
      mongoConfig: {},
    })

    await baseCache.set('foo', 'bar')
    const collections = await baseCache.store.db.listCollections().toArray()
    expect(collections[0].name).toEqual('cache')

    await baseCache.reset()
  })
})

describe('databaseName', () => {
  it('should use a custom database name', async () => {
    const cacheWithCustomDatabaseName = await caching(mongoDbStore, {
      databaseName: 'custom-database',
      url: 'mongodb://localhost:27017',
      ttl: 60,
      mongoConfig: {},
    })

    await cacheWithCustomDatabaseName.set('foo', 'bar')

    expect(cacheWithCustomDatabaseName.store.db.databaseName).toEqual('custom-database')

    await cacheWithCustomDatabaseName.reset()
  })

  it('should use cache as the default database name', async () => {
    const baseCache = await caching(mongoDbStore, {
      url: 'mongodb://localhost:27017',
      ttl: 60,
      mongoConfig: {},
    })

    await baseCache.set('foo', 'bar')
    expect(baseCache.store.db.databaseName).toEqual('cache')

    await baseCache.reset()
  })
})

describe('reusing Mongo client', () => {
  it('should reuse the client', async () => {
    const mongoClient = new MongoClient('mongodb://localhost:27017')
    const cache = await caching(mongoDbStore, {
      client: mongoClient,
    })

    await cache.set('foo', 'bar')
    expect(cache.store.client).toEqual(mongoClient)
  })
})
