import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BehaviorSubject, catchError, combineLatest, map, of, shareReplay, startWith, switchMap } from 'rxjs';

import { PokemonListItem } from '../../../core/models';
import { FavoritesService, PokeApiService } from '../../../core/services';

type PageParams = { pageIndex: number; pageSize: number };
type PokemonListState = {
  loading: boolean;
  error: string | null;
  items: PokemonListItem[];
  total: number;
  pageIndex: number;
  pageSize: number;
};

type PokemonListViewModel = Omit<PokemonListState, 'items'> & {
  items: Array<PokemonListItem & { isFavorite: boolean }>;
};

@Component({
  selector: 'app-pokemon-list-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './pokemon-list-page.html',
  styleUrl: './pokemon-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PokemonListPageComponent {
  #pokeApiService = inject(PokeApiService);
  #favoritesService = inject(FavoritesService);
  #snackBar = inject(MatSnackBar);

  readonly pageSizeOptions = [5, 10, 20];
  readonly defaultPageSize = 10;

  #pageParams$ = new BehaviorSubject<PageParams>({
    pageIndex: 0,
    pageSize: this.defaultPageSize
  });

  #pokemonListState$ = this.#pageParams$.pipe(
    switchMap(({ pageIndex, pageSize }) =>
      this.#pokeApiService.getPokemonPage(pageSize, pageIndex * pageSize).pipe(
        map(
          ({ count, items }): PokemonListState => ({
            loading: false,
            error: null,
            items,
            total: count,
            pageIndex,
            pageSize
          })
        ),
        startWith<PokemonListState>({
          loading: true,
          error: null,
          items: [],
          total: 0,
          pageIndex,
          pageSize
        }),
        catchError(() =>
          of<PokemonListState>({
            loading: false,
            error: 'No se pudo cargar el listado de Pokémon',
            items: [],
            total: 0,
            pageIndex,
            pageSize
          })
        )
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly vm$ = combineLatest([this.#pokemonListState$, this.#favoritesService.favorites$]).pipe(
    map(
      ([state, favorites]): PokemonListViewModel => ({
        ...state,
        items: state.items.map((item) => ({
          ...item,
          isFavorite: favorites.some((favorite) => favorite.id === item.id)
        }))
      })
    )
  );

  onPageChange(event: PageEvent): void {
    const next: PageParams = { pageIndex: event.pageIndex, pageSize: event.pageSize };
    const current = this.#pageParams$.value;
    if (next.pageIndex === current.pageIndex && next.pageSize === current.pageSize) {
      return;
    }

    this.#pageParams$.next(next);
  }

  onAddToFavorites(pokemon: PokemonListItem): void {
    const result = this.#favoritesService.addFavorite(pokemon);

    if (result.ok) {
      this.#openSnack('Se agregó a tus favoritos');
      return;
    }

    if (result.reason === 'DUPLICATE') {
      this.#openSnack('Este Pokémon ya está en tus favoritos');
      return;
    }

    if (result.reason === 'LIMIT') {
      this.#openSnack('Solo puedes agregar hasta 10 favoritos');
    }
  }

  trackByPokemonId(_: number, item: PokemonListItem & { isFavorite: boolean }): number {
    return item.id;
  }

  #openSnack(message: string): void {
    this.#snackBar.open(message, 'Cerrar', { duration: 2500 });
  }
}
