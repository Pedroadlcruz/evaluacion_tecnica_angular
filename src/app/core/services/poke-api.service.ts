import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { PokemonApiListItem, PokemonListItem, PokemonListResponse } from '../models';
import { POKEAPI_BASE_URL, POKEMON_SPRITE_BASE_URL } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class PokeApiService {
  #http = inject(HttpClient);

  getPokemonPage(limit: number, offset: number): Observable<{ count: number; items: PokemonListItem[] }> {
    return this.#http
      .get<PokemonListResponse>(`${POKEAPI_BASE_URL}/pokemon`, {
        params: {
          limit: limit.toString(),
          offset: offset.toString()
        }
      })
      .pipe(
        map((response) => ({
          count: response.count,
          items: response.results.map((item) => this.#mapToListItem(item))
        }))
      );
  }

  getPokemonDetail(nameOrId: string | number): Observable<any> {
    return this.#http.get<any>(`${POKEAPI_BASE_URL}/pokemon/${nameOrId}`);
  }

  #mapToListItem(item: PokemonApiListItem): PokemonListItem {
    const id = this.#extractIdFromUrl(item.url);
    return {
      id,
      name: item.name,
      image: this.#buildPokemonImageUrl(id)
    };
  }

  #extractIdFromUrl(url: string): number {
    const match = url.match(/\/pokemon\/(\d+)\/?$/);
    if (!match) {
      throw new Error(`No se pudo extraer el id del Pokémon desde la URL: ${url}`);
    }

    const id = Number(match[1]);
    if (Number.isNaN(id)) {
      throw new Error(`El id extraído no es un número válido: ${match[1]}`);
    }

    return id;
  }

  #buildPokemonImageUrl(id: number): string {
    return `${POKEMON_SPRITE_BASE_URL}/${id}.png`;
  }
}
