import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormField } from '@angular/forms/signals';
import { TranslatePipe } from '@ngx-translate/core';

type FieldType = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';

interface SelectOption {
  labelKey: string;
  value: string;
}

@Component({
  selector: 'app-ui-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormField, TranslatePipe],
  host: {
    class: 'flex flex-col gap-1 text-xs',
  },
  template: `
    @if (labelKey()) {
      <label class="text-[11px] font-semibold text-slate-900 dark:text-slate-50">
        {{ labelKey() | translate }}
        @if (required()) {
          <span class="ms-0.5 text-red-400">*</span>
        }
      </label>
    }

    @if (type() === 'textarea') {
      @if (formField()) {
        <textarea
          class="input-glass min-h-[5rem] text-xs"
          [attr.placeholder]="placeholderKey() ? (placeholderKey() | translate) : null"
          [formField]="formField()"
        ></textarea>
      } @else {
        <textarea
          class="input-glass min-h-[5rem] text-xs"
          [attr.placeholder]="placeholderKey() ? (placeholderKey() | translate) : null"
          [disabled]="disabled()"
        ></textarea>
      }
    } @else if (type() === 'select') {
      @if (formField()) {
        <select
          class="input-glass text-xs"
          [formField]="formField()"
        >
          @if (placeholderKey()) {
            <option value="">
              {{ placeholderKey() | translate }}
            </option>
          }
          @for (option of options(); track option.value) {
            <option [value]="option.value">
              {{ option.labelKey | translate }}
            </option>
          }
        </select>
      } @else {
        <select
          class="input-glass text-xs"
          [disabled]="disabled()"
        >
          @if (placeholderKey()) {
            <option value="">
              {{ placeholderKey() | translate }}
            </option>
          }
          @for (option of options(); track option.value) {
            <option [value]="option.value">
              {{ option.labelKey | translate }}
            </option>
          }
        </select>
      }
    } @else {
      @if (formField()) {
        <input
          class="input-glass text-xs"
          [attr.type]="type()"
          [attr.placeholder]="placeholderKey() ? (placeholderKey() | translate) : null"
          [formField]="formField()"
        />
      } @else {
        <input
          class="input-glass text-xs"
          [attr.type]="type()"
          [attr.placeholder]="placeholderKey() ? (placeholderKey() | translate) : null"
          [disabled]="disabled()"
        />
      }
    }

    @if (hintKey()) {
      <p class="text-[11px] text-muted">
        {{ hintKey() | translate }}
      </p>
    }

    @if (formField() && showErrors()) {
      <ul class="mt-1 space-y-0.5 text-[11px] text-red-400">
        @for (error of (formField()?.errors?.() ?? []); track error.kind ?? error.message) {
          <li>
            {{ error.message | translate }}
          </li>
        }
      </ul>
    }
  `,
})
export class UiFormField {
  readonly type = input<FieldType>('text');
  readonly labelKey = input<string | null>(null);
  readonly placeholderKey = input<string | null>(null);
  readonly hintKey = input<string | null>(null);
  readonly required = input(false);
  readonly disabled = input(false);
  readonly options = input<SelectOption[]>([]);

  // `any` is acceptable here to interop with Angular Signal Forms `Field` shape.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly formField = input<any | null>(null);

  protected showErrors(): boolean {
    const field = this.formField();
    if (!field || typeof field !== 'function') {
      return false;
    }

    const state = field();
    return !!state?.touched?.() && !!state?.invalid?.();
  }
}

