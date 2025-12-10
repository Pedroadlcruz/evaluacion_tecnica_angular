import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { FavoritePokemon } from '../../../core/models';

export type EditAliasDialogData = {
  favorite: FavoritePokemon;
  existingAliases: string[];
};

const aliasPattern = /^(?=.*[A-Za-zÁÉÍÓÚáéíóúÑñ0-9])[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 ]+$/;

function createAliasUniqueValidator(currentAlias: string, existingAliases: string[]): ValidatorFn {
  const normalize = (value: string) => value.trim().toLowerCase();
  const normalizedCurrent = normalize(currentAlias);
  const normalizedExisting = existingAliases
    .map(normalize)
    .filter((alias) => alias && alias !== normalizedCurrent);

  return (control) => {
    const value = control.value ?? '';
    const normalizedValue = normalize(value);

    if (!normalizedValue) {
      return null;
    }

    if (normalizedValue === normalizedCurrent) {
      return null;
    }

    if (normalizedExisting.includes(normalizedValue)) {
      return { nonUnique: true };
    }

    return null;
  };
}

@Component({
  selector: 'app-edit-alias-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './edit-alias-dialog.html',
  styleUrl: './edit-alias-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditAliasDialogComponent {
  #dialogRef = inject(MatDialogRef<EditAliasDialogComponent, string | null>);
  #data = inject<EditAliasDialogData>(MAT_DIALOG_DATA);

  readonly aliasControl = new FormControl<string>(this.#data.favorite.alias, {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.minLength(3),
      Validators.pattern(aliasPattern),
      createAliasUniqueValidator(this.#data.favorite.alias, this.#data.existingAliases)
    ]
  });

  readonly form = new FormGroup({
    alias: this.aliasControl
  });

  onCancel(): void {
    this.#dialogRef.close(null);
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.#dialogRef.close(this.aliasControl.value.trim());
  }
}
