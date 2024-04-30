import { Injectable } from '@angular/core';
import { fabric } from 'fabric';
import { SocketService } from '../socket/socket.service';
// import { Observable, Subscriber } from 'rxjs';
import { Group, Object, Project, Roles } from '../../../types/app.types';
import { v4 } from 'uuid';
import { IGroupOptions } from 'fabric/fabric-impl';
import { v4 as uuidv4 } from 'uuid';
// import { AuthService } from '../auth/auth.service';
@Injectable({
  providedIn: 'root',
})
export class CanvasService {
  private _role: Roles = 'select';
  private _objects: Object[] = [];
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

  currentDrawingObject: Object | undefined;

  selectedObj: Object[] = [];
  zoom = 1;
  frame = { x: 400, y: 600 };
  layout = {
    visibility: {
      layer_panel: !this.isMobile(),
      property_panel: !this.isMobile(),
      tool_panel: true,
      setting_panel: false,
      menu_panel: false,
      export_panel: false,
    },
  };
  constructor(
    private socketService: SocketService // private authService: AuthService
  ) {
    // new Observable((observer) => {
    //   this.objectsObserver = observer;
    // })?.subscribe((arg) => {
    //   if ('objects') {
    //     this.renderObjectsOnCanvas();
    //   }
    // });
  }
  get role() {
    return this._role;
  }
  get objects() {
    return this._objects;
  }
  removeEmptyGroups(objects: Object[]) {
    return objects.flatMap((obj) => {
      if (obj.type === 'group') {
        if (obj._objects.length) {
          obj._objects = this.removeEmptyGroups(obj._objects);
          return [obj];
        } else {
          return [] as Object[];
        }
      }
      return [obj];
    });
  }

  countChildsLength(id: string) {
    function traverse(obj: Object): number | undefined {
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
    function traverse(obj: Object[]): string[] {
      return obj.flatMap((ob: Object) => {
        if (ob.type === 'group') {
          return [ob._id, ...traverse(ob._objects)];
        } else {
          return [ob._id];
        }
      });
    }

    return traverse(this.selectedObj);
  }

  getOneDarray(obj: Object[]) {
    function traverse(obj: Object[]): Object[] {
      return obj.flatMap((ob: Object) => {
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
    return this.getOneDarray(this.selectedObj);
  }

  static extractIds(objects: Object[]) {
    function traverse(obj: Object[]): string[] {
      return obj.flatMap((ob: Object) => {
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
    function isExist(obj: Object): boolean {
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

    for (const obj of this.selectedObj) {
      const res = isExist(obj);
      if (res) {
        return true;
      }
    }
    return false;
  }

  seriesIndex(id: string, text?: string) {
    let count = 0;
    function traverse(
      obj: Object & { series_index?: number }
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

  enliveObjcts(project: Project, replace: boolean = false): void {
    fabric.util.enlivenObjects(
      JSON.parse(project.objects || '[]'),
      (createdObjs: Object[]) => {
        // console.log(this.canvas?.height ,window.innerHeight,project.height)
        // console.log(this.canvas?.width ,window.innerWidth,project.width)
        createdObjs?.forEach((obj: Object) => {
          //   const scalY = this.canvas?.height! / project.height;
          //   const scalX = this.canvas?.width! / project.width;
          //   obj.scaleToHeight(300 * scalY);
          //   obj.scaleToWidth(300 * scalX);
          //   obj.left = obj.left! * scalX;
          //   obj.top = obj.top! * scalY;
          this.canvas?.add(obj);
        });
        // this.canvas?.add(createdObjs as any);
        this.canvas?.renderAll();
        if (replace) {
          this._objects = createdObjs;
          this.reRender();
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
        function changeId(objects: Object[]) {
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
          } as IGroupOptions) as Group;
          newGroup._objects = objects;
          this._objects = [newGroup, ...this.objects];
        }
        this.reRender();
      },
      'fabric'
    );
  }

  updateObjects(
    objs: Object | Object[],
    method: 'push' | 'reset' | 'popAndPush' | 'replace' = 'push'
  ) {
    if (!Array.isArray(objs)) objs = [objs];
    if (method === 'reset') {
      this._objects = objs;
    } else if (method === 'push') {
      objs.forEach((obj) => {
        this._objects.push(obj);
      });
    } else if (method === 'popAndPush') {
      this._objects[this._objects.length - 1] = objs[0];
    } else if (method === 'replace') {
      this._objects = this._objects.map((obj) => {
        for (const its of objs as Object[]) {
          if (its._id == obj._id) return its;
        }
        return obj;
      });
    }
    this.reRender();
    this.socketService.emit('objects:modified', {
      roomId: this.projectId,
      objects: this.canvas?.toObject(['_id', 'name']).objects,
    });
  }

  removeElements = (array: Object[], ids: string[]) => {
    ids.forEach((Id) => {
      const index = array.findIndex((element) => element._id === Id);
      if (index !== -1) {
        array.splice(index, 1);
        console.log(Id, ' ', 'deleted');
      }
    });

    for (const element of array) {
      if (element.type === 'group' && element._objects) {
        this.removeElements(element._objects, ids);
      }
    }
  };

  filterSelectedObjByIds(ids: string[]) {
    this.removeElements(this.selectedObj, ids);
    console.log(this.selectedObj);
  }

  filterObjectsByIds(ids: string[]) {
    this.removeElements(this.objects, ids);
    this.reRender();
    this.socketService.emit('objects:modified', {
      roomId: this.projectId,
      objects: this.canvas?.toObject(['_id', 'name']).objects,
    });
    // this.idsOfSelectedObj = [];
  }

  renderObjectsOnCanvas(backgroungColor?: string) {
    this.canvas?.clear();
    this.canvas?.setBackgroundColor(backgroungColor || '#282829', () => {});
    const draw = (objects: Object[]) => {
      objects.forEach((obj) => {
        if (obj.type === 'group') {
          draw(obj._objects as Object[]);
        } else {
          this.canvas?.add(obj);
        }
      });
    };
    draw(this.objects);
    this.tempRefObj?.forEach((ref) => {
      this.canvas?.add(ref);
    });
  }

  reRender() {
    // this.objectsObserver?.next('objects');
    this.renderObjectsOnCanvas();
  }
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  toggleLayoutVisibility(
    panel: (
      | 'layer_panel'
      | 'property_panel'
      | 'tool_panel'
      | 'setting_panel'
      | 'menu_panel'
      | 'export_panel'
    )[],
    status?: boolean
  ) {
    panel.forEach((str) => {
      this.layout.visibility[str] =
        status == undefined ? !this.layout.visibility[str] : status;
    });
    if (
      (panel.includes('layer_panel') || panel.includes('property_panel')) &&
      this.isMobile() &&
      window.innerWidth < 999
    ) {
      if (panel.includes('layer_panel'))
        this.layout.visibility.property_panel = false;
      if (panel.includes('property_panel'))
        this.layout.visibility.layer_panel = false;
    }
  }

  setRole(role: Roles) {
    if (!this.canvas) return;
    this._role = role;
    if (this.currentDrawingObject?.type === 'path') {
      this.loadSVGFromString(this.currentDrawingObject);
    } else if (this.currentDrawingObject?.type == 'i-text') {
      (this.currentDrawingObject as fabric.IText).exitEditing();
      !(this.currentDrawingObject as fabric.IText).text &&
        this.filterObjectsByIds([this.currentDrawingObject._id]);
    }
    this.currentDrawingObject = undefined;
    this.reRender();
    if (role === 'pencil') {
      this.canvas.isDrawingMode = true;
    } else {
      this.canvas.isDrawingMode = false;
    }
    if (role === 'select') {
      this.objectCustomization(true);
    } else {
      this.objectCustomization(false);
    }
    this.tempRefObj = [];
    if (role != 'pan') {
      this.canvas!.defaultCursor = 'default';
      this.canvas!.setCursor('default');
      this.canvas!.skipTargetFind = false;
    }else{
      this.canvas!.defaultCursor = 'grab';
      this.canvas!.setCursor('grab');
      this.canvas!.skipTargetFind = true;
    }
  }

  objectCustomization(arg: boolean) {
    this.canvas?.getObjects().forEach((objs) => {
      // Prevent customization:
      objs.selectable = arg;
      objs.evented = arg;
    });
    this.canvas?.renderAll();
  }

  loadSVGFromString(data: Object) {
    fabric.loadSVGFromString(data.toSVG(), (str) => {
      const newPath = str[0] as Object;
      newPath._id = uuidv4();
      this.updateObjects(newPath, 'popAndPush');
      this.currentDrawingObject = undefined;
      this.setRole('select');
    });
  }
}
