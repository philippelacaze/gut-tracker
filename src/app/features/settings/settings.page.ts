import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'gt-settings-page',
  standalone: true,
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent {}
