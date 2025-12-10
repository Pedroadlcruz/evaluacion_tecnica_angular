import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  shareReplay,
  startWith,
  switchMap
} from 'rxjs';

import { PokemonListItem } from '../../../core/models';
import { FavoritesService, PokeApiService } from '../../../core/services';
import { PokemonDetailDialogComponent } from '../../components/pokemon-detail-dialog/pokemon-detail-dialog';

type PageParams = { pageIndex: number; pageSize: number };
type ListSourceState =
  | {
      mode: 'paged';
      loading: boolean;
      error: string | null;
      items: PokemonListItem[];
      total: number;
      pageIndex: number;
      pageSize: number;
    }
  | {
      mode: 'search';
      loading: boolean;
      error: string | null;
      searchError: string | null;
      items: PokemonListItem[];
      total: number;
      pageIndex: number;
      pageSize: number;
    };

type PokemonListViewModel = Omit<ListSourceState, 'items'> & {
  items: Array<PokemonListItem & { isFavorite: boolean }>;
  searchQuery: string;
};

@Component({
  selector: 'app-pokemon-list-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule,
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
  #dialog = inject(MatDialog);

  readonly pageSizeOptions = [5, 10, 20];
  readonly defaultPageSize = 10;

  #pageParams$ = new BehaviorSubject<PageParams>({
    pageIndex: 0,
    pageSize: this.defaultPageSize
  });

  readonly searchControl = new FormControl<string>('');

  #search$ = this.searchControl.valueChanges.pipe(
    startWith(''),
    map((value) => (value ?? '').trim().toLowerCase()),
    debounceTime(300),
    distinctUntilChanged()
  );

  #pagedState$ = this.#pageParams$.pipe(
    switchMap(({ pageIndex, pageSize }) =>
      this.#pokeApiService.getPokemonPage(pageSize, pageIndex * pageSize).pipe(
        map(
          ({ count, items }): ListSourceState => ({
            mode: 'paged',
            loading: false,
            error: null,
            items,
            total: count,
            pageIndex,
            pageSize
          })
        ),
        startWith<ListSourceState>({
          mode: 'paged',
          loading: true,
          error: null,
          items: [],
          total: 0,
          pageIndex,
          pageSize
        }),
        catchError(() =>
          of<ListSourceState>({
            mode: 'paged',
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

  #listSource$ = combineLatest([this.#search$, this.#pagedState$]).pipe(
    switchMap(([query, pagedState]) => {
      if (!query) {
        return of<ListSourceState>(pagedState);
      }

      return this.#pokeApiService.getPokemonDetail(query).pipe(
        map((detail): ListSourceState => ({
          mode: 'search',
          loading: false,
          error: null,
          searchError: null,
          items: [
            {
              id: detail.id,
              name: detail.name,
              image: detail.sprites?.front_default ?? ''
            }
          ],
          total: 1,
          pageIndex: 0,
          pageSize: pagedState.pageSize
        })),
        startWith<ListSourceState>({
          mode: 'search',
          loading: true,
          error: null,
          searchError: null,
          items: [],
          total: 0,
          pageIndex: pagedState.pageIndex,
          pageSize: pagedState.pageSize
        }),
        catchError(() =>
          of<ListSourceState>({
            mode: 'search',
            loading: false,
            error: null,
            searchError: 'No se encontró el Pokémon',
            items: [],
            total: 0,
            pageIndex: pagedState.pageIndex,
            pageSize: pagedState.pageSize
          })
        )
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly vm$ = combineLatest([this.#listSource$, this.#favoritesService.favorites$, this.#search$]).pipe(
    map(
      ([state, favorites, searchQuery]): PokemonListViewModel => ({
        ...state,
        searchQuery,
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

  onOpenDetails(pokemon: PokemonListItem): void {
    this.#dialog.open(PokemonDetailDialogComponent, {
      data: { id: pokemon.id, name: pokemon.name, image: pokemon.image },
      width: '640px',
      maxWidth: '90vw'
    });
  }

  #openSnack(message: string): void {
    this.#snackBar.open(message, 'Cerrar', { duration: 2500 });
  }
}
