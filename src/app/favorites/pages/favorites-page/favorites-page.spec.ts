import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { FavoritePokemon } from '../../../core/models';
import { FavoritesService } from '../../../core/services';
import { FavoritesPageComponent } from './favorites-page';

class FavoritesServiceStub {
  #favorites$ = new BehaviorSubject<FavoritePokemon[]>([]);
  readonly favorites$ = this.#favorites$.asObservable();

  removeFavorite(id: number): void {
    this.#favorites$.next(this.#favorites$.value.filter((item) => item.id !== id));
  }
}

describe('FavoritesPageComponent', () => {
  let component: FavoritesPageComponent;
  let fixture: ComponentFixture<FavoritesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FavoritesPageComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [
        { provide: FavoritesService, useClass: FavoritesServiceStub },
        { provide: MatSnackBar, useValue: jasmine.createSpyObj('MatSnackBar', ['open']) }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FavoritesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
