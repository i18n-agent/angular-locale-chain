import { describe, it, expect } from 'vitest'
import { LocaleChainFallbackStrategy } from '../src/locale-chain-fallback-strategy'
import { defaultFallbacks } from '../src/fallback-map'

describe('LocaleChainFallbackStrategy', () => {
  describe('getNextLangs with default fallbacks', () => {
    const strategy = new LocaleChainFallbackStrategy()

    it('returns correct chain for pt-BR', () => {
      expect(strategy.getNextLangs('pt-BR')).toEqual(['pt-PT', 'pt'])
    })

    it('returns correct chain for fr-CA', () => {
      expect(strategy.getNextLangs('fr-CA')).toEqual(['fr'])
    })

    it('returns correct chain for es-MX', () => {
      expect(strategy.getNextLangs('es-MX')).toEqual(['es-419', 'es'])
    })

    it('returns correct chain for de-AT', () => {
      expect(strategy.getNextLangs('de-AT')).toEqual(['de'])
    })

    it('returns correct chain for en-AU', () => {
      expect(strategy.getNextLangs('en-AU')).toEqual(['en-GB', 'en'])
    })

    it('returns correct chain for en-NZ (3-level chain)', () => {
      expect(strategy.getNextLangs('en-NZ')).toEqual(['en-AU', 'en-GB', 'en'])
    })

    it('returns correct chain for zh-Hant-MO (3-level chain)', () => {
      expect(strategy.getNextLangs('zh-Hant-MO')).toEqual(['zh-Hant-HK', 'zh-Hant-TW', 'zh-Hant'])
    })

    it('returns correct chain for nn', () => {
      expect(strategy.getNextLangs('nn')).toEqual(['nb', 'no'])
    })

    it('returns correct chain for nb', () => {
      expect(strategy.getNextLangs('nb')).toEqual(['no'])
    })

    it('returns correct chain for ar-SA', () => {
      expect(strategy.getNextLangs('ar-SA')).toEqual(['ar'])
    })

    it('returns correct chain for ms-MY', () => {
      expect(strategy.getNextLangs('ms-MY')).toEqual(['ms'])
    })

    it('returns empty array for locale without a chain', () => {
      expect(strategy.getNextLangs('en')).toEqual([])
    })

    it('returns empty array for unknown locale', () => {
      expect(strategy.getNextLangs('xyz')).toEqual([])
    })

    it('returns same chains as defaultFallbacks for all known locales', () => {
      for (const [locale, chain] of Object.entries(defaultFallbacks)) {
        expect(
          strategy.getNextLangs(locale),
          `strategy chain for ${locale} should match defaultFallbacks`
        ).toEqual(chain)
      }
    })
  })

  describe('custom fallbacks with mergeDefaults (default: true)', () => {
    it('merges custom fallbacks with defaults', () => {
      const strategy = new LocaleChainFallbackStrategy({
        fallbacks: {
          'custom-locale': ['en-GB', 'en'],
        },
      })

      // Custom locale should be available
      expect(strategy.getNextLangs('custom-locale')).toEqual(['en-GB', 'en'])
      // Default locale chains should still work
      expect(strategy.getNextLangs('pt-BR')).toEqual(['pt-PT', 'pt'])
      expect(strategy.getNextLangs('fr-CA')).toEqual(['fr'])
    })

    it('overrides a default chain with custom fallbacks', () => {
      const strategy = new LocaleChainFallbackStrategy({
        fallbacks: {
          'pt-BR': ['pt'], // simpler chain, no pt-PT
        },
      })

      expect(strategy.getNextLangs('pt-BR')).toEqual(['pt'])
      // Other defaults still intact
      expect(strategy.getNextLangs('fr-CA')).toEqual(['fr'])
    })
  })

  describe('custom fallbacks with mergeDefaults: false', () => {
    it('uses only custom fallbacks, ignoring defaults', () => {
      const strategy = new LocaleChainFallbackStrategy({
        fallbacks: {
          'pt-BR': ['pt'],
          'custom-locale': ['en'],
        },
        mergeDefaults: false,
      })

      expect(strategy.getNextLangs('pt-BR')).toEqual(['pt'])
      expect(strategy.getNextLangs('custom-locale')).toEqual(['en'])
      // Default chains are NOT available
      expect(strategy.getNextLangs('fr-CA')).toEqual([])
      expect(strategy.getNextLangs('de-AT')).toEqual([])
    })
  })

  describe('no options', () => {
    it('works with no options at all', () => {
      const strategy = new LocaleChainFallbackStrategy()
      expect(strategy.getNextLangs('pt-BR')).toEqual(['pt-PT', 'pt'])
    })

    it('works with empty options object', () => {
      const strategy = new LocaleChainFallbackStrategy({})
      expect(strategy.getNextLangs('pt-BR')).toEqual(['pt-PT', 'pt'])
    })
  })

  describe('TranslocoFallbackStrategy interface compliance', () => {
    it('implements getNextLangs method', () => {
      const strategy = new LocaleChainFallbackStrategy()
      expect(typeof strategy.getNextLangs).toBe('function')
    })

    it('getNextLangs always returns an array', () => {
      const strategy = new LocaleChainFallbackStrategy()

      const testLocales = [
        'en', 'fr', 'de', 'pt-BR', 'fr-CA', 'es-MX',
        'unknown', '', 'xx-YY-ZZ',
      ]

      for (const locale of testLocales) {
        const result = strategy.getNextLangs(locale)
        expect(Array.isArray(result), `getNextLangs('${locale}') should return an array`).toBe(true)
      }
    })
  })
})
