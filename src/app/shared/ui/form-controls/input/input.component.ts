import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { BaseControlValueAccessor } from '../base/base-control-value-accessor';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './input.component.html',
  styleUrl: './input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent extends BaseControlValueAccessor<string> {
  private static nextId = 0;



  readonly id = input('');
  readonly label = input('');
  readonly type = input<'text' | 'password' | 'email' | 'number'>('text');
  readonly placeholder = input('');
  readonly autocomplete = input('off');
  readonly hasError = input(false);
  readonly errorMessage = input('');

  readonly showPassword = signal(false);

  private readonly fallbackId = `app-input-${InputComponent.nextId++}`;

  constructor() {
    super('');
  }

  get inputId(): string {
    return this.id() || this.fallbackId;
  }

  get errorId(): string {
    return `${this.inputId}-error`;
  }

  get isPasswordType(): boolean {
    return this.type() === 'password';
  }

  get resolvedInputType(): 'text' | 'password' | 'email' | 'number' {
    if (this.isPasswordType && this.showPassword()) {
      return 'text';
    }

    return this.type();
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChangeFn(this.value);
  }

  togglePasswordVisibility(): void {
    if (!this.isPasswordType || this.disabled) {
      return;
    }

    this.showPassword.update((isVisible) => !isVisible);
  }
}
