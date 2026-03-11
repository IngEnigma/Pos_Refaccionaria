import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-refounds-page',
  standalone: true,
  templateUrl: './refounds.page.html',
  styleUrl: './refounds.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RefoundsPageComponent {}
