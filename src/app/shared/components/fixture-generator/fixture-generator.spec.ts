import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FixtureGenerator } from './fixture-generator';

describe('FixtureGenerator', () => {
  let component: FixtureGenerator;
  let fixture: ComponentFixture<FixtureGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FixtureGenerator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FixtureGenerator);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
