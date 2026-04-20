import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal
} from '@angular/core';
import { BaseFormField } from '../base/base-form-field';
import { LucideAngularModule } from 'lucide-angular';
import { provideControlValueAccessor } from '@shared/ui/form-controls/base/base-control-value-accessor';
import { resolveAriaLabel } from '../utils/aria-label.utils';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.css',
  providers: [provideControlValueAccessor(InputComponent)],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent extends BaseFormField<string> {
  readonly type = input<'text' | 'password' | 'email' | 'number'>('text');
  readonly autocomplete = input('off');
  readonly hasError = input(false);
  readonly errorMessage = input('');

  readonly showPassword = signal(false);

  readonly errorId = computed(() => `${this.inputId()}-error`);

  readonly resolvedAriaLabel = computed(() => 
    resolveAriaLabel(
      this.hasVisibleLabel(),
      this.ariaLabel(),
      this.placeholder(),
      'Campo'
    )
  );
  readonly isPasswordType = computed(() => this.type() === 'password');
  readonly resolvedInputType = computed(() => {
    if (this.isPasswordType() && this.showPassword()) {
      return 'text';
    }
    return this.type();
  });

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updateValue(target.value);
  }

  togglePasswordVisibility(): void {
    if (!this.isPasswordType() || this.disabled) {
      return;
    }

    this.showPassword.update((isVisible) => !isVisible);
  }
}
