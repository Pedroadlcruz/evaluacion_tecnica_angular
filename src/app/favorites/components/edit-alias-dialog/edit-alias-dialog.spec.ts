import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { vi } from 'vitest';

import { EditAliasDialogComponent } from './edit-alias-dialog';

const dialogData = {
  favorite: { id: 25, name: 'pikachu', alias: 'Pika', image: 'img', createdAt: '' },
  existingAliases: ['Pika', 'Misty']
};

describe('EditAliasDialogComponent', () => {
  let component: EditAliasDialogComponent;
  let fixture: ComponentFixture<EditAliasDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditAliasDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: { close: vi.fn() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditAliasDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should mark alias as non unique when duplicated', () => {
    component.aliasControl.setValue('Misty');
    component.aliasControl.updateValueAndValidity();
    expect(component.aliasControl.hasError('nonUnique')).toBeTruthy();
  });

  it('should allow keeping current alias', () => {
    component.aliasControl.setValue('Pika');
    component.aliasControl.updateValueAndValidity();
    expect(component.aliasControl.hasError('nonUnique')).toBeFalsy();
  });
});
