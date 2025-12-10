import { take } from 'rxjs';

import { FavoritePokemon } from '../models';
import { FavoritesService } from './favorites.service';
import { SESSION_STORAGE_KEY_FAVORITES } from '../constants';

function createPokemon(id: number) {
  return { id, name: `poke-${id}`, image: `img-${id}` };
}

describe('FavoritesService', () => {
  let service: FavoritesService;
  const mockDate = new Date('2020-01-01T00:00:00.000Z');

  beforeEach(() => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY_FAVORITES);
    jasmine.clock().install();
    jasmine.clock().mockDate(mockDate);
    service = new FavoritesService();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    sessionStorage.removeItem(SESSION_STORAGE_KEY_FAVORITES);
  });

  describe('initialization', () => {
    it('should start empty when sessionStorage is empty', (done) => {
      service.favorites$.pipe(take(1)).subscribe((favorites) => {
        expect(favorites).toEqual([]);
        done();
      });
    });

    it('should load favorites from sessionStorage on init', (done) => {
      const stored: FavoritePokemon[] = [
        { ...createPokemon(1), alias: 'poke-1', createdAt: mockDate.toISOString() }
      ];
      sessionStorage.setItem(SESSION_STORAGE_KEY_FAVORITES, JSON.stringify(stored));

      service = new FavoritesService();

      service.favorites$.pipe(take(1)).subscribe((favorites) => {
        expect(favorites).toEqual(stored);
        done();
      });
    });

    it('should recover from corrupted sessionStorage and reset to []', (done) => {
      sessionStorage.setItem(SESSION_STORAGE_KEY_FAVORITES, 'not-json');

      service = new FavoritesService();

      service.favorites$.pipe(take(1)).subscribe((favorites) => {
        expect(favorites).toEqual([]);
        expect(sessionStorage.getItem(SESSION_STORAGE_KEY_FAVORITES)).toBe('[]');
        done();
      });
    });
  });

  describe('addFavorite', () => {
    it('should add a favorite and persist it (alias defaults to name)', (done) => {
      const result = service.addFavorite(createPokemon(1));
      expect(result).toEqual({ ok: true });

      service.favorites$.pipe(take(1)).subscribe((favorites) => {
        expect(favorites.length).toBe(1);
        expect(favorites[0]).toEqual({
          ...createPokemon(1),
          alias: 'poke-1',
          createdAt: mockDate.toISOString()
        });

        const stored = JSON.parse(
          sessionStorage.getItem(SESSION_STORAGE_KEY_FAVORITES) ?? 'null'
        );
        expect(stored).toEqual(favorites);
        done();
      });
    });

    it('should prevent duplicates by id', (done) => {
      expect(service.addFavorite(createPokemon(1))).toEqual({ ok: true });
      const second = service.addFavorite(createPokemon(1));
      expect(second).toEqual({ ok: false, reason: 'DUPLICATE' });

      service.favorites$.pipe(take(1)).subscribe((favorites) => {
        expect(favorites.length).toBe(1);
        done();
      });
    });

    it('should enforce max 10 favorites', (done) => {
      for (let i = 1; i <= 10; i++) {
        expect(service.addFavorite(createPokemon(i))).toEqual({ ok: true });
      }

      const eleventh = service.addFavorite(createPokemon(11));
      expect(eleventh).toEqual({ ok: false, reason: 'LIMIT' });

      service.favorites$.pipe(take(1)).subscribe((favorites) => {
        expect(favorites.length).toBe(10);
        expect(favorites.map((f) => f.id)).not.toContain(11);
        done();
      });
    });
  });

  describe('removeFavorite', () => {
    it('should remove favorite and persist', (done) => {
      service.addFavorite(createPokemon(1));
      service.addFavorite(createPokemon(2));

      service.removeFavorite(1);

      service.favorites$.pipe(take(1)).subscribe((favorites) => {
        expect(favorites.length).toBe(1);
        expect(favorites[0].id).toBe(2);

        const stored = JSON.parse(
          sessionStorage.getItem(SESSION_STORAGE_KEY_FAVORITES) ?? 'null'
        );
        expect(stored.length).toBe(1);
        expect(stored[0].id).toBe(2);
        done();
      });
    });
  });

  describe('updateAlias', () => {
    it('should update alias only for the given id and persist', (done) => {
      service.addFavorite(createPokemon(1));
      service.addFavorite(createPokemon(2));

      service.updateAlias(1, 'BulbaAlias');

      service.favorites$.pipe(take(1)).subscribe((favorites) => {
        const one = favorites.find((f) => f.id === 1);
        const two = favorites.find((f) => f.id === 2);
        expect(one?.alias).toBe('BulbaAlias');
        expect(two?.alias).toBe('poke-2');

        const stored = JSON.parse(
          sessionStorage.getItem(SESSION_STORAGE_KEY_FAVORITES) ?? 'null'
        );
        const storedOne = stored.find((f: FavoritePokemon) => f.id === 1);
        const storedTwo = stored.find((f: FavoritePokemon) => f.id === 2);
        expect(storedOne.alias).toBe('BulbaAlias');
        expect(storedTwo.alias).toBe('poke-2');
        done();
      });
    });

    it('should do nothing if id does not exist', (done) => {
      service.addFavorite(createPokemon(1));

      service.updateAlias(99, 'DoesNotExist');

      service.favorites$.pipe(take(1)).subscribe((favorites) => {
        expect(favorites.length).toBe(1);
        expect(favorites[0].alias).toBe('poke-1');
        done();
      });
    });
  });

  describe('isFavorite', () => {
    it('should emit true when pokemon is in favorites and false otherwise', (done) => {
      const values: boolean[] = [];

      service.isFavorite(1).pipe(take(1)).subscribe((value) => {
        values.push(value); // initial false
        service.addFavorite(createPokemon(1));

        service.isFavorite(1).pipe(take(1)).subscribe((valueAfterAdd) => {
          values.push(valueAfterAdd); // true
          service.removeFavorite(1);

          service.isFavorite(1).pipe(take(1)).subscribe((valueAfterRemove) => {
            values.push(valueAfterRemove); // false
            expect(values).toEqual([false, true, false]);
            done();
          });
        });
      });
    });
  });
});
