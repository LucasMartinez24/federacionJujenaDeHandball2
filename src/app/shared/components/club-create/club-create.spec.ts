import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClubCreate } from './club-create';

describe('ClubCreate', () => {
  let component: ClubCreate;
  let fixture: ComponentFixture<ClubCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClubCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClubCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
