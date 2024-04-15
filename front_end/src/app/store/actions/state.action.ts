import { createAction, props } from '@ngrx/store';
import { Projects, Roles } from '../../../types/app.types';



export const setRole = createAction(
  '[Action Component] setRole',
  props<{ role: Roles }>()
);

export type setCanvasConfigProp ={ backgroungColor?: string; width?: number; height?: number }
export const setCanvasConfig = createAction(
  '[Action Component] setCanvasConfig',
  props<setCanvasConfigProp>()
);


export type setProjectsProps={project:Projects[]|Projects,method:'reset'|'push'|'replace'}
export const setProjects = createAction(
  '[Action Component] setProjects',
  props<setProjectsProps>()
);


export const setExportComponentVisibility = createAction(
  '[Action Component] setExportComponentVisibility',
  props<{isExportComponentVisible:boolean}>()
);
