import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { objectsResolver } from './objects.resolver';

describe('objectsResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => objectsResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
