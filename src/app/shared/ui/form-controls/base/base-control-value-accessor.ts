import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Provider, Type, forwardRef, signal } from '@angular/core';

export abstract class BaseControlValueAccessor<T> implements ControlValueAccessor {
  private readonly _value = signal<T | undefined>(undefined);
  private readonly _disabled = signal(false);

  private _onChangeFn: (value: T) => void = () => {};
  private _onTouchedFn: () => void = () => {};

  get value(): T | undefined {
    return this._value();
  }

  get disabled(): boolean {
    return this._disabled();
  }

  protected updateValue(value: T): void {
    this._value.set(value);
    this._onChangeFn(value);
  }

  protected markAsTouched(): void {
    this._onTouchedFn();
  }

  writeValue(value: T | null): void {
    this._value.set(value ?? (undefined as T));
  }

  registerOnChange(fn: (value: T) => void): void {
    this._onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabled.set(isDisabled);
  }
}

export function provideControlValueAccessor(component: Type<any>): Provider {
  return {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => component),
    multi: true,
  };
}
