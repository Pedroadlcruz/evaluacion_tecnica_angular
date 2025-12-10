import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { PokeApiService } from '../../../core/services';
import { PokemonDetailDialogComponent } from './pokemon-detail-dialog';

class PokeApiServiceStub {
  getPokemonDetail() {
    return of({
      id: 1,
      name: 'bulbasaur',
      height: 7,
      weight: 69,
      base_experience: 64,
      order: 1,
      species: { name: 'bulbasaur' },
      types: [{ type: { name: 'grass' } }],
      abilities: [{ ability: { name: 'overgrow' } }],
      stats: [{ base_stat: 45, stat: { name: 'hp' } }],
      moves: [{}, {}],
      forms: [{}],
      held_items: []
    });
  }
}

describe('PokemonDetailDialogComponent', () => {
  let fixture: ComponentFixture<PokemonDetailDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonDetailDialogComponent],
      providers: [
        { provide: PokeApiService, useClass: PokeApiServiceStub },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { id: 1, name: 'bulbasaur', image: 'image.png' }
        },
        { provide: MatDialogRef, useValue: { close: vi.fn() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonDetailDialogComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should handle errors gracefully', () => {
    const pokeApi = TestBed.inject(PokeApiService) as unknown as { getPokemonDetail: () => any };
    vi.spyOn(pokeApi, 'getPokemonDetail').mockReturnValue(throwError(() => new Error('fail')));

    const errorFixture = TestBed.createComponent(PokemonDetailDialogComponent);
    errorFixture.detectChanges();

    errorFixture.componentInstance.vm$.subscribe((vm) => {
      if (!vm.loading) {
        expect(vm.error).toBeTruthy();
      }
    });
  });
});
