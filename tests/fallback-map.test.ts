import { describe, it, expect } from 'vitest'
import { defaultFallbacks, mergeFallbacks, type FallbackMap } from '../src/fallback-map'

describe('defaultFallbacks', () => {
  describe('Chinese chains', () => {
    it('zh-Hant-HK falls back to zh-Hant-TW then zh-Hant', () => {
      expect(defaultFallbacks['zh-Hant-HK']).toEqual(['zh-Hant-TW', 'zh-Hant'])
    })

    it('zh-Hant-MO falls back to zh-Hant-HK then zh-Hant-TW then zh-Hant', () => {
      expect(defaultFallbacks['zh-Hant-MO']).toEqual(['zh-Hant-HK', 'zh-Hant-TW', 'zh-Hant'])
    })

    it('zh-Hant-TW falls back to zh-Hant', () => {
      expect(defaultFallbacks['zh-Hant-TW']).toEqual(['zh-Hant'])
    })

    it('zh-Hans-SG falls back to zh-Hans', () => {
      expect(defaultFallbacks['zh-Hans-SG']).toEqual(['zh-Hans'])
    })

    it('zh-Hans-MY falls back to zh-Hans', () => {
      expect(defaultFallbacks['zh-Hans-MY']).toEqual(['zh-Hans'])
    })
  })

  describe('Portuguese chains', () => {
    it('pt-BR falls back to pt-PT then pt', () => {
      expect(defaultFallbacks['pt-BR']).toEqual(['pt-PT', 'pt'])
    })

    it('pt-PT falls back to pt', () => {
      expect(defaultFallbacks['pt-PT']).toEqual(['pt'])
    })

    it('pt-AO falls back to pt-PT then pt', () => {
      expect(defaultFallbacks['pt-AO']).toEqual(['pt-PT', 'pt'])
    })

    it('pt-MZ falls back to pt-PT then pt', () => {
      expect(defaultFallbacks['pt-MZ']).toEqual(['pt-PT', 'pt'])
    })
  })

  describe('Spanish chains', () => {
    it('es-419 falls back to es', () => {
      expect(defaultFallbacks['es-419']).toEqual(['es'])
    })

    it('es-MX falls back to es-419 then es', () => {
      expect(defaultFallbacks['es-MX']).toEqual(['es-419', 'es'])
    })

    it('es-AR falls back to es-419 then es', () => {
      expect(defaultFallbacks['es-AR']).toEqual(['es-419', 'es'])
    })

    it('es-CO falls back to es-419 then es', () => {
      expect(defaultFallbacks['es-CO']).toEqual(['es-419', 'es'])
    })
  })

  describe('French chains', () => {
    it('fr-CA falls back to fr', () => {
      expect(defaultFallbacks['fr-CA']).toEqual(['fr'])
    })

    it('fr-BE falls back to fr', () => {
      expect(defaultFallbacks['fr-BE']).toEqual(['fr'])
    })

    it('fr-CH falls back to fr', () => {
      expect(defaultFallbacks['fr-CH']).toEqual(['fr'])
    })
  })

  describe('German chains', () => {
    it('de-AT falls back to de', () => {
      expect(defaultFallbacks['de-AT']).toEqual(['de'])
    })

    it('de-CH falls back to de', () => {
      expect(defaultFallbacks['de-CH']).toEqual(['de'])
    })

    it('de-LU falls back to de', () => {
      expect(defaultFallbacks['de-LU']).toEqual(['de'])
    })

    it('de-LI falls back to de', () => {
      expect(defaultFallbacks['de-LI']).toEqual(['de'])
    })
  })

  describe('English chains', () => {
    it('en-GB falls back to en', () => {
      expect(defaultFallbacks['en-GB']).toEqual(['en'])
    })

    it('en-AU falls back to en-GB then en', () => {
      expect(defaultFallbacks['en-AU']).toEqual(['en-GB', 'en'])
    })

    it('en-NZ falls back to en-AU then en-GB then en', () => {
      expect(defaultFallbacks['en-NZ']).toEqual(['en-AU', 'en-GB', 'en'])
    })

    it('en-IN falls back to en-GB then en', () => {
      expect(defaultFallbacks['en-IN']).toEqual(['en-GB', 'en'])
    })

    it('en-CA falls back to en', () => {
      expect(defaultFallbacks['en-CA']).toEqual(['en'])
    })
  })

  describe('Arabic chains', () => {
    it('ar-SA falls back to ar', () => {
      expect(defaultFallbacks['ar-SA']).toEqual(['ar'])
    })

    it('ar-EG falls back to ar', () => {
      expect(defaultFallbacks['ar-EG']).toEqual(['ar'])
    })

    it('ar-AE falls back to ar', () => {
      expect(defaultFallbacks['ar-AE']).toEqual(['ar'])
    })
  })

  describe('Norwegian chains', () => {
    it('nb falls back to no', () => {
      expect(defaultFallbacks['nb']).toEqual(['no'])
    })

    it('nn falls back to nb then no', () => {
      expect(defaultFallbacks['nn']).toEqual(['nb', 'no'])
    })
  })

  describe('Other chains', () => {
    it('it-CH falls back to it', () => {
      expect(defaultFallbacks['it-CH']).toEqual(['it'])
    })

    it('nl-BE falls back to nl', () => {
      expect(defaultFallbacks['nl-BE']).toEqual(['nl'])
    })

    it('ms-MY falls back to ms', () => {
      expect(defaultFallbacks['ms-MY']).toEqual(['ms'])
    })

    it('ms-SG falls back to ms', () => {
      expect(defaultFallbacks['ms-SG']).toEqual(['ms'])
    })
  })

  describe('structural invariants', () => {
    it('all chains are non-empty arrays', () => {
      for (const [locale, chain] of Object.entries(defaultFallbacks)) {
        expect(chain, `chain for ${locale} should be a non-empty array`).toBeInstanceOf(Array)
        expect(chain.length, `chain for ${locale} should not be empty`).toBeGreaterThan(0)
      }
    })

    it('no self-references in any chain', () => {
      for (const [locale, chain] of Object.entries(defaultFallbacks)) {
        expect(chain, `chain for ${locale} should not contain itself`).not.toContain(locale)
      }
    })

    it('all language groups are represented', () => {
      const groups = {
        Chinese: ['zh-Hant-HK', 'zh-Hant-TW', 'zh-Hans-SG'],
        Portuguese: ['pt-BR', 'pt-PT'],
        Spanish: ['es-419', 'es-MX'],
        French: ['fr-CA', 'fr-BE'],
        German: ['de-AT', 'de-CH'],
        English: ['en-GB', 'en-AU'],
        Arabic: ['ar-SA', 'ar-EG'],
        Norwegian: ['nb', 'nn'],
        Italian: ['it-CH'],
        Dutch: ['nl-BE'],
        Malay: ['ms-MY'],
      }

      for (const [group, locales] of Object.entries(groups)) {
        for (const locale of locales) {
          expect(
            defaultFallbacks[locale],
            `${group} locale ${locale} should be in defaultFallbacks`
          ).toBeDefined()
        }
      }
    })
  })
})

describe('mergeFallbacks', () => {
  it('overrides replace matching keys', () => {
    const defaults: FallbackMap = {
      'pt-BR': ['pt-PT', 'pt'],
      'fr-CA': ['fr'],
    }
    const overrides: FallbackMap = {
      'pt-BR': ['pt'],
    }
    const result = mergeFallbacks(defaults, overrides)
    expect(result['pt-BR']).toEqual(['pt'])
    expect(result['fr-CA']).toEqual(['fr'])
  })

  it('adds new locales from overrides', () => {
    const defaults: FallbackMap = {
      'pt-BR': ['pt-PT', 'pt'],
    }
    const overrides: FallbackMap = {
      'zh-Hant': ['zh-Hans', 'zh'],
    }
    const result = mergeFallbacks(defaults, overrides)
    expect(result['pt-BR']).toEqual(['pt-PT', 'pt'])
    expect(result['zh-Hant']).toEqual(['zh-Hans', 'zh'])
  })

  it('preserves defaults when overrides is empty', () => {
    const defaults: FallbackMap = {
      'pt-BR': ['pt-PT', 'pt'],
      'fr-CA': ['fr'],
    }
    const overrides: FallbackMap = {}
    const result = mergeFallbacks(defaults, overrides)
    expect(result).toEqual(defaults)
  })

  it('does not mutate original maps', () => {
    const defaults: FallbackMap = {
      'pt-BR': ['pt-PT', 'pt'],
    }
    const overrides: FallbackMap = {
      'pt-BR': ['pt'],
    }
    const defaultsCopy = { ...defaults }
    const overridesCopy = { ...overrides }
    mergeFallbacks(defaults, overrides)
    expect(defaults).toEqual(defaultsCopy)
    expect(overrides).toEqual(overridesCopy)
  })

  it('returns a new object', () => {
    const defaults: FallbackMap = { 'pt-BR': ['pt'] }
    const overrides: FallbackMap = {}
    const result = mergeFallbacks(defaults, overrides)
    expect(result).not.toBe(defaults)
    expect(result).not.toBe(overrides)
  })
})
