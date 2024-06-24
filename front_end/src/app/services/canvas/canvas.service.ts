import { Injectable } from '@angular/core';
import { fabric } from 'fabric';
import {
  SocketService,
  object_modified_method,
} from '../socket/socket.service';
// import { Observable, Subscriber } from 'rxjs';
import {
  Fab_Group,
  Fab_Objects,
  Project,
  Roles,
  Fab_PathArray,
  Fab_Path,
  QuadraticCurveControlPoint,
  FabObjectsPropertiesOnly,
} from '../../../types/app.types';
import { v4 } from 'uuid';
import { ActiveSelection, IGroupOptions } from 'fabric/fabric-impl';
import { v4 as uuidv4 } from 'uuid';
import {
  Layout,
  PreviousCustomizationState,
  PropertiesToInclude,
  UpdateObjectsMethods,
  Visibility,
} from '../../../types/canvas.service.types';
// import { doc, updateDoc } from 'firebase/firestore';
// import { DbService } from '../db/db.service';
import { propertiesToInclude } from '../../constants';
// import { AuthService } from '../auth/auth.service';
@Injectable({
  providedIn: 'root',
})
export class CanvasService {
  // propertiesToInclude = ['_id', 'type','pathType','clipStartEndPoint'];
  private _role: Roles = 'select';
  private _objects: Fab_Objects[] = [];
  canvas: fabric.Canvas | undefined;
  projectId: string | null = null;
  version: string | undefined;
  background: string | undefined = '#282829';
  members: string[] = [];
  adminId: string | undefined;
  // objectsObserver: Subscriber<'objects' | 'role'> | undefined;
  tempRefObj: (
    | fabric.Line
    | (fabric.Circle & { _refTo: string; _refIndex: [number, number] })
  )[] = [];
  // private _viewport_status = {
  //   preview_scence: false,
  // };
  private _viewport_refs: {
    preview_scence: null | {
      pre_trans_target: { x: number; y: number };
      rect: fabric.Rect;
    };
  } = {
    preview_scence: null,
  };

  currentDrawingObject: Fab_Objects | undefined;
  editingPath: Fab_Path | null = null;
  quadraticCurveRefLine: fabric.Line | null = null;
  quadraticCurveControlPoints: QuadraticCurveControlPoint[] = [];
  // selectedObj: Fab_Objects[] = [];

  totalChanges = new Set<string>();

  recentStates: {
    event_selectable: PreviousCustomizationState[];
  } = {
    event_selectable: [],
  };

  private _zoom = 1;
  frame = { x: 1920, y: 1080 };
  layout: Layout = {
    visibility: {
      layer_panel: !this.isMobile() && window.innerWidth > 1050,
      property_panel: !this.isMobile() && window.innerWidth > 1050,
      tool_panel: true,
      setting_panel: false,
      menu_panel: false,
      export_panel: false,
      frame_selection_panel: !this.frame.x && !this.frame.x,
      import_image_panel: false,
    },
    width: {
      canvas_viewport: 66,
      layer_panel: 15,
      property_panel: 15,
    },
  };

  history: {
    undoStack: Set<string>;
    redoStack: Set<string>;
  } = {
    undoStack: new Set(),
    redoStack: new Set(),
  };

  constructor(
    private socketService: SocketService // private authService: AuthService
  ) {
    this.history.undoStack.add('[]');
  }

  // get projectId(){
  //   return this._projectId
  // }
  get zoom() {
    return this._zoom;
  }
  get role() {
    return this._role;
  }
  get objects() {
    return this._objects;
  }
  get activeObjects() {
    return this.canvas?.getActiveObject();
  }
  get viewport_refs() {
    return this._viewport_refs;
  }

  public saveStateInHistory() {
    // if (!this.canvas) return;
    this.history.redoStack.clear(); // Clear redo stack on new action
    this.export(
      'json',
      (data) => {
        if (typeof data == 'string') {
          this.history.undoStack.add(JSON.stringify(JSON.parse(data).objects));
        } else {
          this.history.undoStack.add(JSON.stringify(data.objects));
        }
      },
      false
    );
    if (this.history.undoStack.size > 50) {
      this.history.undoStack.delete(
        this.history.undoStack.values().next().value
      );
    }
  }
  public undoHistory() {
    if (this.history.undoStack.size > 1) {
      const arr = [...this.history.undoStack];
      const currentState = arr.pop()!;
      this.history.undoStack.delete(currentState);
      this.history.redoStack.add(currentState);
      this.enliveObjs(JSON.parse(arr[arr.length - 1]), (objs) => {}, 'reset');
    }
  }
  public redoHistory() {
    if (this.history.redoStack.size) {
      const arr = [...this.history.redoStack];
      const state = arr.pop()!;
      this.history.redoStack.delete(state)
      this.history.undoStack.add(state);
      this.enliveObjs(JSON.parse(state), () => {}, 'reset');
    }
  }

  emitReplaceObjsEventToSocket() {
    if (!this.projectId) return;
    this.clonedObjsFromActiveObjs((objs) => {
      if (!this.projectId) return;
      this.socketService.emit.object_modified(this.projectId, objs, 'replace');
    });
  }
  emitPushObjsEventToSocket() {
    if (!this.projectId) return;
    this.clonedObjsFromActiveObjs((objs) => {
      if (!this.projectId) return;
      this.socketService.emit.object_modified(this.projectId, objs, 'push');
    });
  }
  emitSetObjPropertyEventToSocket(
    _id: string,
    property: FabObjectsPropertiesOnly
  ) {
    if (!this.projectId) return;
    this.socketService.emit.set_object_property(this.projectId, _id, property);
    // this.clonedObjsFromActiveObjs((objs) => {
    //   if (!this.projectId) return;
    //   this.socketService.emit.object_modified(this.projectId, objs, 'replace');
    // });
  }

  grid: fabric.Line[] = [];

  // removeGrid() {
  //   this.grid.forEach((line) => {
  //     this.canvas?.remove(line);
  //   });
  //   this.grid = [];
  // }
  // addGrid() {
  //   this.removeGrid();
  //   this.generateGrid();
  //   for (const line of this.grid) {
  //     this.canvas?.add(line);
  //   }
  // }

  // generateGrid() {
  //   this.grid = [];
  //   const distance = 100;
  //   for (
  //     let index = 0;
  //     index < Math.max(this.frame.x || 1920, this.frame.y || 1080) + distance;
  //     // index < 500+ 20;
  //     index += distance
  //   ) {
  //     if (index < this.frame.x) {
  //       const lineV = new fabric.Line([index, 0, index, this.frame.y], {
  //         evented: false,
  //         selectable: false,
  //         strokeWidth: 1,
  //         stroke: 'gray',
  //         hasControls: false,
  //         hasBorders: false,
  //       });
  //       this.grid.push(lineV);
  //     }
  //     if (index < this.frame.y) {
  //       const lineH = new fabric.Line([0, index, this.frame.x, index], {
  //         evented: false,
  //         selectable: false,
  //         strokeWidth: 1,
  //         stroke: 'gray',
  //         hasControls: false,
  //         hasBorders: false,
  //       });
  //       this.grid.push(lineH);
  //     }
  //     // console.log(index)
  //   }
  // }

  absolutePoint(x: number, y: number, matrix: any[]) {
    return fabric.util.transformPoint({ x, y } as fabric.Point, matrix);
  }

  addQuadraticCurveControlPoints(path?: Fab_Path) {
    if (
      !path &&
      (this.activeObjects as Fab_Path).pathType === 'quadratic_curve'
    ) {
      path = this.activeObjects as Fab_Path;
    }

    if (!path) return;
    this.removeQuadraticCurveControlPoints();

    this.getTransformedPoints(path).forEach((point, i) => {
      if (!path) return;
      // if (i == path.path!.length - 1) {
      //   return;
      // }
      if (point[0] === 'M' || point[0] === 'L') {
        const circle = new fabric.Circle({
          left: point[1],
          top: point[2],
          radius: 10,
          fill: 'blue',
          hasControls: false,
          hasBorders: false,
          excludeFromExport: true,
        }) as QuadraticCurveControlPoint;
        circle.ctrlType = 'node';
        circle.index = i;
        circle.ctrlOf = path._id;

        this.quadraticCurveControlPoints.push(circle);
      } else if (point[0] === 'Q') {
        const circle = new fabric.Circle({
          left: point[1],
          top: point[2],
          radius: 10,
          fill: 'blue',
          hasControls: false,
          hasBorders: false,
          excludeFromExport: true,
        }) as QuadraticCurveControlPoint;
        circle.ctrlType = 'curve';
        circle.index = i;
        circle.ctrlOf = path._id;

        this.quadraticCurveControlPoints.push(circle);
        const circle2 = new fabric.Circle({
          left: point[3],
          top: point[4],
          radius: 10,
          fill: 'blue',
          hasControls: false,
          hasBorders: false,
          excludeFromExport: true,
        }) as QuadraticCurveControlPoint;
        circle2.ctrlType = 'node';
        circle2.index = i;
        circle2.ctrlOf = path._id;

        this.quadraticCurveControlPoints.push(circle2);
      }
    });
    this.quadraticCurveControlPoints.forEach((ctrl) => {
      this.canvas?.add(ctrl);
    });
    this.editingPath = path;
    path.selectable = false;
    path.evented = false;
    path.hasBorders = false;
    path.hasControls = false;
  }
  removeQuadraticCurveControlPoints() {
    this.quadraticCurveControlPoints.forEach((ctrl) => {
      this.canvas?.remove(ctrl);
    });
    this.quadraticCurveControlPoints = [];
    if (!this.editingPath) return;
    this.editingPath.selectable = true;
    this.editingPath.evented = true;
    this.editingPath.hasBorders = true;
    this.editingPath.hasControls = true;
    this.editingPath = null;
  }

  getTransformedPoints(path: Fab_Path) {
    // Get the transformation matrix of the object
    var matrix = path.calcTransformMatrix();

    // Initialize an array to hold the transformed points
    var transformedPoints: Fab_PathArray[] = [];

    (path.path as unknown as Fab_PathArray[]).forEach((command) => {
      if (['M', 'L', 'C', 'Q'].includes(command[0])) {
        // var points:number[][] = [];

        // Depending on the command, the number of points varies
        if (command[0] === 'M' || command[0] === 'L') {
          const point = this.absolutePoint(
            command[1] - path.pathOffset.x,
            command[2] - path.pathOffset.y,
            matrix
          );
          transformedPoints.push([
            command[0],
            point.x,
            point.y,
          ] as unknown as Fab_PathArray);
        } else if (command[0] === 'C') {
          // points.push([command[1], command[2]], [command[3], command[4]], [command[5], command[6]]);
        } else if (command[0] === 'Q') {
          const point_1 = this.absolutePoint(
            command[1] - path.pathOffset.x,
            command[2] - path.pathOffset.y,
            matrix
          );
          const point_2 = this.absolutePoint(
            command[3] - path.pathOffset.x,
            command[4] - path.pathOffset.y,
            matrix
          );
          transformedPoints.push([
            command[0],
            point_1.x,
            point_1.y,
            point_2.x,
            point_2.y,
          ] as unknown as Fab_PathArray);
        }
      }
    });
    return transformedPoints;
  }

  filterSelectableObjectsFromGroup(group: Fab_Group) {
    const selectable: Fab_Objects[] = [];
    for (const obj of group._objects) {
      if (obj.type != 'group') {
        selectable.push(obj);
      } else if (obj.type === 'group' && obj.isJoined) {
        selectable.push(obj);
      } else if (obj.type === 'group' && !obj.isJoined && obj._objects.length) {
        selectable.push(
          ...this.filterSelectableObjectsFromGroup(obj).reverse()
        );
      }
    }
    return selectable;
  }

  clonedObjsFromActiveObjs(cb: (objs: any[]) => void) {
    if (!this.activeObjects) {
      return;
    }
    if (this.activeObjects.type == 'activeSelection') {
      const activeSe = (this.activeObjects as ActiveSelection).toObject(
        propertiesToInclude
      );

      this.enliveObjs(activeSe.objects, (objs) => {
        this.canvas?.discardActiveObject();
        // const emitableObjs = this.objects.filter((ob) =>
        //   activeSe.objects.some((active: Fab_Objects) => active._id == ob._id)
        // );
        const emitableObjs = activeSe.objects.map((active: Fab_Objects) => {
          return this.getObjectById(active._id);
        });
        cb(emitableObjs);
        // this.updateObjects(activeSe.objects, 'delete', false);
        this.updateObjects(objs, 'replace', false);
        const se = new fabric.ActiveSelection(objs, {
          ...activeSe,
          canvas: this.canvas,
        });
        this.canvas?.setActiveObject(se);
        this.canvas?.requestRenderAll();
      });
      return;
    } else {
      cb([this.activeObjects]);
      return;
    }
  }

  preview_scence_start() {
    if (this.viewport_refs.preview_scence) return;
    if (!this.canvas?.viewportTransform) return;
    const strokeWidth = 6 / this.zoom;
    this.viewport_refs.preview_scence = {
      rect: new fabric.Rect({
        top: 0,
        left: 0,
        width: this.frame.x - strokeWidth,
        height: this.frame.y - strokeWidth,
        stroke: '#000000',
        strokeWidth,
        excludeFromExport: true,
        evented: false,
        fill: '',
        selectable: false,
      }),
      pre_trans_target: {
        x: this.canvas?.viewportTransform[4],
        y: this.canvas?.viewportTransform[5],
      },
    };
    this.canvas?.add(this.viewport_refs.preview_scence.rect);
    this.setViewPortTransform(0, 0);
  }
  preview_scence_stop() {
    if (!this.viewport_refs.preview_scence) return;
    this.canvas?.remove(this.viewport_refs.preview_scence.rect);
    this.setViewPortTransform(
      this.viewport_refs.preview_scence.pre_trans_target.x,
      this.viewport_refs.preview_scence.pre_trans_target.y
    );
    this.viewport_refs.preview_scence = null;
  }
  preview_scence_toggle() {
    if (this.viewport_refs.preview_scence) {
      this.preview_scence_stop();
    } else {
      this.preview_scence_start();
    }
  }

  resetLaoutVisibility() {
    this.layout.visibility = {
      layer_panel: !this.isMobile() && window.innerWidth > 1050,
      property_panel: !this.isMobile() && window.innerWidth > 1050,
      tool_panel: true,
      setting_panel: false,
      menu_panel: false,
      export_panel: false,
      frame_selection_panel: !this.frame.x && !this.frame.x,
      import_image_panel: false,
    };
  }

  removeEmptyGroups(objects: Fab_Objects[]) {
    return objects.flatMap((obj) => {
      if (obj.type === 'group') {
        if (obj._objects.length) {
          obj._objects = this.removeEmptyGroups(obj._objects);
          return [obj];
        } else {
          return [] as Fab_Objects[];
        }
      }
      return [obj];
    });
  }

  countChildsLength(id: string) {
    function traverse(obj: Fab_Objects): number | undefined {
      if (obj.type === 'group') {
        if (id === obj._id) {
          return obj._objects.length;
        }

        for (const subObj of obj._objects) {
          const length = traverse(subObj);
          if (Number.isInteger(length)) {
            return length;
          }
        }
      }
      return undefined;
    }

    for (const obj of this.objects) {
      const length = traverse(obj);
      if (Number.isInteger(length)) {
        return length;
      }
    }
    return undefined;
  }

  get idsOfSelectedObj() {
    function traverse(obj: Fab_Objects[]): string[] {
      return obj.flatMap((ob: Fab_Objects) => {
        if (ob.type === 'group') {
          return [ob._id, ...traverse(ob._objects)];
        } else {
          return [ob._id];
        }
      });
    }

    if (!this.activeObjects) return [];
    if (this.activeObjects.type === 'activeSelection') {
      return traverse(
        (this.activeObjects as ActiveSelection)._objects as Fab_Objects[]
      );
    } else {
      return traverse([this.activeObjects] as Fab_Objects[]);
    }
  }

  getOneDarray(obj: Fab_Objects[]) {
    function traverse(obj: Fab_Objects[]): Fab_Objects[] {
      return obj.flatMap((ob: Fab_Objects) => {
        if (ob.type === 'group') {
          return traverse(ob._objects);
        } else {
          return [ob];
        }
      });
    }

    return traverse(obj);
  }

  get oneDarrayOfObjects() {
    return this.getOneDarray(this.objects);
  }

  get oneDarrayOfSelectedObj() {
    if (!this.activeObjects) return [];
    if (this.activeObjects?.type === 'activeSelection') {
      return this.getOneDarray(
        (this.activeObjects as ActiveSelection)._objects as Fab_Objects[]
      );
    } else {
      return this.getOneDarray([this.activeObjects] as Fab_Objects[]);
    }
  }

  static extractIds(objects: Fab_Objects[]) {
    function traverse(obj: Fab_Objects[]): string[] {
      return obj.flatMap((ob: Fab_Objects) => {
        if (ob.type === 'group') {
          return [ob._id, ...traverse(ob._objects)];
        } else {
          return [ob._id];
        }
      });
    }

    return traverse(objects);
  }

  isSelected(id: string): boolean {
    if (!this.activeObjects) return false;
    function isExist(obj: Fab_Objects): boolean {
      if (obj._id === id) {
        return true;
      }
      if (obj.type === 'group') {
        for (const subObj of obj._objects) {
          const res = isExist(subObj);
          if (res) {
            return true;
          }
        }
      }
      return false;
    }

    for (const obj of this.activeObjects.type === 'activeSelection'
      ? (this.activeObjects as ActiveSelection)._objects
      : [this.activeObjects]) {
      const res = isExist(obj as Fab_Objects);
      if (res) {
        return true;
      }
    }
    return false;
  }

  seriesIndex(id: string) {
    let count = 0;
    function traverse(
      obj: Fab_Objects & { series_index?: number }
    ): number | undefined {
      if (id === obj._id) {
        return count;
      }
      count += 1;

      if (obj.type === 'group' && obj._objects) {
        for (const subObj of obj._objects) {
          const index = traverse(subObj);
          if (Number.isInteger(index)) {
            return index;
          }
        }
      }
      return undefined;
    }

    for (const obj of this.objects) {
      const index = traverse(obj);
      if (Number.isInteger(index)) {
        return index;
      }
    }
    return undefined;
  }

  enliveProject(
    project: Project,
    cb: (Project: Fab_Objects[]) => void,
    replace: boolean = false
  ): void {
    fabric.util.enlivenObjects(
      JSON.parse(project.objects || '[]'),
      (createdObjs: Fab_Objects[]) => {
        cb(createdObjs);
        if (replace) {
          this.mountProject({ ...project, objects: createdObjs });
          this.reRender();
          return;
        }
        createdObjs?.forEach((obj: Fab_Objects) => {
          this.canvas?.add(obj);
        });
        this.canvas?.renderAll();
      },
      'fabric'
    );
  }

  mountProject(project: Omit<Project, 'objects'> & { objects: Fab_Objects[] }) {
    this.totalChanges.clear();
    this._objects = project.objects;
    this.members = project.members;
    this.projectId = project.id;
    this.adminId = project.user;
    this.background = project.background;
    this.version = project.version;
    this.currentDrawingObject = undefined;
    this.frame.x = project.width;
    this.frame.y = project.height;
    this._zoom = 1;
  }

  unMountProject() {
    this.totalChanges.clear();
    this._objects = [];
    this.members = [];
    this.adminId = undefined;
    this.projectId = null;
    this.background = undefined;
    this.version = undefined;
    this.currentDrawingObject = undefined;
    this.frame.x = 1920;
    this.frame.y = 1080;
    this._zoom = 1;
    this.resetLaoutVisibility();
  }

  enliveObjs(
    objs: Fab_Objects[],
    cb: (obj: Fab_Objects[]) => void,
    method?: object_modified_method
  ): void {
    fabric.util.enlivenObjects(
      objs,
      (createdObjs: Fab_Objects[]) => {
        cb(createdObjs);
        if (!method) return;
        if (method == 'reset') {
          this.updateObjects(createdObjs, method, false);
        } else {
          createdObjs.forEach((item) => {
            this.updateObjects(item, method, false);
          });
        }
      },
      'fabric'
    );
  }

  importJsonObjects(json: string) {
    fabric.util.enlivenObjects(
      JSON.parse(json).objects,
      (objects: any) => {
        if (!objects || !objects.length) return;
        function changeId(objects: Fab_Objects[]) {
          objects.forEach((obj) => {
            obj._id = v4();
            if (obj.type === 'group') {
              obj.isMinimized = true;
              changeId(obj._objects);
            }
          });
        }
        changeId(objects);

        if (objects.length === 1 && objects[0].type === 'group') {
          this._objects = [objects[0], ...this.objects];
        } else {
          const newGroup = new fabric.Group([], {
            _id: v4(),
            top: objects[0].top,
            left: objects[0].left,
          } as IGroupOptions) as Fab_Group;
          newGroup._objects = objects;
          this._objects = [newGroup, ...this.objects];
        }
        this.reRender();
      },
      'fabric'
    );
  }

  getObjectById(id: string): Fab_Objects | undefined {
    const found = (objs: Fab_Objects[]): Fab_Objects | undefined => {
      for (const obj of objs) {
        if (obj._id == id) {
          return obj;
        }

        if (obj.type == 'group') {
          const f = found(obj._objects);
          if (f) {
            return f;
          }
        }
      }
      return;
    };

    for (const obj of this.objects) {
      if (obj._id == id) {
        return obj;
      }

      if (obj.type == 'group') {
        const f = found(obj._objects);
        if (f) {
          return f;
        }
      }
    }
    return;
  }

  deleteObject(object: Fab_Objects): boolean {
    // let insertAt = -1;

    const itirate = (objs: Fab_Objects[]): boolean => {
      for (const [index, ob] of objs.entries()) {
        if (ob._id == object._id) {
          this.canvas?.remove(objs[index]);
          objs.splice(index, 1);
          return true;
        }
        if (ob.type == 'group') {
          const res = itirate(ob._objects);
          if (res) {
            return res;
          }
        }
      }
      return false;
    };

    for (const [index, ob] of this._objects.entries()) {
      if (ob._id == object._id) {
        this.canvas?.remove(this._objects[index]);
        this._objects.splice(index, 1);
        return true;
      }

      if (ob.type == 'group') {
        const res = itirate(ob._objects);
        if (res) {
          return res;
        }
      }
    }

    return false;
  }

  replaceObject(object: Fab_Objects): number | undefined {
    // here group is ignored
    let insertAt = -1;

    const itirate = (objs: Fab_Objects[]): number | undefined => {
      for (const [index, ob] of objs.entries()) {
        if (ob.type != 'group') {
          insertAt++;
          if (ob._id == object._id) {
            this.canvas?.remove(objs[index]);
            objs[index] = object;
            this.canvas?.insertAt(objs[index], insertAt, false);
            return insertAt;
          }
        } else {
          return itirate(ob._objects);
        }
      }
      return;
    };

    for (const [index, ob] of this._objects.entries()) {
      if (ob.type != 'group') {
        insertAt++;
        if (ob._id == object._id) {
          this.canvas?.remove(this._objects[index]);
          this._objects[index] = object;
          this.canvas?.insertAt(this._objects[index], insertAt, false);
          return insertAt;
        }
      } else {
        const s_i = itirate(ob._objects);
        if (Number.isInteger(s_i)) {
          return s_i;
        }
      }
    }

    return;

    // this._objects = this._objects.map((obj) => {
    //   if(obj._id===object._id){
    //     return object;
    //   }
    //   return obj
    // });
  }

  updateObjects(
    objs: Fab_Objects | Fab_Objects[],
    method: UpdateObjectsMethods = 'push',
    emit_event: boolean = true
  ) {
    if (!Array.isArray(objs)) objs = [objs];
    objs.forEach((ob) => {
      this.totalChanges.add(ob._id);
    });
    if (method === 'reset') {
      this._objects = objs;
      this.reRender();
    } else if (method === 'push') {
      objs.forEach((obj) => {
        this._objects.unshift(obj);
        this.canvas?.add(this._objects[0]);
      });
    } else if (method === 'popAndPush') {
      this.canvas?.remove(this._objects[0]);
      this._objects[0] = objs[0];
      this.canvas?.add(this._objects[0]);
    } else if (method === 'replace') {
      objs.forEach((item) => {
        // const i = this.objects.findIndex((obj) => obj._id == item._id);
        const insertAt = this.replaceObject(item);
        if (!Number.isInteger(insertAt)) {
          this._objects.unshift(item);
          this.canvas?.add(this._objects[0]);
        }
        if (item.type === 'path') {
          this.reRender();
        }
      });
    } else if (method === 'delete') {
      objs.forEach((obj) => {
        this.deleteObject(obj);
      });
      this.reRender();
      this.saveStateInHistory();
    }
    this.canvas?.requestRenderAll();

    this.projectId &&
      emit_event &&
      this.socketService.emit.object_modified(this.projectId, objs, method);
  }

  removeElements = (array: Fab_Objects[], ids: string[]) => {
    ids.forEach((Id) => {
      const index = array.findIndex((element) => element._id === Id);
      if (index !== -1) {
        array.splice(index, 1);
      }
    });

    for (const element of array) {
      if (element.type === 'group' && element._objects) {
        this.removeElements(element._objects, ids);
      }
    }
  };

  renderObjectsOnCanvas(
    canvas: fabric.Canvas | fabric.StaticCanvas,
    objects: Fab_Objects[],
    options?: { backgroungColor?: string }
  ) {
    canvas.clear();
    if (options?.backgroungColor) {
      canvas.setBackgroundColor(options.backgroungColor, () => {});
    }
    const draw = (objects: Fab_Objects[]) => {
      objects.forEach((obj) => {
        if (obj.type === 'group') {
          draw([...obj._objects].reverse() as Fab_Objects[]);
        } else {
          canvas.add(obj);
        }
      });
    };
    draw([...objects].reverse());
  }

  reRender() {
    if (!this.canvas) return;
    this.renderObjectsOnCanvas(this.canvas, this.objects, {
      backgroungColor: '#282829',
    });
    this.tempRefObj?.forEach((ref) => {
      this.canvas?.add(ref);
    });
  }
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }
  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
  toggleLayoutVisibility(
    panel: (
      | 'layer_panel'
      | 'property_panel'
      | 'tool_panel'
      | 'setting_panel'
      | 'menu_panel'
      | 'export_panel'
      | 'import_image_panel'
    )[],
    status?: boolean
  ) {
    panel.forEach((str) => {
      this.layout.visibility[str] =
        status == undefined ? !this.layout.visibility[str] : status;
    });
    if (panel.includes('layer_panel') || panel.includes('property_panel')) {
      if (this.isMobile() || window.innerWidth < 1000) {
        if (panel.includes('layer_panel'))
          this.layout.visibility.property_panel = false;
        if (panel.includes('property_panel'))
          this.layout.visibility.layer_panel = false;
      }
    }
  }

  // exitTextEditing() {
  //   if (
  //     !this.currentDrawingObject ||
  //     this.currentDrawingObject.type != 'i-text'
  //   ) {
  //     return;
  //   }

  //   if (this.currentDrawingObject.text?.length) {
  //     this.currentDrawingObject.exitEditing();
  //     this.updateObjects([this.currentDrawingObject], 'replace');
  //   } else {
  //     this.currentDrawingObject.exitEditing();
  //     this.updateObjects([this.currentDrawingObject], 'delete');
  //   }
  // }

  setRole(role: Roles) {
    if (!this.canvas) return;
    this.preview_scence_stop();
    if (this.editingPath) {
      this.removeQuadraticCurveControlPoints();
    }
    this._role = role;
    if (this.currentDrawingObject?.type === 'path') {
      this.loadSVGFromString(
        this.currentDrawingObject,
        {
          _id: this.currentDrawingObject._id,
          pathType: this.currentDrawingObject.pathType,
          name: this.currentDrawingObject.name || 'path',
        },
        'popAndPush'
      );
    } else if (this.currentDrawingObject?.type == 'i-text') {
      this.currentDrawingObject.exitEditing();
    }
    this.currentDrawingObject = undefined;
    // this.reRender();
    if (role === 'pencil') {
      this.canvas.isDrawingMode = true;
    } else {
      this.canvas.isDrawingMode = false;
    }
    if (role === 'select') {
      this.objectCustomization('restore');
      this.canvas.selection = true;
      this.recentStates.event_selectable = [];
    } else {
      this.canvas.selection = false;
      const state = this.objectCustomization('set', false);
      if (!this.recentStates.event_selectable.length) {
        this.recentStates.event_selectable = state;
      }
    }
    this.tempRefObj = [];
    if (role != 'pan') {
      this.canvas!.defaultCursor = 'default';
      this.canvas!.setCursor('default');
      this.canvas!.skipTargetFind = false;
    } else {
      this.canvas!.defaultCursor = 'grab';
      this.canvas!.setCursor('grab');
      this.canvas!.skipTargetFind = true;
    }
  }
  setZoom(val: number) {
    this._zoom = val;
    this.canvas?.setWidth(this.frame.x * this.zoom);
    this.canvas?.setHeight(this.frame.y * this.zoom);

    this.canvas?.setZoom(this.zoom);
    this.canvas?.forEachObject((obj) => {
      obj.setCoords();
    });
    this.canvas?.requestRenderAll();
  }
  setViewPortTransform(x: number, y: number) {
    if (!this.canvas?.viewportTransform) return;
    this.canvas!.viewportTransform[4] = x;
    this.canvas!.viewportTransform[5] = y;
    this.canvas?.forEachObject((obj) => {
      obj.setCoords();
    });
    this.canvas!.requestRenderAll();
  }

  transformViewPort(x: number, y: number) {
    if (!this.canvas?.viewportTransform) return;
    this.setViewPortTransform(
      this.canvas!.viewportTransform[4] + x,
      this.canvas!.viewportTransform[5] + y
    );
  }

  objectCustomization(method: 'restore' | 'set', arg?: boolean) {
    const pre_state: PreviousCustomizationState[] = [];
    this.canvas?.getObjects().forEach((objs) => {
      // Prevent customization:
      if (method === 'set') {
        pre_state.push({
          _id: (objs as Fab_Objects)._id,
          selectable: !!objs.selectable,
          evented: !!objs.evented,
        });
        objs.selectable = !!arg;
        objs.evented = !!arg;
      } else if (method === 'restore') {
        const recent = this.recentStates.event_selectable.find(
          (re) => re._id === (objs as Fab_Objects)._id
        );
        if (recent != undefined) {
          objs.selectable = recent.selectable;
          objs.evented = recent.evented;
        }
      }
    });
    this.canvas?.renderAll();
    return pre_state;
  }

  existingColorsPreset(objs: Fab_Objects[]): Set<string> {
    const colorPreset = new Set<string>();
    for (const obj of objs) {
      if (obj.type === 'group') {
        const coPreset = this.existingColorsPreset(obj._objects);
        coPreset.forEach((co) => colorPreset.add(co));
      } else {
        obj.stroke?.toString().length && colorPreset.add(obj.stroke);
        obj.backgroundColor?.toString().length &&
          colorPreset.add(obj.backgroundColor);
        if (obj.fill?.toString().length) {
          if (typeof obj.fill == 'string') {
            colorPreset.add(obj.fill);
          } else if (obj.fill instanceof fabric.Gradient) {
            (obj.fill as fabric.Gradient).colorStops?.forEach((color) => {
              colorPreset.add(color.color);
            });
          }
        }
      }
    }
    return colorPreset;
  }

  loadSVGFromString(
    data: Fab_Objects,
    propertiesToInclude: PropertiesToInclude,
    method: UpdateObjectsMethods
  ) {
    fabric.loadSVGFromString(data.toSVG(), (str) => {
      const newPath = str[0] as Fab_Objects;
      for (const key in propertiesToInclude) {
        newPath[key as keyof Fab_Objects] =
          propertiesToInclude[key as keyof PropertiesToInclude];
      }
      // newPath._id = uuidv4();

      this.updateObjects(newPath, method);
      this.currentDrawingObject = undefined;
    });
  }

  export(
    format: 'png' | 'jpeg' | 'json',
    cb: (
      data:
        | string
        | {
            version: string;
            objects: fabric.Object[];
          }
    ) => void,
    discardSelection: boolean = true
  ) {
    discardSelection && this.canvas?.discardActiveObject();
    const canvas = document.createElement('canvas');
    canvas.id = 'exportable_canvas';
    canvas.width = this.frame.x;
    canvas.height = this.frame.y;
    const exportable_canvas = new fabric.StaticCanvas(canvas, {
      selection: false,
      perPixelTargetFind: false,
    });
    const bojs = this.objects.map((ob) => ob.toObject(propertiesToInclude));
    fabric.util.enlivenObjects(
      bojs,
      (res: Fab_Objects[]) => {
        this.renderObjectsOnCanvas(exportable_canvas, res);
        exportable_canvas.renderAll();
        if (format == 'jpeg' || format == 'png') {
          cb(exportable_canvas.toDataURL({ format }));
        } else if (format == 'json') {
          cb(exportable_canvas.toJSON(propertiesToInclude));
        } else {
          cb('unrecognized formate');
        }
      },
      'fabric'
    );
  }

  downloadSrc(
    src: string,
    name: string = 'myDrawing' + '_' + Date.now().toString()
  ) {
    const link = document.createElement('a');
    link.href = src;
    link.download = name;
    link.click();
    this.totalChanges.clear();
  }

  exportAsJSON(name?: string) {
    this.export('json', (res) => {
      const blob = new Blob([JSON.stringify(res)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      this.downloadSrc(url, name);
      URL.revokeObjectURL(url);
    });
  }
}
