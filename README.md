# angular-locale-chain

[![npm version](https://img.shields.io/npm/v/angular-locale-chain)](https://www.npmjs.com/package/angular-locale-chain)
[![license](https://img.shields.io/npm/l/angular-locale-chain)](LICENSE)

Smart locale fallback chains for Angular + Transloco -- because pt-BR users deserve pt-PT, not English.

## The Problem

Transloco has [bug #574](https://github.com/jsverse/transloco/issues/574): when a translation key is missing in the active locale's loaded file, it does **not** fall through to the next locale in the fallback chain on a per-key basis. Transloco's built-in `TRANSLOCO_FALLBACK_STRATEGY` only kicks in when the **entire locale file** fails to load -- it does not help with individual missing keys.

**Example:** Your app has `pt-PT` translations but no `pt-BR` messages file. A Brazilian Portuguese user sees English (or whatever your fallback locale is) instead of the perfectly good `pt-PT` translations.

The same thing happens with `es-MX` -> `es`, `fr-CA` -> `fr`, `de-AT` -> `de`, and every other regional variant. Your users see English when a perfectly good translation exists in a sibling locale.

## The Solution

Drop-in `TranslocoLoader` replacement. Zero changes to your existing Transloco templates.

`LocaleChainLoader` wraps your existing loader and deep-merges translations from a configurable fallback chain before handing them to Transloco. Every key is filled in -- no gaps, no missing translations.

## Installation

```bash
npm install angular-locale-chain @jsverse/transloco
```

## Quick Start

### NgModule setup

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  TranslocoModule,
  TRANSLOCO_LOADER,
  TRANSLOCO_FALLBACK_STRATEGY,
  TranslocoHttpLoader,
} from '@jsverse/transloco';
import { LocaleChainLoader, LocaleChainFallbackStrategy } from 'angular-locale-chain';

@NgModule({
  imports: [TranslocoModule],
  providers: [
    {
      provide: TRANSLOCO_LOADER,
      useFactory: (http: HttpClient) => {
        const inner = new TranslocoHttpLoader(http);
        return new LocaleChainLoader(inner, {
          defaultLocale: 'en',
        });
      },
      deps: [HttpClient],
    },
    {
      provide: TRANSLOCO_FALLBACK_STRATEGY,
      useFactory: () => new LocaleChainFallbackStrategy(),
    },
  ],
})
export class AppModule {}
```

### Standalone component setup

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  provideTransloco,
  TranslocoHttpLoader,
  TRANSLOCO_LOADER,
  TRANSLOCO_FALLBACK_STRATEGY,
} from '@jsverse/transloco';
import { LocaleChainLoader, LocaleChainFallbackStrategy } from 'angular-locale-chain';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideTransloco({
      config: {
        availableLangs: ['en', 'fr', 'fr-CA', 'pt', 'pt-BR', 'de', 'de-AT'],
        defaultLang: 'en',
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: true,
      },
    }),
    {
      provide: TRANSLOCO_LOADER,
      useFactory: () => {
        const inner = new TranslocoHttpLoader();
        return new LocaleChainLoader(inner, {
          defaultLocale: 'en',
        });
      },
    },
    {
      provide: TRANSLOCO_FALLBACK_STRATEGY,
      useFactory: () => new LocaleChainFallbackStrategy(),
    },
  ],
};
```

All default fallback chains are active. A `pt-BR` user will now see `pt-PT` translations when `pt-BR` keys are missing.

## Custom Configuration

### Default (zero config)

```typescript
const loader = new LocaleChainLoader(innerLoader, {
  defaultLocale: 'en',
});
```

Uses all built-in fallback chains. Covers Chinese, Portuguese, Spanish, French, German, Italian, Dutch, English, Arabic, Norwegian, and Malay regional variants.

### With overrides (merge with defaults)

```typescript
// Override specific chains while keeping all defaults
const loader = new LocaleChainLoader(innerLoader, {
  defaultLocale: 'en',
  fallbacks: { 'pt-BR': ['pt'] }, // skip pt-PT, go straight to pt
});
```

Your overrides replace matching keys in the default map. All other defaults remain.

### Full custom (replace defaults)

```typescript
// Full control -- only use your chains
const loader = new LocaleChainLoader(innerLoader, {
  defaultLocale: 'en',
  fallbacks: {
    'pt-BR': ['pt-PT', 'pt'],
    'es-MX': ['es-419', 'es'],
  },
  mergeDefaults: false,
});
```

Only the chains you specify will be active. No defaults.

## API Reference

### `LocaleChainLoader`

A `TranslocoLoader` that wraps your existing loader and deep-merges translations across the full fallback chain.

```typescript
new LocaleChainLoader(innerLoader: TranslocoLoader, options?: LocaleChainLoaderOptions)
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultLocale` | `string` | `undefined` | Base locale loaded first (lowest priority) |
| `fallbacks` | `FallbackMap` | `undefined` | Custom fallback chains to use or merge with defaults |
| `mergeDefaults` | `boolean` | `true` | Whether to merge custom fallbacks with built-in defaults |

### `LocaleChainFallbackStrategy`

A `TranslocoFallbackStrategy` that returns the correct fallback chain when an entire locale file fails to load. Use alongside `LocaleChainLoader` for complete coverage.

```typescript
new LocaleChainFallbackStrategy(options?: LocaleChainFallbackStrategyOptions)
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fallbacks` | `FallbackMap` | `undefined` | Custom fallback chains |
| `mergeDefaults` | `boolean` | `true` | Whether to merge with built-in defaults |

### `defaultFallbacks`

The built-in `FallbackMap` constant containing all default locale chains. Can be inspected or spread into custom configurations.

### `mergeFallbacks(defaults, overrides)`

Utility function that merges two `FallbackMap` objects. Overrides replace matching keys from defaults.

## Default Fallback Map

### Chinese

| Locale | Fallback Chain |
|--------|---------------|
| zh-Hant-HK | zh-Hant-TW -> zh-Hant -> (default locale) |
| zh-Hant-MO | zh-Hant-HK -> zh-Hant-TW -> zh-Hant -> (default locale) |
| zh-Hant-TW | zh-Hant -> (default locale) |
| zh-Hans-SG | zh-Hans -> (default locale) |
| zh-Hans-MY | zh-Hans -> (default locale) |

### Portuguese

| Locale | Fallback Chain |
|--------|---------------|
| pt-BR | pt-PT -> pt -> (default locale) |
| pt-PT | pt -> (default locale) |
| pt-AO | pt-PT -> pt -> (default locale) |
| pt-MZ | pt-PT -> pt -> (default locale) |

### Spanish

| Locale | Fallback Chain |
|--------|---------------|
| es-419 | es -> (default locale) |
| es-MX | es-419 -> es -> (default locale) |
| es-AR | es-419 -> es -> (default locale) |
| es-CO | es-419 -> es -> (default locale) |
| es-CL | es-419 -> es -> (default locale) |
| es-PE | es-419 -> es -> (default locale) |
| es-VE | es-419 -> es -> (default locale) |
| es-EC | es-419 -> es -> (default locale) |
| es-GT | es-419 -> es -> (default locale) |
| es-CU | es-419 -> es -> (default locale) |
| es-BO | es-419 -> es -> (default locale) |
| es-DO | es-419 -> es -> (default locale) |
| es-HN | es-419 -> es -> (default locale) |
| es-PY | es-419 -> es -> (default locale) |
| es-SV | es-419 -> es -> (default locale) |
| es-NI | es-419 -> es -> (default locale) |
| es-CR | es-419 -> es -> (default locale) |
| es-PA | es-419 -> es -> (default locale) |
| es-UY | es-419 -> es -> (default locale) |
| es-PR | es-419 -> es -> (default locale) |

### French

| Locale | Fallback Chain |
|--------|---------------|
| fr-CA | fr -> (default locale) |
| fr-BE | fr -> (default locale) |
| fr-CH | fr -> (default locale) |
| fr-LU | fr -> (default locale) |
| fr-MC | fr -> (default locale) |
| fr-SN | fr -> (default locale) |
| fr-CI | fr -> (default locale) |
| fr-ML | fr -> (default locale) |
| fr-CM | fr -> (default locale) |
| fr-MG | fr -> (default locale) |
| fr-CD | fr -> (default locale) |

### German

| Locale | Fallback Chain |
|--------|---------------|
| de-AT | de -> (default locale) |
| de-CH | de -> (default locale) |
| de-LU | de -> (default locale) |
| de-LI | de -> (default locale) |

### Italian

| Locale | Fallback Chain |
|--------|---------------|
| it-CH | it -> (default locale) |

### Dutch

| Locale | Fallback Chain |
|--------|---------------|
| nl-BE | nl -> (default locale) |

### English

| Locale | Fallback Chain |
|--------|---------------|
| en-GB | en -> (default locale) |
| en-AU | en-GB -> en -> (default locale) |
| en-NZ | en-AU -> en-GB -> en -> (default locale) |
| en-IN | en-GB -> en -> (default locale) |
| en-CA | en -> (default locale) |
| en-ZA | en-GB -> en -> (default locale) |
| en-IE | en-GB -> en -> (default locale) |
| en-SG | en-GB -> en -> (default locale) |

### Arabic

| Locale | Fallback Chain |
|--------|---------------|
| ar-SA | ar -> (default locale) |
| ar-EG | ar -> (default locale) |
| ar-AE | ar -> (default locale) |
| ar-MA | ar -> (default locale) |
| ar-DZ | ar -> (default locale) |
| ar-IQ | ar -> (default locale) |
| ar-KW | ar -> (default locale) |
| ar-QA | ar -> (default locale) |
| ar-BH | ar -> (default locale) |
| ar-OM | ar -> (default locale) |
| ar-JO | ar -> (default locale) |
| ar-LB | ar -> (default locale) |
| ar-TN | ar -> (default locale) |
| ar-LY | ar -> (default locale) |
| ar-SD | ar -> (default locale) |
| ar-YE | ar -> (default locale) |

### Norwegian

| Locale | Fallback Chain |
|--------|---------------|
| nb | no -> (default locale) |
| nn | nb -> no -> (default locale) |

### Malay

| Locale | Fallback Chain |
|--------|---------------|
| ms-MY | ms -> (default locale) |
| ms-SG | ms -> (default locale) |
| ms-BN | ms -> (default locale) |

## How It Works

1. `LocaleChainLoader` wraps your existing `TranslocoLoader` (e.g., `TranslocoHttpLoader`).
2. When Transloco requests translations for a locale, the loader resolves the fallback chain.
3. It calls the inner loader for each locale in the chain.
4. Messages are deep-merged in priority order: default locale (base) -> chain locales -> requested locale (highest priority).
5. If the inner loader throws for any chain locale (e.g., file doesn't exist), it silently skips that locale and continues.
6. The fully merged translation object is returned to Transloco. Your templates see a complete set of keys with no gaps.

`LocaleChainFallbackStrategy` complements this by providing Transloco with the correct fallback sequence when an **entire** locale file fails to load.

## FAQ

**Why do I need both `LocaleChainLoader` and `LocaleChainFallbackStrategy`?**
They solve different problems. The loader handles per-key deep merge (bug #574). The strategy handles locale-level fallback when an entire translation file is missing. Together they provide complete coverage.

**Performance impact?**
Minimal. The fallback map is resolved once at construction time. Message loading happens per locale change, but only for locales in the chain. Deep merge is fast for typical message objects.

**Does it work with nested message keys?**
Yes. Deep merge is recursive -- it walks all nesting levels. If `pt-BR` has `common.save` but not `common.cancel`, `common.cancel` will be filled from the next locale in the chain.

**Does it work with Transloco scopes?**
Yes. Scoped translations go through the same loader, so each scope gets the same fallback chain treatment.

**Can I use a custom inner loader?**
Yes. Any class implementing `TranslocoLoader` works as the inner loader -- `TranslocoHttpLoader`, a custom loader that fetches from a CMS, or any other implementation.

**What if my inner loader returns Observables?**
Fully supported. The inner loader can return either `Observable<Translation>` or `Promise<Translation>`. Both are handled transparently.

**What if a chain locale doesn't have a messages file?**
It's silently skipped. The chain continues to the next locale. This is by design -- you don't need message files for every locale in every chain.

**Transloco version compatibility?**
Works with `@jsverse/transloco` v5+ (including v6 and v7).

**Angular version compatibility?**
Compatible with Angular 14+ (both NgModule and standalone component patterns).

## Contributing

- Open issues for bugs or feature requests.
- PRs welcome, especially for adding new locale fallback chains.
- Run `npm test` before submitting.

## License

MIT License - see [LICENSE](LICENSE) file.

Built by [i18nagent.ai](https://i18nagent.ai)
