## 1.0.0

- Initial release
- `LocaleChainLoader` — TranslocoLoader adapter with per-key deep merge across locale fallback chains
- `LocaleChainFallbackStrategy` — TranslocoFallbackStrategy for locale-level load failures
- Default fallback chains for Chinese, Portuguese, Spanish, French, German, Italian, Dutch, English, Arabic, Norwegian, and Malay regional variants
- Three configuration modes: default, override-merge, full-custom
- Works with both Observable and Promise inner loaders
- Fixes Transloco bug #574: missing keys now fall through to the next locale in the chain
