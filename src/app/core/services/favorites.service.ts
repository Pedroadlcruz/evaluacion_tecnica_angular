import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';

import { FavoritePokemon } from '../models';
import { SESSION_STORAGE_KEY_FAVORITES } from '../constants';

type AddFavoriteResult = { ok: true } | { ok: false; reason: 'LIMIT' | 'DUPLICATE' };

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  static readonly MAX_FAVORITES = 10;

  #favoritesSubject = new BehaviorSubject<FavoritePokemon[]>(this.#readFromStorage());
  readonly favorites$ = this.#favoritesSubject.asObservable();

  getFavorites(): Observable<FavoritePokemon[]> {
    return this.favorites$;
  }

  addFavorite(pokemon: { id: number; name: string; image: string }): AddFavoriteResult {
    const current = this.#favoritesSubject.value;

    if (current.some((item) => item.id === pokemon.id)) {
      return { ok: false, reason: 'DUPLICATE' };
    }

    if (current.length >= FavoritesService.MAX_FAVORITES) {
      return { ok: false, reason: 'LIMIT' };
    }

    const nextFavorites: FavoritePokemon[] = [
      {
        id: pokemon.id,
        name: pokemon.name,
        alias: pokemon.name,
        image: pokemon.image,
        createdAt: new Date().toISOString()
      },
      ...current
    ];

    this.#setState(nextFavorites);
    return { ok: true };
  }

  removeFavorite(id: number): void {
    const filtered = this.#favoritesSubject.value.filter((item) => item.id !== id);
    this.#setState(filtered);
  }

  updateAlias(id: number, newAlias: string): void {
    const current = this.#favoritesSubject.value;
    let updated = false;

    const updatedFavorites = current.map((item) => {
      if (item.id !== id) {
        return item;
      }
      updated = true;
      return { ...item, alias: newAlias };
    });

    if (updated) {
      this.#setState(updatedFavorites);
    }
  }

  isFavorite(id: number): Observable<boolean> {
    return this.favorites$.pipe(map((favorites) => favorites.some((item) => item.id === id)));
  }

  #setState(value: FavoritePokemon[]): void {
    this.#favoritesSubject.next(value);
    this.#writeToStorage(value);
  }

  #readFromStorage(): FavoritePokemon[] {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY_FAVORITES);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        this.#writeToStorage([]);
        return [];
      }

      return parsed as FavoritePokemon[];
    } catch {
      this.#writeToStorage([]);
      return [];
    }
  }

  #writeToStorage(value: FavoritePokemon[]): void {
    sessionStorage.setItem(SESSION_STORAGE_KEY_FAVORITES, JSON.stringify(value));
  }
}
