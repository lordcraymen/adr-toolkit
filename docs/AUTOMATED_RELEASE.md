# 🚀 Automated Release Setup

## Semantic Release Usage

### Commit Types
- `feat:` → Minor version (1.0.0 → 1.1.0)
- `fix:` → Patch version (1.0.0 → 1.0.1)
- `feat!:` → Major version (1.0.0 → 2.0.0)
- `docs:`, `chore:` → Kein Release

### Interactive Commits
```bash
npm run commit
```

### Examples
```bash
feat: add custom template support
fix: resolve Windows path issues
feat!: remove legacy format support
docs: update installation guide
```

## Pipeline Flow
1. PR gets tested (all Node.js versions)
2. After merge to `main`: Automatic Release
3. Version is bumped, changelog generated
4. NPM package is published
5. GitHub release is created