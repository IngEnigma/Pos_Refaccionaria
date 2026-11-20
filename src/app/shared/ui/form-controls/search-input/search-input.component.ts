import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  viewChild
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseFormField } from '../base/base-form-field';
import { provideControlValueAccessor } from '../base/base-control-value-accessor';
import { resolveAriaLabel } from '../utils/aria-label.utils';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.css',
  providers: [provideControlValueAccessor(SearchInputComponent)],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchInputComponent extends BaseFormField<string> implements OnInit {
  override readonly placeholder = input('Buscar...');  
  readonly debounceMs = input(300);
  readonly disabledInput = input(false);

  readonly searchChange = output<string>();
  /** Enter: emite el texto al instante (sin debounce), p. ej. para el lector de código de barras. */
  readonly searchSubmit = output<string>();

  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');

  readonly resolvedAriaLabel = computed(() => 
    resolveAriaLabel(
      this.hasVisibleLabel(),
      this.ariaLabel(),
      this.placeholder(),
      'Buscar'
    )
  );
  
  private readonly searchSubject = new Subject<string>();
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(this.debounceMs()),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((query) => {
      this.updateValue(query);
      this.searchChange.emit(query);
    });
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  onEnter(): void {
    this.searchSubmit.emit(this.field()?.nativeElement.value.trim() ?? '');
  }

  focus(): void {
    this.field()?.nativeElement.focus();
  }

  /** Vacía el campo y la búsqueda; el debounce descarta cualquier texto pendiente. */
  clear(): void {
    const el = this.field()?.nativeElement;
    if (el) el.value = '';
    this.searchSubject.next('');
  }
}
