import { Directive, computed, input } from '@angular/core';
import { BaseControlValueAccessor } from './base-control-value-accessor';

@Directive()
export abstract class BaseFormField<T> extends BaseControlValueAccessor<T> {
  readonly id = input('');
  
  readonly label = input('');
  
  readonly ariaLabel = input('');
  
  readonly placeholder = input('');

  private static nextId = 0;
  
  protected readonly fallbackId = `trt-control-${BaseFormField.nextId++}`;

  readonly inputId = computed(() => this.id() || this.fallbackId);
  
  readonly hasVisibleLabel = computed(() => this.label().trim().length > 0);
}
