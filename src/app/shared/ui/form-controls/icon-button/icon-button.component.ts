import { NgOptimizedImage } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './icon-button.component.html',
  styleUrl: './icon-button.component.css'
})
export class IconButtonComponent {

  readonly icon = input.required<string>();
  readonly ariaLabel = input.required<string>();
  readonly isActive = input<boolean>(false);

  readonly clicked = output<void>();

  onClick() {
    this.clicked.emit();
  }
}
