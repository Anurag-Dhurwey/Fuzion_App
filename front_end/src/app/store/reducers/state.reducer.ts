import { createReducer, on } from '@ngrx/store';
// import {
//   setCanvasConfig,
//   setExportComponentVisibility,
//   setProjects,
//   setRole,
// } from '../actions/state.action';
import { Project, Roles } from '../../../types/app.types';
export type CanvasConfig = {
  backgroungColor: string;
  width: number;
  height: number;
};
export type appState = {
  role: Roles;
  canvasConfig: CanvasConfig;
  projects: Project[];
  demo_projects: Project[];
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
  demo_projects: [],
  isExportComponentVisible: false,
};

// export const appReducer = createReducer(
//   initialstate,
//   on(setRole, (state, { role }) => ({ ...state, role })),
//   on(setCanvasConfig, (state, props) => ({
//     ...state,
//     canvasConfig: { ...state.canvasConfig, ...props },
//   })),
//   on(setProjects, (state, props) => {
//     if (props.method === 'reset' && Array.isArray(props.project)) {
//       return { ...state, projects: props.project };
//     } else if (props.method === 'push' && !Array.isArray(props.project)) {
//       return { ...state, projects: [...state.projects, props.project] };
//     } else if (props.method === 'replace') {
//       if (!Array.isArray(props.project)) {
//         props.project = [props.project];
//       }
//       state.projects = state.projects.map((pro) => {
//         const mached = (props.project as Project[]).find(
//           (item) => item.id == pro.id
//         );
//         if (mached) {
//           return mached;
//         }
//         return pro;
//       });
//       return state;
//     } else {
//       return state;
//     }
//   }),
//   on(setExportComponentVisibility, (state, { isExportComponentVisible }) => ({
//     ...state,
//     isExportComponentVisible,
//   }))
// );
