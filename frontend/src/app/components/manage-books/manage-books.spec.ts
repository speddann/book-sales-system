import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ManageBooksComponent } from './manage-books';

describe('ManageBooksComponent', () => {
  let component: ManageBooksComponent;
  let fixture: ComponentFixture<ManageBooksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageBooksComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(ManageBooksComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
