import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { filter, map, switchMap, take } from 'rxjs';

import { FavoritePokemon } from '../../../core/models';
import { FavoritesService } from '../../../core/services';
import { EditAliasDialogComponent } from '../../components/edit-alias-dialog/edit-alias-dialog';

@Component({
  selector: 'app-favorites-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule,
    RouterLink
  ],
  templateUrl: './favorites-page.html',
  styleUrl: './favorites-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FavoritesPageComponent {
  #favoritesService = inject(FavoritesService);
  #snackBar = inject(MatSnackBar);
  #dialog = inject(MatDialog);

  readonly favorites$ = this.#favoritesService.favorites$;
  readonly maxFavorites = FavoritesService.MAX_FAVORITES;

  onRemove(id: number): void {
    this.#favoritesService.removeFavorite(id);
    this.#openSnack('Eliminado de favoritos');
  }

  onEditAlias(favorite: FavoritePokemon): void {
    this.favorites$
      .pipe(
        take(1),
        map((favorites) => favorites.map((item) => item.alias)),
        switchMap((aliases) =>
          this.#dialog
            .open(EditAliasDialogComponent, {
              data: { favorite, existingAliases: aliases },
              width: '360px'
            })
            .afterClosed()
        ),
        filter((alias): alias is string => typeof alias === 'string' && alias.trim().length > 0),
        map((alias) => alias.trim())
      )
      .subscribe((alias) => {
        this.#favoritesService.updateAlias(favorite.id, alias);
        this.#openSnack('Alias actualizado');
      });
  }

  trackByFavoriteId(_: number, favorite: FavoritePokemon): number {
    return favorite.id;
  }

  #openSnack(message: string): void {
    this.#snackBar.open(message, 'Cerrar', { duration: 2500 });
  }
}
