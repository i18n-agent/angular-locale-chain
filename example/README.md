# angular-locale-chain Example

Minimal Angular app demonstrating the `angular-locale-chain` library with Transloco.

## What it shows

Three translation files with intentionally missing keys:

| Key | en.json | pt.json | pt-BR.json |
|-----|---------|---------|------------|
| greeting | Hello | Ola | Oi |
| farewell | Goodbye | Adeus | -- |
| welcome | Welcome to LocaleChain | -- | -- |

When the active locale is `pt-BR`, the `LocaleChainLoader` deep-merges translations in this order:

1. `en.json` (default locale -- lowest priority)
2. `pt.json` (fallback chain: pt-BR -> pt-PT -> pt)
3. `pt-BR.json` (requested locale -- highest priority)

Result for pt-BR:

- **greeting** = "Oi" (from pt-BR.json)
- **farewell** = "Adeus" (from pt.json via fallback chain)
- **welcome** = "Welcome to LocaleChain" (from en.json via default locale)

## Running

```bash
pnpm install
pnpm start
# Open http://localhost:4201
```

Click the language buttons to switch locales and see the fallback chain in action.
