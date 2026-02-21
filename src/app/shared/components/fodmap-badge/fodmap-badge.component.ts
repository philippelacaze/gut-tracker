import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'gt-fodmap-badge',
  standalone: true,
  templateUrl: './fodmap-badge.component.html',
  styleUrl: './fodmap-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FodmapBadgeComponent {
  readonly level = input<'low' | 'medium' | 'high' | null>(null);
  readonly score = input<number | null>(null);

  readonly label = computed(() => {
    switch (this.level()) {
      case 'low':
        return $localize`:@@fodmap.low:Faible`;
      case 'medium':
        return $localize`:@@fodmap.medium:Modéré`;
      case 'high':
        return $localize`:@@fodmap.high:Élevé`;
      default:
        return null;
    }
  });
}
