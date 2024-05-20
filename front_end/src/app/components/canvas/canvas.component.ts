import { Component, HostListener, OnInit } from '@angular/core';
import {
  ActivatedRoute,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToolBarComponent } from '../tool-bar/tool-bar.component';
import { Roles, Fab_Objects } from '../../../types/app.types';
import { fabric } from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { Presense, SocketService } from '../../services/socket/socket.service';
import { CanvasService } from '../../services/canvas/canvas.service';
import { LayerPanelComponent } from '../layer-panel/layer-panel.component';
import { PropertyPanelComponent } from '../property-panel/property-panel.component';
import { ExportComponent } from '../export/export.component';
import { AuthService } from '../../services/auth/auth.service';
import { DbService } from '../../services/db/db.service';
import { LayerService } from '../../services/layer/layer.service';
import { MenuPanelComponent } from './menu-panel/menu-panel.component';
import { SettingPanelComponent } from './setting-panel/setting-panel.component';
import { FrameSelectionPanelComponent } from '../frame-selection-panel/frame-selection-panel.component';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ToolBarComponent,
    LayerPanelComponent,
    PropertyPanelComponent,
    ExportComponent,
    MenuPanelComponent,
    SettingPanelComponent,
    FrameSelectionPanelComponent,
  ],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.css',
})
export class CanvasComponent implements OnInit {
  title = 'fabric app';
  // canvasService: appState | undefined;
  private _recentRole: Roles | undefined;
  isDrawing: boolean = false;
  isPathControlPointMoving: boolean = false;
  pathPointToAdjust:
    | { _refTo: fabric.Path; points: [number, number] }
    | undefined;
  // private store = inject(Store);
  // targetObjectStroke: string | undefined = '';
  isDragging: boolean = false;
  lastPosX: undefined | number;
  lastPosY: undefined | number;
  // window = window;
  constructor(
    public socketService: SocketService,
    public canvasService: CanvasService,
    private layerService: LayerService,
    private dbService: DbService,
    public authService: AuthService,
    private route: ActivatedRoute
  ) {
    // this.store.select(appSelector).subscribe((state) => (this.canvasService = state));
  }

  @HostListener('window:keydown', ['$event'])
  keyDown(event: KeyboardEvent) {
    if (event.key == ' ' && this.canvasService?.role != 'text') {
      this.canvasService.canvas!.defaultCursor = 'grab';
      this.canvasService.canvas!.setCursor('grab');
      this.canvasService.canvas!.skipTargetFind = true;
      if (this.canvasService.role != 'pan')
        this._recentRole = this.canvasService.role;
      this.canvasService.setRole('pan');
    }
  }
  @HostListener('window:keyup', ['$event'])
  keyUp(event: KeyboardEvent) {
    if (this.canvasService?.role == 'text') return;
    if (event.key == ' ') {
      this.canvasService.canvas!.defaultCursor = 'default';
      this.canvasService.canvas!.setCursor('default');
      this.canvasService.canvas!.skipTargetFind = false;
      this._recentRole && this.canvasService.setRole(this._recentRole);
      this._recentRole = undefined;
    } else if (event.key == 'c') {
      this.canvasService.setRole('circle');
    } else if (event.key == 'r') {
      this.canvasService.setRole('rectangle');
    } else if (event.key == 'l') {
      this.canvasService.setRole('line');
    } else if (event.key == 't') {
      this.canvasService.setRole('text');
    } else if (event.key == 'p') {
      this.canvasService.setRole('pencil');
    } else if (event.key == 's') {
      this.canvasService.setRole('pen');
    } else if (event.key == 'a') {
      this.layerService.setAllObjsToActiveSelection();
    }
  }

  get window() {
    return window;
  }

  ngOnInit(): void {
    this.canvasService.projectId = this.route.snapshot.paramMap.get('id');
    if (this.authService.auth.currentUser && this.canvasService.projectId) {
      this.dbService
        .getProjectsByIds(this.canvasService.projectId)
        .then((data: any[]) => {
          if (!data.length) return;
          this.canvasService.enliveProject(data[0], () => {}, true);
          // this.canvasService.members = data[0].members;
          // this.canvasService.adminId = data[0].user;
          // this.canvasService.background = data[0].background;
          // this.canvasService.version = data[0].version;
          // this.canvasService.currentDrawingObject = undefined;
          // this.canvasService.frame.x = data[0].width;
          // this.canvasService.frame.y = data[0].height;
          if (
            (this.authService.auth.currentUser?.uid === data[0].user ||
              data[0].members.includes(
                this.authService.auth.currentUser!.uid
              )) &&
            this.canvasService.projectId &&
            !this.window.location.pathname.includes('demo') &&
            !this.canvasService.isMobile()
          ) {
            this.socketService.connect(
              this.canvasService.projectId,
              this.authService.auth.currentUser?.email
            );
            this.socketService.on.mouse_move((data) => {
              if (data._id === this.socketService.socket?.id) return;
              const i = this.socketService.presense.findIndex(
                (rect) => rect._id === data._id
              );
              if (i >= 0) {
                this.socketService.presense[i].set('top', data.position.y);
                this.socketService.presense[i].set('left', data.position.x);
                this.socketService.presense[i].set('expiry', Date.now());
                this.canvasService.canvas?.requestRenderAll();
              } else {
                this.socketService.presense.push(
                  new fabric.Rect({
                    width: 10,
                    height: 10,
                    selectable: false,
                    perPixelTargetFind: false,
                    evented: false,
                    top: data.position.y,
                    left: data.position.x,
                    expiry: Date.now(),
                    _id: data._id,
                  } as any) as Presense
                );
                this.canvasService.canvas?.add(
                  this.socketService.presense[
                    this.socketService.presense.length - 1
                  ]
                );
              }
              // this.socketService.presense = data.filter(
              //   (pre) => pre.id !== this.socketService.socket?.id
              // );
            });
            this.socketService.on.object_modified((new_objects, method) => {
              if (typeof new_objects === 'string') {
                let parsed = JSON.parse(new_objects);
                new_objects = Array.isArray(parsed) ? parsed : [parsed];
              }
              if (!Array.isArray(new_objects)) {
                new_objects = [new_objects];
              }
              this.canvasService.enliveObjs(
                new_objects,
                (obj) => {
                  // console.log(obj)
                },
                method
              );
            });
            this.socketService.emit.room_join(this.canvasService.projectId);
          }
        });
    }

    const board = document.getElementById('canvas') as HTMLCanvasElement;
    board.width = this.canvasService.frame.x;
    board.height = this.canvasService.frame.y;
    this.canvasService.canvas = new fabric.Canvas(board, {
      backgroundColor: this.canvasService.background || '#282829',
      stopContextMenu: true,
      preserveObjectStacking: true,
      // skipTargetFind: this.canvasService.isMobile(),
      selectionKey: 'ctrlKey',
      // defaultCursor:'pointer',
      // hoverCursor:'pointer'
      // targetFindTolerance:5,
      // perPixelTargetFind:true
    });

    this.canvasService.canvas.on('mouse:down', (event) => {
      this.canvasService.preview_scence_stop();
      this.onMouseDown(event);
    });
    this.canvasService.canvas.on('mouse:dblclick', (event) =>
      this.onMouseDoubleClick(event)
    );
    this.canvasService.canvas.on('mouse:move', (event) =>
      this.onMouseMove(event)
    );
    this.canvasService.canvas.on('mouse:up', (event) => this.onMouseUp(event));

    this.canvasService.canvas.on('path:created', (event) =>
      this.onPathCreated(event as unknown as { path: fabric.Path })
    );
    this.canvasService.canvas?.on('selection:created', (event) => {
      if (!event.selected) return;
      event.selected.forEach((obj: any) => {
        // console.log(obj.calcTransformMatrix())
        if (!this.canvasService.isSelected(obj._id)) {
          this.canvasService.selectedObj.push(obj);
        }
      });
   });
    this.canvasService.canvas?.on('selection:updated', (event) => {
      if (!event.selected) return;
      if (!event.e.ctrlKey) this.canvasService.selectedObj = [];
      event.selected.forEach((obj: any) => {
        this.canvasService.selectedObj.push(obj);
      });
    });
    this.canvasService.canvas?.on('selection:cleared', () => {
      this.canvasService.selectedObj = [];
    });
    this.canvasService.canvas?.on('object:moving', () => {
      this.canvasService.emitReplaceObjsEventToSocket()
    });
    this.canvasService.canvas?.on('object:resizing', () => {
      this.canvasService.emitReplaceObjsEventToSocket()
    });
    this.canvasService.canvas?.on('object:rotating', () => {
      this.canvasService.emitReplaceObjsEventToSocket()
    });
    this.canvasService.canvas?.on('object:scaling', () => {
      this.canvasService.emitReplaceObjsEventToSocket()
    });
  }

  // emitModifyEvent() {
  //   this.canvasService.projectId &&
  //     this.socketService.emit.object_modified(
  //       this.canvasService.projectId,
  //       this.canvasService.selectedObj,
  //       'replace'
  //     );
  // }

  onMouseDown(event: fabric.IEvent<MouseEvent>): void {
    if (!this.canvasService.canvas) return;
    if (!this.canvasService.isMobile() && this.canvasService.role == 'pan') {
      this.lastPosX = event.e.clientX;
      this.lastPosY = event.e.clientY;
      this.isDragging = true;
      this.canvasService.canvas.selection = false;
      this.canvasService.canvas.defaultCursor = 'grabbing';
      this.canvasService.canvas.setCursor('grabbing');
      return;
    }

    if (this.canvasService.role == 'text') {
      this.isDrawing = true;
      if (!this.canvasService.currentDrawingObject) {
        const obj = this.createObjects(event, this.canvasService.role);
        if (obj) {
          obj._id = uuidv4();
          this.canvasService.updateObjects(obj);
          this.canvasService.currentDrawingObject = obj;
          (obj as fabric.IText).enterEditing();
        }
      } else {
        (this.canvasService.currentDrawingObject as fabric.IText).exitEditing();
        !(this.canvasService.currentDrawingObject as fabric.IText).text &&
          this.canvasService.updateObjects(
            [this.canvasService.currentDrawingObject],
            'delete'
          );
        this.canvasService.currentDrawingObject = undefined;
        this.canvasService.setRole('select');
      }
    } else if (this.canvasService.role === 'pen') {
      this.isPathControlPointMoving = true;
      this.isDrawing = true;
      if (this.canvasService.currentDrawingObject) {
        const { x, y } = this.canvasService.canvas!.getPointer(event.e, false);
        const pen = this.canvasService
          .currentDrawingObject as unknown as fabric.Path;
        if (!pen.path) return;
        const toEdit = pen.path as unknown as (number | string)[][];
        toEdit.push(['Q', x, y, x, y]);
        this.canvasService.updateObjects(
          this.canvasService.currentDrawingObject,
          'popAndPush'
        );
      } else {
        const obj = this.createObjects(event, this.canvasService.role);
        if (obj) {
          obj._id = uuidv4();
          this.canvasService.currentDrawingObject = obj;
          this.canvasService.updateObjects(obj);
        }
      }
    } else if (
      this.canvasService.role &&
      this.canvasService.role != 'select' &&
      this.canvasService.role != 'image'
    ) {
      this.isDrawing = true;
      const obj = this.createObjects(event, this.canvasService.role);
      if (obj) {
        obj._id = uuidv4();
        this.canvasService.updateObjects(obj);
        this.canvasService.currentDrawingObject = obj;
      }
    }
  }
  onMouseDoubleClick(event: fabric.IEvent<MouseEvent>): void {
    if (
      this.canvasService?.role === 'select' &&
      event.target?.type === 'path'
    ) {
      const path = event.target as fabric.Path & { _id: string };
      this.canvasService.tempRefObj = [];
      path.path?.forEach((points, i) => {
        const arrPoint = points as unknown as number[];
        let ctrlOne = new fabric.Circle({
          left: Math.floor(arrPoint[1]),
          top: Math.floor(arrPoint[2]),
          radius: 5,
          fill: 'blue',
        }) as fabric.Circle & {
          _refTo: fabric.Path;
          _refIndex: [number, number];
        };

        ctrlOne._refTo = path;
        ctrlOne._refIndex = [i, 1];
        let ctrlTwo =
          path.path &&
          i < path.path?.length - 1 &&
          arrPoint[3] &&
          arrPoint[4] &&
          (new fabric.Circle({
            left: arrPoint[3],
            top: arrPoint[4],
            radius: 5,
            fill: 'blue',
          }) as unknown as fabric.Circle & {
            _refTo: fabric.Path;
            _refIndex: [number, number];
          });
        this.canvasService.canvas?.add(ctrlOne);
        this.canvasService.tempRefObj.push(ctrlOne as any);
        if (ctrlTwo) {
          ctrlTwo._refTo = path;
          ctrlTwo._refIndex = [i, 2];
          this.canvasService.canvas?.add(ctrlTwo);
          this.canvasService.tempRefObj.push(ctrlTwo as any);
        }
      });
    }
  }
  onMouseMove(event: fabric.IEvent<MouseEvent>): void {
    if (
      this.canvasService.projectId &&
      this.authService.auth.currentUser &&
      event.pointer?.x &&
      event.pointer?.y
    ) {
      this.socketService.emit.mouse_move(this.canvasService.projectId, {
        x: event.pointer.x / this.canvasService.zoom,
        y: event.pointer.y / this.canvasService.zoom,
      });
    }
    // if (this.isDrawing) this.canvasService.canvas!.selection = false;
    const obj =
      this.canvasService.objects[this.canvasService.objects.length - 1];
    if (!obj) return;
    if (
      this.isDrawing &&
      event.pointer &&
      this.canvasService?.role &&
      this.canvasService.role != 'select' &&
      this.canvasService.role != 'pencil'
    ) {
      const { x, y } = this.canvasService.canvas!.getPointer(event.e, false);
      switch (this.canvasService.role) {
        case 'line':
          (obj as fabric.Line).set({ x2: x, y2: y });
          // line.set({ x2: x, y2: y });
          break;
        case 'rectangle':
          // const rect = obj as fabric.Rect;
          (obj as fabric.Rect).set({
            width: Math.abs(x - obj.left!),
            height: Math.abs(y - obj.top!),
          });
          break;
        case 'circle':
          // const circle = obj as unknown as fabric.Circle;
          (obj as unknown as fabric.Circle).set({
            radius: Math.floor(
              Math.abs(Math.sqrt((x - obj.left!) ** 2 + (y - obj.top!) ** 2))
            ),
          });
          break;
        case 'pen':
          const pen = obj as unknown as fabric.Path;
          if (!pen.path) break;
          // const toEdit = pen.path[pen.path.length - 1] as unknown as number[];
          (pen.path[pen.path.length - 1] as unknown as number[])[1] = x;
          (pen.path[pen.path.length - 1] as unknown as number[])[2] = y;
          this.canvasService.currentDrawingObject = obj;
          break;
        default:
          break;
      }
      this.canvasService.updateObjects(obj, 'popAndPush');
    }
    if (
      this.canvasService?.role === 'pen' &&
      this.canvasService.currentDrawingObject?.type == 'path' &&
      !this.isPathControlPointMoving
    ) {
      const pen = this.canvasService
        .currentDrawingObject as unknown as fabric.Path & {
        isPathClosed?: boolean;
      };
      if (!pen?.path || pen.isPathClosed) return;
      const { x, y } = this.canvasService.canvas!.getPointer(event.e, false);
      this.canvasService.reRender();
      const start = pen.path[pen.path.length - 1] as unknown as number[];
      this.canvasService.canvas?.add(
        new fabric.Line([start[3] || start[1], start[4] || start[2], x, y], {
          stroke: '#81868a',
          strokeWidth: 1,
        })
      );
    }

    if (
      this.isDragging &&
      !this.canvasService.isMobile() &&
      this.lastPosX &&
      this.lastPosY
    ) {
      this.canvasService.transformViewPort(
        event.e.clientX - this.lastPosX,
        event.e.clientY - this.lastPosY
      );
      this.lastPosX = event.e.clientX;
      this.lastPosY = event.e.clientY;
    }
  }

  onMouseUp(event: fabric.IEvent<MouseEvent>): void {
    if (!this.canvasService.canvas) return;
    this.isDrawing = false;
    this.isPathControlPointMoving = false;

    if (this.canvasService?.role === 'pen') {
      if (
        this.canvasService.currentDrawingObject &&
        this.canvasService.currentDrawingObject.type === 'path'
      ) {
        const penPath = this.canvasService
          .currentDrawingObject as fabric.Path & {
          isPathClosed?: boolean;
          _id: string;
          type: 'path';
        };
        const path = penPath.path as unknown as number[][];

        if (
          Math.abs(path[0][1] - path[path.length - 1][3]) < 5 &&
          Math.abs(path[0][2] - path[path.length - 1][4]) < 5
        ) {
          this.canvasService.loadSVGFromString(penPath);
        }
      }
    }

    if (
      this.canvasService?.role !== 'pencil' &&
      this.canvasService?.role !== 'select' &&
      this.canvasService?.role !== 'pen' &&
      this.canvasService?.role != 'text' &&
      this.canvasService?.role != 'pan'
    ) {
      this.canvasService.currentDrawingObject = undefined;
      this.canvasService.setRole('select');
    }

    if (!this.canvasService.isMobile() && this.isDragging) {
      this.isDragging = false;
      this.canvasService.canvas!.defaultCursor = 'grab';
      this.canvasService.canvas!.setCursor('grab');
      this.canvasService.canvas.selection = true;
      // this.canvasService.canvas.renderAll()
    }
  }

  onPathCreated(e: { path: fabric.Path }): void {
    if (this.canvasService?.role !== 'pencil') return;
    const path = e.path as Fab_Objects;
    path._id = uuidv4();
    this.canvasService.updateObjects(path);
  }

  createObjects(e: fabric.IEvent<MouseEvent>, role: Roles) {
    if (!e.pointer) return;
    // const { x, y } = e.pointer;
    const { x, y } = this.canvasService.canvas!.getPointer(e.e, false);
    if (role === 'line') {
      return new fabric.Line([x, y, x + 100, y], {
        stroke: '#81868a',
        fill: '',
      }) as Fab_Objects;
    } else if (role === 'rectangle') {
      return new fabric.Rect({
        top: y,
        left: x,
        fill: '',
        stroke: '#81868a',
        width: 100,
        height: 100,
      }) as Fab_Objects;
    } else if (role === 'circle') {
      return new fabric.Circle({
        top: y,
        left: x,
        originX: 'center',
        originY: 'center',
        radius: 50,
        stroke: '#81868a',
        fill: '',
      }) as Fab_Objects;
    } else if (role === 'pen') {
      const quadraticCurve = new fabric.Path(`M ${x} ${y}`, {
        fill: '',
        stroke: 'red',
        strokeWidth: 5,
        objectCaching: false,
        selectable: false,
      });
      // const quadratic_curve_group = new fabric.Group();
      return quadraticCurve as Fab_Objects;
    } else if (role === 'text') {
      const text = new fabric.IText('', {
        top: y,
        left: x,
        stroke: '#81868a',
        fill: '#81868a',
        editable: true,
        selected: true,
      });
      return text as Fab_Objects;
    } else {
      return;
    }
  }

  zoomBoard(e: WheelEvent) {
    this.canvasService.setZoom(
      Math.min(3, Math.max(0.1, this.canvasService.zoom - e.deltaY * 0.001))
    );
  }

  ngOnDestroy() {
    if (this.canvasService.projectId) {
      this.socketService.emit.room_leave(this.canvasService.projectId);
    }
    // this.canvasService.updateObjects([], 'reset', false);
    // this.canvasService.members = [];
    // this.canvasService.projectId = null;
    // this.canvasService.background = undefined;
    // this.canvasService.version = undefined;
    // this.canvasService.adminId = undefined;
    // this.canvasService.currentDrawingObject = undefined;
    this.socketService.socket?.disconnect();
    this.socketService.socket?.off();
    this.canvasService.unMountProject();
  }

  private lastDistance = 0;
  onTouchStart(event: TouchEvent) {
    if (this.canvasService.role == 'pan' && event.touches.length === 1) {
      this.lastPosX = event.touches[0].clientX;
      this.lastPosY = event.touches[0].clientY;
      this.isDragging = true;
      this.canvasService.canvas!.selection = false;
      // this.canvasService.canvas!.defaultCursor = 'grabbing';
      // this.canvasService.canvas!.setCursor('grabbing');
      return;
    }
    if (event.touches.length === 2) {
      this.canvasService.canvas!.skipTargetFind = true;
      this.canvasService.canvas!.selection = false;
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      this.lastDistance = distance;
    }
  }

  onTouchMove(event: TouchEvent) {
    if (
      event.touches.length === 1 &&
      this.isDragging &&
      this.lastPosX &&
      this.lastPosY
    ) {
      this.canvasService.transformViewPort(
        event.touches[0].clientX - this.lastPosX,
        event.touches[0].clientY - this.lastPosY
      );
      this.lastPosX = event.touches[0].clientX;
      this.lastPosY = event.touches[0].clientY;
    }
    if (event.touches.length === 2) {
      event.preventDefault();
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      this.canvasService.setZoom(
        Math.min(
          3,
          Math.max(
            0.1,
            this.canvasService.zoom + (distance - this.lastDistance) * 0.005
          )
        )
      );
      this.lastDistance = distance;
    }
  }

  onTouchEnd(event: TouchEvent) {
    if (event.touches.length !== 2) {
      this.lastDistance = 0;
      this.canvasService.canvas!.skipTargetFind = false;
      this.canvasService.canvas!.selection = true;
    }
    if (this.isDragging && event.touches.length !== 1) {
      this.isDragging = false;
      // this.canvasService.canvas!.defaultCursor = 'grab';
      // this.canvasService.canvas!.setCursor('grab');
      this.canvasService.canvas!.selection = true;
      // this.canvasService.canvas.renderAll()
    }
  }
}
