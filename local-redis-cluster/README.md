### Create the cluster

```
docker run -it --network local-redis-cluster_redis_network --rm redis redis-cli --cluster create 172.38.0.11:6379 172.38.0.12:6379 172.38.0.13:6379
```
