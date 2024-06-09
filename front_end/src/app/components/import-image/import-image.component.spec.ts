import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportImageComponent } from './import-image.component';

describe('ImportImageComponent', () => {
  let component: ImportImageComponent;
  let fixture: ComponentFixture<ImportImageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportImageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImportImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
