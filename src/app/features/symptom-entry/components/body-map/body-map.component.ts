import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { BodyLocation } from '../../../../core/models/symptom-entry.model';

/** Labels français des régions anatomiques */
const REGION_LABELS: Record<string, string> = {
  head: $localize`:@@bodyMap.region.head:Tête`,
  thorax: $localize`:@@bodyMap.region.thorax:Thorax`,
  'abdomen-upper': $localize`:@@bodyMap.region.abdomenUpper:Abdomen haut`,
  'abdomen-left': $localize`:@@bodyMap.region.abdomenLeft:Abdomen gauche`,
  'abdomen-right': $localize`:@@bodyMap.region.abdomenRight:Abdomen droit`,
  'abdomen-lower': $localize`:@@bodyMap.region.abdomenLower:Abdomen bas`,
  pelvis: $localize`:@@bodyMap.region.pelvis:Pelvis`,
  'left-arm': $localize`:@@bodyMap.region.leftArm:Bras gauche`,
  'right-arm': $localize`:@@bodyMap.region.rightArm:Bras droit`,
  'left-leg': $localize`:@@bodyMap.region.leftLeg:Jambe gauche`,
  'right-leg': $localize`:@@bodyMap.region.rightLeg:Jambe droite`,
};

@Component({
  selector: 'gt-body-map',
  standalone: true,
  templateUrl: './body-map.component.html',
  styleUrl: './body-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BodyMapComponent {
  // 1. Inputs
  /** Région actuellement sélectionnée (pour mise en évidence visuelle) */
  readonly selectedRegion = input<string | null>(null);

  // 2. Outputs
  readonly locationSelected = output<BodyLocation>();

  // 3. Injections
  private readonly _http = inject(HttpClient);
  private readonly _sanitizer = inject(DomSanitizer);
  private readonly _container = viewChild<ElementRef<HTMLDivElement>>('mapContainer');

  /** Contenu SVG chargé depuis les assets */
  readonly svgContent = toSignal<SafeHtml | null>(
    this._http.get('body-map/body-map.svg', { responseType: 'text' }).pipe(
      map(svg => this._sanitizer.bypassSecurityTrustHtml(svg)),
    ),
    { initialValue: null },
  );

  /** Signal interne pour l'état du chargement SVG (déclenche l'effet) */
  private readonly _svgReady = signal(false);

  constructor() {
    // Met à jour la zone active après chaque changement de région ou de chargement SVG
    effect(() => {
      // Dépendances explicites : région sélectionnée + contenu SVG chargé
      const region = this.selectedRegion();
      const loaded = !!this.svgContent();

      if (!loaded) return;

      // Planification dans un microtask pour laisser Angular appliquer [innerHTML]
      queueMicrotask(() => this._updateActiveZone(region));
    });
  }

  // 5. Computed (méthode car computed ne peut pas retourner null facilement)
  selectedRegionLabel(): string | null {
    const region = this.selectedRegion();
    return region ? (REGION_LABELS[region] ?? region) : null;
  }

  // 7. Méthodes publiques
  onContainerClick(event: MouseEvent): void {
    const target = event.target as Element;
    const zone = target.closest('[data-region]');
    if (!zone) return;

    const region = zone.getAttribute('data-region');
    if (!region) return;

    const container = this._container()?.nativeElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);

    this.locationSelected.emit({ x, y, region });
  }

  // 8. Méthodes privées
  private _updateActiveZone(region: string | null): void {
    const container = this._container()?.nativeElement;
    if (!container) return;

    container.querySelectorAll('[data-region]').forEach(el => {
      el.classList.remove('body-zone--active');
    });

    if (region) {
      container.querySelector(`[data-region="${region}"]`)?.classList.add('body-zone--active');
    }
  }
}
