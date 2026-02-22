import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Définit une entrée de navigation */
interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly iconPath: string;
  readonly ariaLabel: string;
}

/** Chemins SVG (viewBox="0 0 24 24") — Material Icons */
const ICONS = {
  // restaurant — fourchette + cuillère
  food: 'M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z',
  // person — silhouette corps
  symptoms:
    'M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z',
  // add_circle — croix médicale
  medication:
    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z',
  // bar_chart — histogramme
  analysis: 'M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z',
  // upload — flèche export
  export: 'M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z',
  // settings — engrenage
  settings:
    'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.04.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
} as const;

@Component({
  selector: 'gt-main-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './main-nav.component.html',
  styleUrl: './main-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainNavComponent {
  /** Éléments principaux (sidebar desktop + partie de la bottom bar mobile) */
  protected readonly primaryNavItems: readonly NavItem[] = [
    {
      path: '/food',
      label: $localize`Alimentation`,
      iconPath: ICONS.food,
      ariaLabel: $localize`Saisie alimentaire`,
    },
    {
      path: '/symptoms',
      label: $localize`Symptômes`,
      iconPath: ICONS.symptoms,
      ariaLabel: $localize`Saisie des symptômes`,
    },
    {
      path: '/medication',
      label: $localize`Médicaments`,
      iconPath: ICONS.medication,
      ariaLabel: $localize`Saisie des médicaments`,
    },
    {
      path: '/analysis',
      label: $localize`Analyse IA`,
      iconPath: ICONS.analysis,
      ariaLabel: $localize`Analyse IA`,
    },
    {
      path: '/export',
      label: $localize`Export`,
      iconPath: ICONS.export,
      ariaLabel: $localize`Exporter les données`,
    },
  ];

  /** Paramètres — affiché séparément en pied de sidebar */
  protected readonly settingsItem: NavItem = {
    path: '/settings',
    label: $localize`Paramètres`,
    iconPath: ICONS.settings,
    ariaLabel: $localize`Paramètres`,
  };

  /**
   * Bottom bar mobile : 5 onglets (sans Export, moins fréquent sur mobile)
   * food | symptoms | medication | analysis | settings
   */
  protected readonly mobileNavItems: readonly NavItem[] = [
    this.primaryNavItems[0],
    this.primaryNavItems[1],
    this.primaryNavItems[2],
    this.primaryNavItems[3],
    this.settingsItem,
  ];
}
