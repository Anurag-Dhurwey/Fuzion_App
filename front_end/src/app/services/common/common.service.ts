import { Injectable } from '@angular/core';
import {
  Dashboard_page,
  ProjectType,
} from '../../../types/common.service.types';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  dashboard_page: Dashboard_page = {
    projectType: 'my',
  };
  constructor() {}

  setProjectType(type: ProjectType) {
    this.dashboard_page.projectType = type;
  }
}
