import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { map, catchError, of, startWith, shareReplay } from 'rxjs';

import { PokeApiService } from '../../../core/services';

export type PokemonDetailDialogData = {
  id: number;
  name: string;
  image?: string;
};

type PokemonStat = { name: string; value: number };

type PokemonDetailView = {
  id: number;
  name: string;
  height: number;
  weight: number;
  baseExperience: number;
  order: number;
  species: string;
  types: string[];
  abilities: string[];
  stats: PokemonStat[];
  movesCount: number;
  formsCount: number;
  heldItemsCount: number;
  image?: string;
};

type PokemonDetailVm = {
  loading: boolean;
  error: string | null;
  detail: PokemonDetailView | null;
};

@Component({
  selector: 'app-pokemon-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './pokemon-detail-dialog.html',
  styleUrl: './pokemon-detail-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PokemonDetailDialogComponent {
  #pokeApiService = inject(PokeApiService);
  #dialogRef = inject(MatDialogRef<PokemonDetailDialogComponent>);
  readonly data = inject<PokemonDetailDialogData>(MAT_DIALOG_DATA);

  readonly vm$ = this.#pokeApiService.getPokemonDetail(this.data.id || this.data.name).pipe(
    map((detail): PokemonDetailVm => ({ loading: false, error: null, detail: this.#mapDetail(detail) })),
    catchError(() =>
      of<PokemonDetailVm>({ loading: false, error: 'No se pudo cargar el detalle.', detail: null })
    ),
    startWith<PokemonDetailVm>({ loading: true, error: null, detail: null }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  onClose(): void {
    this.#dialogRef.close();
  }

  #mapDetail(detail: any): PokemonDetailView {
    const stats: PokemonStat[] =
      detail?.stats
        ?.map((stat: any) => ({
          name: stat?.stat?.name ?? 'stat',
          value: stat?.base_stat ?? 0
        }))
        .filter((stat: PokemonStat) => !!stat.name) ?? [];

    const types: string[] =
      detail?.types?.map((t: any) => t?.type?.name ?? '').filter((type: string) => !!type) ?? [];
    const abilities: string[] =
      detail?.abilities
        ?.map((a: any) => a?.ability?.name ?? '')
        .filter((ability: string) => !!ability) ?? [];

    return {
      id: detail?.id ?? this.data.id,
      name: detail?.name ?? this.data.name,
      height: detail?.height ?? 0,
      weight: detail?.weight ?? 0,
      baseExperience: detail?.base_experience ?? 0,
      order: detail?.order ?? 0,
      species: detail?.species?.name ?? '',
      types,
      abilities,
      stats,
      movesCount: detail?.moves?.length ?? 0,
      formsCount: detail?.forms?.length ?? 0,
      heldItemsCount: detail?.held_items?.length ?? 0,
      image: this.data.image
    };
  }
}
