import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';

import { FavoritePokemon } from '../../../core/models';
import { FavoritesService } from '../../../core/services';

@Component({
  selector: 'app-favorites-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatSnackBarModule, RouterLink],
  templateUrl: './favorites-page.html',
  styleUrl: './favorites-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FavoritesPageComponent {
  #favoritesService = inject(FavoritesService);
  #snackBar = inject(MatSnackBar);

  readonly favorites$ = this.#favoritesService.favorites$;
  readonly maxFavorites = FavoritesService.MAX_FAVORITES;

  onRemove(id: number): void {
    this.#favoritesService.removeFavorite(id);
    this.#openSnack('Eliminado de favoritos');
  }

  trackByFavoriteId(_: number, favorite: FavoritePokemon): number {
    return favorite.id;
  }

  #openSnack(message: string): void {
    this.#snackBar.open(message, 'Cerrar', { duration: 2500 });
  }
}
