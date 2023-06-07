#!/usr/bin/env zx

const packages = await globby(['dist/**/package.json'])
await Promise.all(
  packages.map(async (p) => {
    const pkgJson = await fs.readJSON(p)
    delete pkgJson.publishConfig.directory
    return fs.writeJson(p, pkgJson, { spaces: 2 })
  }),
)
