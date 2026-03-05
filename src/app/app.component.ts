import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppSettingsService } from '@core/config/app-settings';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'FrontTRT';

  constructor(public appSettings: AppSettingsService) {}  
  
}
