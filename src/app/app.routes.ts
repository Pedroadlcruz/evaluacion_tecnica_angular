import { Routes } from '@angular/router';
import { FavoritesPageComponent } from './favorites/pages/favorites-page/favorites-page';
import { PokemonListPageComponent } from './pokemon/pages/pokemon-list-page/pokemon-list-page';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'pokemon'
  },
  {
    path: 'pokemon',
    component: PokemonListPageComponent
  },
  {
    path: 'favoritos',
    component: FavoritesPageComponent
  }
];
