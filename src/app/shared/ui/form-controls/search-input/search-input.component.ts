import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  output
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
}
