import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Buildselector } from './buildselector';

describe('Buildselector', () => {
  let component: Buildselector;
  let fixture: ComponentFixture<Buildselector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Buildselector],
    }).compileComponents();

    fixture = TestBed.createComponent(Buildselector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
