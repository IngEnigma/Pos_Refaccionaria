import { ChangeDetectionStrategy, Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-input',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="input-container">
      <label [for]="id()" class="input-label">{{ label() }}</label>
      <input
        [type]="type()"
        [id]="id()"
        [placeholder]="placeholder()"
        [value]="value"
        (input)="onInputChange($event)"
        (blur)="onTouchedFn()"
        [disabled]="disabled"
        class="input-field"
        [class.has-error]="hasError()"
      />
      <div *ngIf="hasError()" class="error-message">
        {{ errorMessage() }}
      </div>
    </div>
  `,
    styles: [`
    .input-container {
      display: flex;
      flex-direction: column;
      margin-bottom: 1.5rem;
    }
    .input-label {
      font-weight: bold;
      margin-bottom: 0.5rem;
      color: #333;
    }
    .input-field {
      width: 100%;
      padding: 0.8rem;
      border: 1px solid #ccc;
      border-radius: 8px;
      box-sizing: border-box;
      font-size: 14px;
      transition: border-color 0.2s;
    }
    .input-field:focus {
      outline: none;
      border-color: #233387;
    }
    .input-field.has-error {
      border-color: #dc2626;
    }
    .error-message {
      color: #dc2626;
      font-size: 12px;
      margin-top: 0.25rem;
    }
  `],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => InputComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent implements ControlValueAccessor {
    id = input('');
    label = input('');
    type = input<'text' | 'password' | 'email' | 'number'>('text');
    placeholder = input('');
    hasError = input(false);
    errorMessage = input('');

    value = '';
    disabled = false;

    onChangeFn: (value: string) => void = () => { };
    onTouchedFn: () => void = () => { };

    onInputChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.value = input.value;
        this.onChangeFn(this.value);
    }

    writeValue(value: string): void {
        this.value = value;
    }

    registerOnChange(fn: any): void {
        this.onChangeFn = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouchedFn = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }
}
