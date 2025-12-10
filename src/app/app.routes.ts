import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'pokemon' },
  {
    path: 'pokemon',
    loadComponent: () =>
      import('./pokemon/pages/pokemon-list-page/pokemon-list-page').then(
        (m) => m.PokemonListPageComponent
      ),
  },
  {
    path: 'favoritos',
    loadComponent: () =>
      import('./favorites/pages/favorites-page/favorites-page').then(
        (m) => m.FavoritesPageComponent
      ),
  },
  { path: '**', redirectTo: 'pokemon' },
];
