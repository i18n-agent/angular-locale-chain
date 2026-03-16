import { Component } from '@angular/core';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TranslocoModule],
  template: `
    <h1>angular-locale-chain Example</h1>

    <div>
      <button (click)="switchLang('en')">English</button>
      <button (click)="switchLang('pt')">Portuguese</button>
      <button (click)="switchLang('pt-BR')">Brazilian Portuguese</button>
    </div>

    <hr />

    <ng-container *transloco="let t">
      <p>greeting: {{ t('greeting') }}</p>
      <p>farewell: {{ t('farewell') }}</p>
      <p>welcome: {{ t('welcome') }}</p>
    </ng-container>

    <p><em>Active locale: {{ activeLang }}</em></p>

    <h2>Expected behavior for pt-BR</h2>
    <ul>
      <li><strong>greeting</strong> = "Oi" (from pt-BR.json)</li>
      <li><strong>farewell</strong> = "Adeus" (from pt.json -- fallback chain)</li>
      <li><strong>welcome</strong> = "Welcome to LocaleChain" (from en.json -- default locale)</li>
    </ul>
  `,
})
export class AppComponent {
  activeLang: string;

  constructor(private translocoService: TranslocoService) {
    this.activeLang = this.translocoService.getActiveLang();
  }

  switchLang(lang: string) {
    this.translocoService.setActiveLang(lang);
    this.activeLang = lang;
  }
}
