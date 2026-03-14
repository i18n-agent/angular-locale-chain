import { describe, it, expect, vi, beforeEach } from 'vitest'
import { of, throwError } from 'rxjs'
import { LocaleChainLoader } from '../src/locale-chain-loader'
import type { TranslocoLoader, Translation } from '@jsverse/transloco'
import type { Observable } from 'rxjs'
import { lastValueFrom } from 'rxjs'

// Helper: create a mock TranslocoLoader from a locale -> translations map
function createMockLoader(
  translations: Record<string, Translation>
): TranslocoLoader {
  return {
    getTranslation(lang: string): Observable<Translation> | Promise<Translation> {
      if (translations[lang]) {
        return of(translations[lang])
      }
      return throwError(() => new Error(`No translation file for ${lang}`))
    },
  }
}

// Helper: resolve the loader's Observable into a Promise
function loadTranslation(
  loader: LocaleChainLoader,
  lang: string
): Promise<Translation> {
  return lastValueFrom(loader.getTranslation(lang) as Observable<Translation>)
}

// Shared test data
const enMessages: Translation = {
  common: { save: 'Save', cancel: 'Cancel', delete: 'Delete' },
  profile: { title: 'Profile', bio: 'Biography' },
}

const frMessages: Translation = {
  common: { save: 'Enregistrer', cancel: 'Annuler' },
  profile: { title: 'Profil' },
}

const frCAMessages: Translation = {
  common: { save: 'Sauvegarder' },
}

const ptMessages: Translation = {
  common: { save: 'Guardar', cancel: 'Cancelar' },
  profile: { title: 'Perfil' },
}

const ptBRMessages: Translation = {
  common: { save: 'Salvar' },
}

describe('LocaleChainLoader', () => {
  describe('deep-merge chain resolution', () => {
    it('merges chain locales with correct priority order (pt-BR > pt > en)', async () => {
      const innerLoader = createMockLoader({
        en: enMessages,
        pt: ptMessages,
        'pt-BR': ptBRMessages,
      })

      const loader = new LocaleChainLoader(innerLoader, {
        defaultLocale: 'en',
        fallbacks: { 'pt-BR': ['pt'] },
        mergeDefaults: false,
      })

      const result = await loadTranslation(loader, 'pt-BR')

      // en is base, pt overlays en, pt-BR overlays pt
      expect(result).toEqual({
        common: { save: 'Salvar', cancel: 'Cancelar', delete: 'Delete' },
        profile: { title: 'Perfil', bio: 'Biography' },
      })
    })

    it('deep-merges nested objects rather than replacing them', async () => {
      const innerLoader = createMockLoader({
        en: { nav: { home: 'Home', about: 'About', settings: { theme: 'Theme', lang: 'Language' } } },
        'de-AT': { nav: { settings: { theme: 'Thema' } } },
        de: { nav: { home: 'Startseite', about: 'Über uns' } },
      })

      const loader = new LocaleChainLoader(innerLoader, {
        defaultLocale: 'en',
        fallbacks: { 'de-AT': ['de'] },
        mergeDefaults: false,
      })

      const result = await loadTranslation(loader, 'de-AT')

      expect(result).toEqual({
        nav: {
          home: 'Startseite',
          about: 'Über uns',
          settings: { theme: 'Thema', lang: 'Language' },
        },
      })
    })

    it('returns only defaultLocale messages when locale has no chain', async () => {
      const innerLoader = createMockLoader({
        en: enMessages,
        ja: { common: { save: '保存' } },
      })

      const loader = new LocaleChainLoader(innerLoader, {
        defaultLocale: 'en',
      })

      const result = await loadTranslation(loader, 'ja')

      // ja has no chain in defaults, so: en (base) + ja (overlay)
      expect(result).toEqual({
        common: { save: '保存', cancel: 'Cancel', delete: 'Delete' },
        profile: { title: 'Profile', bio: 'Biography' },
      })
    })

    it('returns defaultLocale messages for a locale with no translations', async () => {
      const innerLoader = createMockLoader({
        en: enMessages,
      })

      const loader = new LocaleChainLoader(innerLoader, {
        defaultLocale: 'en',
      })

      const result = await loadTranslation(loader, 'unknown-locale')

      expect(result).toEqual(enMessages)
    })
  })

  describe('Bug #574: missing key falls through to next chain locale', () => {
    it('fr-CA missing "greeting" gets it from fr fallback', async () => {
      const innerLoader = createMockLoader({
        en: { greeting: 'Hello', farewell: 'Goodbye' },
        fr: { greeting: 'Bonjour', farewell: 'Au revoir' },
        'fr-CA': { farewell: 'Bye' },
      })

      const loader = new LocaleChainLoader(innerLoader, {
        defaultLocale: 'en',
      })

      const result = await loadTranslation(loader, 'fr-CA')

      // fr-CA is missing "greeting" -> falls through to fr -> "Bonjour"
      expect(result.greeting).toBe('Bonjour')
      // fr-CA has its own "farewell"
      expect(result.farewell).toBe('Bye')
    })

    it('nested missing key falls through correctly', async () => {
      const innerLoader = createMockLoader({
        en: {
          errors: { notFound: 'Not found', forbidden: 'Forbidden', network: 'Network error' },
        },
        fr: {
          errors: { notFound: 'Non trouvé', forbidden: 'Interdit' },
        },
        'fr-CA': {
          errors: { notFound: 'Pas trouvé' },
        },
      })

      const loader = new LocaleChainLoader(innerLoader, {
        defaultLocale: 'en',
      })

      const result = await loadTranslation(loader, 'fr-CA')

      // fr-CA has notFound -> "Pas trouvé"
      expect(result.errors.notFound).toBe('Pas trouvé')
      // fr-CA missing forbidden -> falls through to fr -> "Interdit"
      expect(result.errors.forbidden).toBe('Interdit')
      // fr-CA and fr both missing network -> falls through to en -> "Network error"
      expect(result.errors.network).toBe('Network error')
    })
  })

  describe('handling missing locale files (Promise.allSettled behavior)', () => {
    it('silently skips chain locales that fail to load', async () => {
      // pt-PT is in default chain for pt-BR but has no translations
      const innerLoader = createMockLoader({
        en: enMessages,
        pt: ptMessages,
        'pt-BR': ptBRMessages,
        // pt-PT is NOT provided -> will throw
      })

      const loader = new LocaleChainLoader(innerLoader, {
        defaultLocale: 'en',
      })

      // defaultFallbacks['pt-BR'] = ['pt-PT', 'pt']
      // Load order: en -> pt -> pt-PT (fails, skipped) -> pt-BR
      const result = await loadTranslation(loader, 'pt-BR')

      expect(result).toEqual({
        common: { save: 'Salvar', cancel: 'Cancelar', delete: 'Delete' },
        profile: { title: 'Perfil', bio: 'Biography' },
      })
    })

    it('returns empty object when all locales fail including defaultLocale', async () => {
      const innerLoader = createMockLoader({})

      const loader = new LocaleChainLoader(innerLoader, {
        defaultLocale: 'en',
      })

      const result = await loadTranslation(loader, 'pt-BR')

      expect(result).toEqual({})
    })

    it('still merges available translations when some chain locales fail', async () => {
      const innerLoader = createMockLoader({
        en: enMessages,
        // fr fails to load
        'fr-CA': frCAMessages,
      })

      const loader = new LocaleChainLoader(innerLoader, {
        defaultLocale: 'en',
      })

      // defaultFallbacks['fr-CA'] = ['fr']
      // fr fails -> skip, only en + fr-CA
      const result = await loadTranslation(loader, 'fr-CA')

      expect(result).toEqual({
        common: { save: 'Sauvegarder', cancel: 'Cancel', delete: 'Delete' },
        profile: { title: 'Profile', bio: 'Biography' },
      })
    })
  })

  describe('fallback configuration modes', () => {
    it('uses defaultFallbacks when no options.fallbacks provided', async () => {
      const innerLoader = createMockLoader({
        en: enMessages,
        fr: frMessages,
        'fr-CA': frCAMessages,
      })

      const loader = new LocaleChainLoader(innerLoader)

      // defaultFallbacks['fr-CA'] = ['fr']
      const result = await loadTranslation(loader, 'fr-CA')

      // No defaultLocale, so chain is just: fr -> fr-CA
      expect(result).toEqual({
        common: { save: 'Sauvegarder', cancel: 'Annuler' },
        profile: { title: 'Profil' },
      })
    })

    it('merges custom fallbacks with defaults by default (mergeDefaults = true)', async () => {
      const innerLoader = createMockLoader({
        en: enMessages,
        fr: frMessages,
        'fr-CA': frCAMessages,
      })

      const loader = new LocaleChainLoader(innerLoader, {
        defaultLocale: 'en',
        fallbacks: {
          'custom-locale': ['en'],
        },
      })

      // fr-CA should still use defaultFallbacks['fr-CA'] = ['fr'] because mergeDefaults defaults to true
      const result = await loadTranslation(loader, 'fr-CA')

      expect(result).toEqual({
        common: { save: 'Sauvegarder', cancel: 'Annuler', delete: 'Delete' },
        profile: { title: 'Profil', bio: 'Biography' },
      })
    })

    it('uses only custom fallbacks when mergeDefaults is false', async () => {
      const innerLoader = createMockLoader({
        en: enMessages,
        fr: frMessages,
        'fr-CA': frCAMessages,
      })

      const loader = new LocaleChainLoader(innerLoader, {
        defaultLocale: 'en',
        fallbacks: {
          'pt-BR': ['pt'],
        },
        mergeDefaults: false,
      })

      // fr-CA is NOT in the custom fallbacks, so chain is []
      // Only en (defaultLocale) + fr-CA
      const result = await loadTranslation(loader, 'fr-CA')

      expect(result).toEqual({
        common: { save: 'Sauvegarder', cancel: 'Cancel', delete: 'Delete' },
        profile: { title: 'Profile', bio: 'Biography' },
      })
    })

    it('overrides default chain for a specific locale', async () => {
      const innerLoader = createMockLoader({
        en: enMessages,
        pt: ptMessages,
        'pt-BR': ptBRMessages,
      })

      const loader = new LocaleChainLoader(innerLoader, {
        defaultLocale: 'en',
        fallbacks: {
          'pt-BR': ['pt'], // simpler chain, no pt-PT
        },
      })

      const result = await loadTranslation(loader, 'pt-BR')

      expect(result).toEqual({
        common: { save: 'Salvar', cancel: 'Cancelar', delete: 'Delete' },
        profile: { title: 'Perfil', bio: 'Biography' },
      })
    })
  })

  describe('deduplication', () => {
    it('does not load defaultLocale twice when it appears in the chain', async () => {
      const getTranslation = vi.fn((lang: string) => {
        if (lang === 'en') return of(enMessages)
        return throwError(() => new Error('Not found'))
      })

      const innerLoader: TranslocoLoader = { getTranslation }

      const loader = new LocaleChainLoader(innerLoader, {
        defaultLocale: 'en',
        fallbacks: { 'en-GB': ['en'] },
        mergeDefaults: false,
      })

      await loadTranslation(loader, 'en')

      // en appears as both defaultLocale and the requested locale - should only load once
      expect(getTranslation).toHaveBeenCalledTimes(1)
    })

    it('does not load the same locale twice when it appears in chain and as defaultLocale', async () => {
      const getTranslation = vi.fn((lang: string) => {
        const map: Record<string, Translation> = {
          en: enMessages,
          'en-GB': { common: { colour: 'Colour' } },
        }
        if (map[lang]) return of(map[lang])
        return throwError(() => new Error('Not found'))
      })

      const innerLoader: TranslocoLoader = { getTranslation }

      const loader = new LocaleChainLoader(innerLoader, {
        defaultLocale: 'en',
      })

      // defaultFallbacks['en-GB'] = ['en']
      // Load order: en (defaultLocale) -> en-GB; 'en' from chain deduplicated with defaultLocale
      await loadTranslation(loader, 'en-GB')

      expect(getTranslation).toHaveBeenCalledTimes(2) // en, en-GB (not en twice)
    })
  })

  describe('Observable and Promise inner loaders', () => {
    it('works with an inner loader that returns Observables', async () => {
      const innerLoader: TranslocoLoader = {
        getTranslation(lang: string) {
          if (lang === 'en') return of(enMessages)
          if (lang === 'fr') return of(frMessages)
          if (lang === 'fr-CA') return of(frCAMessages)
          return throwError(() => new Error('Not found'))
        },
      }

      const loader = new LocaleChainLoader(innerLoader, {
        defaultLocale: 'en',
      })

      const result = await loadTranslation(loader, 'fr-CA')

      expect(result).toEqual({
        common: { save: 'Sauvegarder', cancel: 'Annuler', delete: 'Delete' },
        profile: { title: 'Profil', bio: 'Biography' },
      })
    })

    it('works with an inner loader that returns Promises', async () => {
      const innerLoader: TranslocoLoader = {
        getTranslation(lang: string) {
          if (lang === 'en') return Promise.resolve(enMessages)
          if (lang === 'fr') return Promise.resolve(frMessages)
          if (lang === 'fr-CA') return Promise.resolve(frCAMessages)
          return Promise.reject(new Error('Not found'))
        },
      }

      const loader = new LocaleChainLoader(innerLoader, {
        defaultLocale: 'en',
      })

      const result = await loadTranslation(loader, 'fr-CA')

      expect(result).toEqual({
        common: { save: 'Sauvegarder', cancel: 'Annuler', delete: 'Delete' },
        profile: { title: 'Profil', bio: 'Biography' },
      })
    })
  })

  describe('no defaultLocale', () => {
    it('works without a defaultLocale option', async () => {
      const innerLoader = createMockLoader({
        fr: frMessages,
        'fr-CA': frCAMessages,
      })

      const loader = new LocaleChainLoader(innerLoader)

      const result = await loadTranslation(loader, 'fr-CA')

      // No defaultLocale, chain is just: fr -> fr-CA
      expect(result).toEqual({
        common: { save: 'Sauvegarder', cancel: 'Annuler' },
        profile: { title: 'Profil' },
      })
    })
  })

  describe('load order', () => {
    it('loads in order: defaultLocale, chain reversed, requested locale', async () => {
      const callOrder: string[] = []

      const innerLoader: TranslocoLoader = {
        getTranslation(lang: string) {
          callOrder.push(lang)
          return of({})
        },
      }

      const loader = new LocaleChainLoader(innerLoader, {
        defaultLocale: 'en',
        fallbacks: { 'zh-Hant-HK': ['zh-Hant-TW', 'zh-Hant'] },
        mergeDefaults: false,
      })

      await loadTranslation(loader, 'zh-Hant-HK')

      // Chain for zh-Hant-HK: ['zh-Hant-TW', 'zh-Hant']
      // Reversed chain: ['zh-Hant', 'zh-Hant-TW']
      // Load order: en (default), zh-Hant (lowest priority in chain), zh-Hant-TW, zh-Hant-HK (requested)
      expect(callOrder).toEqual(['en', 'zh-Hant', 'zh-Hant-TW', 'zh-Hant-HK'])
    })
  })
})
