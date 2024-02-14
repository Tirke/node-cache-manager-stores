# @tirke/node-cache-manager-mongodb

## 1.7.0

### Minor Changes

- add option to configure a custom database name ([#526](https://github.com/Tirke/node-cache-manager-stores/pull/526))

## 1.6.0

### Minor Changes

- Can now specify a custom collection name. ([`406c1424c37916131fa4dcf1cb355a0e3b5b360b`](https://github.com/Tirke/node-cache-manager-stores/commit/406c1424c37916131fa4dcf1cb355a0e3b5b360b))
  Default collection name will remain cache if unspecified.

  ```typescript
  import { caching } from "cache-manager";

  import { mongoDbStore } from "./node-cache-manager-mongodb";

  const mongoCache = await caching(mongoDbStore, {
    url: "mongodb://localhost:27017",
    collectionName: "custom-collection-name",
    mongoConfig: { auth: { password: "<password>", username: "<user>" } },
  });
  ```

## 1.5.0

### Minor Changes

- add additional license file ([`af59b7e32fe9a65b214d7876b6662fff638b07be`](https://github.com/Tirke/node-cache-manager-stores/commit/af59b7e32fe9a65b214d7876b6662fff638b07be))

## 1.4.0

### Minor Changes

- add license ([`3213b822d8b31b7b508a9c4beec947aeb53de176`](https://github.com/Tirke/node-cache-manager-stores/commit/3213b822d8b31b7b508a9c4beec947aeb53de176))

## 1.3.0

### Minor Changes

- Include READMEs and fixed provenance statement ([`32729e1`](https://github.com/Tirke/node-cache-manager-stores/commit/32729e1300186f55fad3ead90435082534b7341c))

## 1.2.0

### Minor Changes

- Generate provenance status ([`d3686c0`](https://github.com/Tirke/node-cache-manager-stores/commit/d3686c0be5c8fc930f40f76023fc88a35803ff50))

## 1.1.0

### Minor Changes

- Publish mongodb package with ESM and CJS files ([`5a6ff50`](https://github.com/Tirke/node-cache-manager-stores/commit/5a6ff504270321fcce48c2049de0be59a93e563a))

## 1.0.1

### Patch Changes

- [`64805e9`](https://github.com/Tirke/node-cache-manager-stores/commit/64805e9d6d7b6697fa783c3c000ed555bc4a8726) Thanks [@Tirke](https://github.com/Tirke)! - Correct package.json github repo links

## 1.0.0

### Major Changes

- [`8d86bae`](https://github.com/Tirke/node-cache-manager-stores/commit/8d86bae51b99faa8b1cdc122d1fc12b9fc58f5c2) Thanks [@Tirke](https://github.com/Tirke)! - This is the first release of a cache-manager store for MongoDB
