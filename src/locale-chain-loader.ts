import { Translation, TranslocoLoader } from '@jsverse/transloco'
import { Observable, from, isObservable, lastValueFrom } from 'rxjs'
import { FallbackMap, defaultFallbacks, mergeFallbacks } from './fallback-map'

type Messages = Record<string, any>

export interface LocaleChainLoaderOptions {
  fallbacks?: FallbackMap
  defaultLocale?: string
  mergeDefaults?: boolean
}

function deepMerge(target: Messages, source: Messages): Messages {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key])
    } else {
      result[key] = source[key]
    }
  }
  return result
}

function toPromise<T>(value: Observable<T> | Promise<T>): Promise<T> {
  if (isObservable(value)) {
    return lastValueFrom(value)
  }
  return value
}

/**
 * A TranslocoLoader that loads and deep-merges translations across the full
 * locale fallback chain, fixing Transloco bug #574 where missing keys in a
 * loaded locale do not fall through to the next locale in the chain.
 *
 * Usage:
 * ```typescript
 * @NgModule({
 *   providers: [
 *     {
 *       provide: TRANSLOCO_LOADER,
 *       useFactory: (http: HttpClient) => {
 *         const inner = new TranslocoHttpLoader(http);
 *         return new LocaleChainLoader(inner, {
 *           defaultLocale: 'en',
 *         });
 *       },
 *       deps: [HttpClient],
 *     },
 *   ],
 * })
 * ```
 */
export class LocaleChainLoader implements TranslocoLoader {
  private fallbacks: FallbackMap

  constructor(
    private innerLoader: TranslocoLoader,
    private options: LocaleChainLoaderOptions = {}
  ) {
    const mergeDefaults = options.mergeDefaults !== false
    if (options.fallbacks && mergeDefaults) {
      this.fallbacks = mergeFallbacks(defaultFallbacks, options.fallbacks)
    } else if (options.fallbacks) {
      this.fallbacks = options.fallbacks
    } else {
      this.fallbacks = defaultFallbacks
    }
  }

  getTranslation(lang: string): Observable<Translation> | Promise<Translation> {
    return from(this.loadMergedTranslation(lang))
  }

  private async loadMergedTranslation(lang: string): Promise<Translation> {
    const chain = this.fallbacks[lang] || []
    const defaultLocale = this.options.defaultLocale

    // Build load order: [defaultLocale, ...chain.reversed(), requestedLocale]
    // Earlier entries are lower priority; later entries override.
    const seen = new Set<string>()
    const loadOrder: string[] = []

    for (const locale of [defaultLocale, ...chain.slice().reverse(), lang]) {
      if (locale && !seen.has(locale)) {
        seen.add(locale)
        loadOrder.push(locale)
      }
    }

    // Load all locales and deep-merge in priority order
    let result: Messages = {}
    for (const locale of loadOrder) {
      try {
        const translation = await toPromise(this.innerLoader.getTranslation(locale))
        result = deepMerge(result, translation)
      } catch {
        // Skip locales that fail to load — they may not exist
      }
    }

    return result
  }
}
