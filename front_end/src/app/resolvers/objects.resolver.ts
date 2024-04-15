import { ResolveFn } from '@angular/router';

export const objectsResolver: ResolveFn<boolean> = (route, state) => {
  return true;
};
