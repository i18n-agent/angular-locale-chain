import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  provideTransloco,
  TRANSLOCO_LOADER,
  TRANSLOCO_FALLBACK_STRATEGY,
} from '@jsverse/transloco';
import { LocaleChainLoader, LocaleChainFallbackStrategy } from 'angular-locale-chain';
import { TranslocoHttpLoader } from './transloco-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideTransloco({
      config: {
        availableLangs: ['en', 'pt', 'pt-BR'],
        defaultLang: 'en',
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: false,
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
