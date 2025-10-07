# 🚀 Automated Release Setup

## NPM Token Setup

### 1. NPM Access Token erstellen
```bash
# Bei NPM einloggen
npm login

# Automation Token erstellen (umgeht 2FA)
npm token create --type=automation --scope=@lordcraymen
```

### 2. GitHub Secret hinzufügen
1. Gehe zu: https://github.com/lordcraymen/adr-toolkit/settings/secrets/actions
2. **New repository secret**
3. **Name**: `NPM_TOKEN`
4. **Value**: Dein NPM Token (beginnt mit `npm_...`)

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

### Beispiele
```bash
feat: add custom template support
fix: resolve Windows path issues
feat!: remove legacy format support
docs: update installation guide
```

## Pipeline Flow
1. PR wird getestet (alle Node.js Versionen)
2. Nach Merge auf `main`: Automatic Release
3. Version wird bumped, Changelog generiert
4. NPM Package wird veröffentlicht
5. GitHub Release wird erstellt