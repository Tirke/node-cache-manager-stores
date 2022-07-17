import { nodeCacheManagerIoredis } from './node-cache-manager-ioredis';

describe('nodeCacheManagerIoredis', () => {
  it('should work', () => {
    expect(nodeCacheManagerIoredis()).toEqual('node-cache-manager-ioredis');
  });
});
