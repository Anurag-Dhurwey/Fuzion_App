import { createReducer, on } from '@ngrx/store';
import {
  setCanvasConfig,
  setExportComponentVisibility,
  setProjects,
  setRole,
} from '../actions/state.action';
import { Projects, Roles } from '../../../types/app.types';
export type CanvasConfig = {
  backgroungColor: string;
  width: number;
  height: number;
};
export type appState = {
  role: Roles;
  canvasConfig: CanvasConfig;
  projects: Projects[];
  isExportComponentVisible: boolean;
};

const initialstate: appState = {
  role: 'select',
  canvasConfig: {
    backgroungColor: '#282829',
    width: window.innerWidth,
    height: window.innerHeight,
  },
  projects: [],
  isExportComponentVisible: false,
};

export const appReducer = createReducer(
  initialstate,
  on(setRole, (state, { role }) => ({ ...state, role })),
  on(setCanvasConfig, (state, props) => ({
    ...state,
    canvasConfig: { ...state.canvasConfig, ...props },
  })),
  on(setProjects, (state, props) => {
    if (props.method === 'reset' && Array.isArray(props.project)) {
      return { ...state, projects: props.project };
    } else if (props.method === 'push' && !Array.isArray(props.project)) {
      return { ...state, projects: [...state.projects, props.project] };
    } else {
      return state;
    }
  }),
  on(setExportComponentVisibility, (state, { isExportComponentVisible }) => ({
    ...state,
    isExportComponentVisible,
  }))
);
