import { createSelector } from '@ngrx/store';
import {  rootState } from '../store.types';

export const appSelector = createSelector(
  (state: rootState) => state.app,
  (action) => action
);
