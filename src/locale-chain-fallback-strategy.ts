import { TranslocoFallbackStrategy } from '@jsverse/transloco'
import { FallbackMap, defaultFallbacks, mergeFallbacks } from './fallback-map'

export interface LocaleChainFallbackStrategyOptions {
  fallbacks?: FallbackMap
  mergeDefaults?: boolean
}

/**
 * A TranslocoFallbackStrategy that returns the full locale fallback chain
 * when a locale fails to load. This complements LocaleChainLoader by
 * providing Transloco with the correct fallback sequence for locale-level
 * failures (e.g., missing translation files).
 *
 * Usage:
 * ```typescript
 * @NgModule({
 *   providers: [
 *     {
 *       provide: TRANSLOCO_FALLBACK_STRATEGY,
 *       useFactory: () => new LocaleChainFallbackStrategy(),
 *     },
 *   ],
 * })
 * ```
 */
export class LocaleChainFallbackStrategy implements TranslocoFallbackStrategy {
  private fallbacks: FallbackMap

  constructor(options: LocaleChainFallbackStrategyOptions = {}) {
    const mergeDefaults = options.mergeDefaults !== false
    if (options.fallbacks && mergeDefaults) {
      this.fallbacks = mergeFallbacks(defaultFallbacks, options.fallbacks)
    } else if (options.fallbacks) {
      this.fallbacks = options.fallbacks
    } else {
      this.fallbacks = defaultFallbacks
    }
  }

  getNextLangs(failedLang: string): string[] {
    return this.fallbacks[failedLang] || []
  }
}
