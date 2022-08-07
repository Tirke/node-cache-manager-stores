import Redis, {
  ClusterOptions,
  Cluster,
  ClusterNode,
  RedisOptions,
  RedisKey
} from 'ioredis';

type ClusterConfig = {
  nodes: ClusterNode[];
  options?: ClusterOptions;
};

type CreateArgs = {
  store: { create: (args: CreateArgs) => RedisStore };
  isCacheableValue?: (value: any) => boolean;
  ttl?: number;
  redisInstance?: Redis | Cluster;
  clusterConfig?: ClusterConfig;
  instanceConfig?: RedisOptions;
};

type Args = {
  store: { create: (args: CreateArgs) => RedisStore };
  isCacheableValue: (value: any) => boolean;
  ttl?: number;
  redisInstance?: Redis | Cluster;
  clusterConfig?: ClusterConfig;
  instanceConfig?: RedisOptions;
};

type RedisValue = string | Buffer | number;

class RedisStore {
  private readonly client: Redis | Cluster;
  private readonly ttl: number | undefined;
  private readonly isCacheableValue: (value: any) => boolean;

  constructor(args: Args) {
    this.ttl = args.ttl;
    this.isCacheableValue = args.isCacheableValue;

    if (args.instanceConfig) {
      this.client = new Redis(args.instanceConfig);
    }

    if (args.clusterConfig) {
      this.client = new Cluster(
        args.clusterConfig.nodes,
        args.clusterConfig.options
      );
    }

    if (args.redisInstance) {
      this.client = args.redisInstance;
    }

    throw new Error('Missing any redis client config');
  }

  getClient() {
    return this.client;
  }

  set(
    key: RedisKey,
    value: RedisValue,
    options:
      | {
      ttl?: number;
    }
      | (() => void),
    cb?: (err: any, result?: any) => void
  ) {
    return new Promise((resolve, reject) => {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      if (!cb) {
        cb = (err: any, result?: any) => (err ? reject(err) : resolve(result));
      }

      if (!this.isCacheableValue(value)) {
        return cb(new Error('Value is not cacheable'));
      }

      const val = JSON.stringify(value) || "'undefined";
      const ttl = options.ttl || this.ttl;

      if (ttl) {
        this.client.setex(key, ttl, val, handleResponse(cb));
      } else {
       this.client.set(key, val, handleResponse(cb))
      }
    });
  }

  async get(key: RedisKey) {
    return this.client.get(key);
  }

  async del(key: RedisKey) {
    return this.client.del(key);
  }
}

function handleResponse(cb: (err: any, res?: any) => void, opts: { parse?: boolean } = {}) {
  return (err: any, result?: any) => {
    if (err) {
      return cb && cb(err);
    }

    if (opts.parse) {
      try {
        result = JSON.parse(result);
      } catch (e) {
        return cb && cb(e);
      }
    }

    return cb && cb(null, result);
  };
}

export default {
  create(args: CreateArgs) {
    const isCacheableValue =
      args.isCacheableValue ||
      ((value) => value !== undefined && value !== null);
    return new RedisStore({ ...args, isCacheableValue });
  }
};
