import { Redis } from 'ioredis';

class RedisStore {
  set(key, value, options) {}
}

export default {
  create() {
    return new RedisStore();
  },
};
