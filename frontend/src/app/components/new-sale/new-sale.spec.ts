import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { NewSaleComponent } from './new-sale';

describe('NewSaleComponent', () => {
  let component: NewSaleComponent;
  let fixture: ComponentFixture<NewSaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewSaleComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(NewSaleComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
