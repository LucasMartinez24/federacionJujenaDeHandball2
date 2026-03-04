import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TorneosForm } from './torneos-form';

describe('TorneosForm', () => {
  let component: TorneosForm;
  let fixture: ComponentFixture<TorneosForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TorneosForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TorneosForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
