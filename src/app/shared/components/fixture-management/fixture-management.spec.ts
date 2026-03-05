import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FixtureManagement } from './fixture-management';

describe('FixtureManagement', () => {
  let component: FixtureManagement;
  let fixture: ComponentFixture<FixtureManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FixtureManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FixtureManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
