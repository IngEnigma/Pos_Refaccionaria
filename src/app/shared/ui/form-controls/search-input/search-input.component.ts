import { NgOptimizedImage } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.css'
})
export class SearchInputComponent {
  readonly searchIconPath = input('assets/icons/search.svg');
  readonly searchChange = output<string>();
  readonly searchPlaceholder = input('Buscar por código, producto o cliente');  

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchChange.emit(target.value);
  }
}
