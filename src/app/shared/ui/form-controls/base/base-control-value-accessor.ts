import { ControlValueAccessor } from '@angular/forms';

export abstract class BaseControlValueAccessor<T> implements ControlValueAccessor {
  value: T;
  disabled = false;

  protected readonly initialValue: T;
  onChangeFn: (value: T) => void = () => {};
  onTouchedFn: () => void = () => {};

  protected constructor(initialValue: T) {
    this.initialValue = initialValue;
    this.value = initialValue;
  }

  writeValue(value: T | null): void {
    this.value = value ?? this.initialValue;
  }

  registerOnChange(fn: (value: T) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
