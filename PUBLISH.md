# Publishing to npm

## Prerequisites

- npm account with access to the [`generator-readteractive`](https://www.npmjs.com/package/generator-readteractive) package
- Logged in locally: `npm whoami` (if not, run `npm login`)

## Steps

### 1. Ensure everything is clean and tested

```sh
npm install
npm test
```

### 2. Bump the version

**Option A — automatic (recommended):**

```sh
npm version patch   # 1.0.0 → 1.0.1  (bug fixes)
npm version minor   # 1.0.0 → 1.1.0  (new features, backward compatible)
npm version major   # 1.0.0 → 2.0.0  (breaking changes)
```

This updates `package.json`, creates a git commit, and tags it automatically.

**Option B — manual**

Edit "version" in package.json to the desired value, then:

```sh
git add package.json package-lock.json
git commit -m "chore: release x.y.z"
git tag vx.y.z
```

### 3. Push the commit and tag

```sh
git push && git push --tags
```

### 4. Publish

```sh
npm publish
```

Only the files listed in the `"files"` field of `package.json` are included (`generators/`, `utils/`). Dev files (tests, config, etc) are excluded automatically.

### 5. Verify

```sh
npm info generator-readteractive version
```

Or check: https://www.npmjs.com/package/generator-readteractive

---

## Version history

| Version | Description |
|---------|-------------|
| `0.0.0` | Initial release (book, chapter, build) |
| `1.0.0` | Graph visualization (graph), dependency updates |
