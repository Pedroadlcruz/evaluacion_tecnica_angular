import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { FavoritePokemon } from '../../../core/models';
import { FavoritesService, PokeApiService } from '../../../core/services';
import { PokemonListPageComponent } from './pokemon-list-page';

class PokeApiServiceStub {
  getPokemonPage() {
    return of({ count: 1, items: [{ id: 1, name: 'bulbasaur', image: 'img' }] });
  }
}

class FavoritesServiceStub {
  #favorites$ = new BehaviorSubject<FavoritePokemon[]>([]);
  readonly favorites$ = this.#favorites$.asObservable();

  addFavorite() {
    return { ok: true as const };
  }
}

describe('PokemonListPageComponent', () => {
  let component: PokemonListPageComponent;
  let fixture: ComponentFixture<PokemonListPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokemonListPageComponent, NoopAnimationsModule],
      providers: [
        { provide: PokeApiService, useClass: PokeApiServiceStub },
        { provide: FavoritesService, useClass: FavoritesServiceStub },
        { provide: MatSnackBar, useValue: jasmine.createSpyObj('MatSnackBar', ['open']) }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
