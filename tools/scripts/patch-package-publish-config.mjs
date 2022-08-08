#!/usr/bin/env zx

const packages = await globby(['dist/**/package.json'])
packages.map(async (p) => {
  const pkgJson = await fs.readJSON(p)
  delete pkgJson.publishConfig
  return fs.writeJson(p, pkgJson)
})
