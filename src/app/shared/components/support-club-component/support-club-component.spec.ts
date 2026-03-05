import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupportClubComponent } from './support-club-component';

describe('SupportClubComponent', () => {
  let component: SupportClubComponent;
  let fixture: ComponentFixture<SupportClubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupportClubComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupportClubComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
