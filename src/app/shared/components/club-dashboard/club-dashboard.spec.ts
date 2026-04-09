import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClubDashboard } from './club-dashboard';

describe('ClubDashboard', () => {
  let component: ClubDashboard;
  let fixture: ComponentFixture<ClubDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClubDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClubDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
