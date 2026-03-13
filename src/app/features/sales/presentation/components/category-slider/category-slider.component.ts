import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-category-slider',
  standalone: true,
  templateUrl: './category-slider.component.html',
  styleUrl: './category-slider.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategorySliderComponent {
  readonly categories = input<string[]>([]);
  readonly selected = output<string>();

  selectCategory(category: string): void {
    this.selected.emit(category);
  }
}
