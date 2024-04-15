import { Component, HostListener, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToolBarComponent } from '../tool-bar/tool-bar.component';
import { Store } from '@ngrx/store';
import { appSelector } from '../../store/selectors/app.selector';
import { appState } from '../../store/reducers/state.reducer';
import { setRole } from '../../store/actions/state.action';
import { Roles, Object, Presense } from '../../../types/app.types';
import { fabric } from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { SocketService } from '../../services/socket/socket.service';
import { CanvasService } from '../../services/canvas/canvas.service';
import { LayerPanelComponent } from '../layer-panel/layer-panel.component';
import { PropertyPanelComponent } from '../property-panel/property-panel.component';
import { ExportComponent } from '../export/export.component';
import { AuthService } from '../../services/auth/auth.service';
import { DbService } from '../../services/db/db.service';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    ToolBarComponent,
    LayerPanelComponent,
    PropertyPanelComponent,
    ExportComponent,
  ],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.css',
})
export class CanvasComponent implements OnInit {
  title = 'fabric app';
  app$: appState | undefined;

  isDrawing: boolean = false;
  isPathControlPointMoving: boolean = false;
  pathPointToAdjust:
    | { _refTo: fabric.Path; points: [number, number] }
    | undefined;
  private store = inject(Store);
  targetObjectStroke: string | undefined = '';
  isDragging: boolean = false;
  lastPosX: undefined | number;
  lastPosY: undefined | number;
  constructor(
    public socketService: SocketService,
    public canvasService: CanvasService,
    private dbService: DbService,
    public authService: AuthService,
    private route: ActivatedRoute
  ) {
    this.store.select(appSelector).subscribe((state) => (this.app$ = state));
  }

  @HostListener('window:keydown', ['$event'])
  keyDown(event: KeyboardEvent) {
    if (event.key === ' ') {
      // this.canvasService.canvas!.moveCursor='grabbing';
    }
  }
  @HostListener('window:keyup', ['$event'])
  keyUp(event: KeyboardEvent) {
    if (event.key === ' ') {
      // this.canvasService.canvas!.moveCursor='default';
    }
  }

  ngOnInit(): void {
    this.canvasService.projectId = this.route.snapshot.paramMap.get('id');
    if (this.authService.auth.currentUser && this.canvasService.projectId) {
      this.dbService
        .getProjectsByIds(this.canvasService.projectId)
        .then((data: any[]) => {
          console.log(data);
          if (!data.length) return;
          this.canvasService.enliveObjcts(
            JSON.parse(data[0].objects || '[]'),
            true
          );
          this.canvasService.members = data[0].members;
          this.canvasService.adminId = data[0].user;
          this.canvasService.background = data[0].background;
          this.canvasService.version = data[0].version;
          this.canvasService.currentDrawingObject = undefined;

          if (
            this.authService.auth.currentUser?.uid === data[0].user ||
            data[0].members.includes(this.authService.auth.currentUser!.uid)
          ) {
            this.socketService.connect();
            this.socketService.on('mouse:move', (data: Presense[]) => {
              this.socketService.presense = data.filter(
                (pre) => pre.id !== this.socketService.socket?.id
              );
            });
            this.socketService.on('objects:modified', (new_objects) => {
              this.canvasService.enliveObjcts(new_objects, true);
            });
            this.socketService.emit('room:join', this.canvasService.projectId);
          }
        });
    }

    const board = document.getElementById('canvas') as HTMLCanvasElement;
    board.width = window.innerWidth;
    board.height = window.innerHeight;
    this.canvasService.canvas = new fabric.Canvas(board, {
      backgroundColor: this.app$?.canvasConfig.backgroungColor,
      stopContextMenu: true,
      // targetFindTolerance:5,
      // perPixelTargetFind:true
    });
    window.addEventListener('resize', () => {
      board.width = window.innerWidth;
      board.height = window.innerHeight;
      this.canvasService.canvas?.setHeight(window.innerHeight);
      this.canvasService.canvas?.setWidth(window.innerWidth);
    });

    this.canvasService.canvas.on('mouse:over', (event) => {
      if (event.target) {
        this.targetObjectStroke = event.target.stroke;
        event.target?.set('stroke', '#00FFFF');
        this.canvasService.canvas?.renderAll();
      }
    });
    this.canvasService.canvas.on('mouse:out', (event) => {
      if (event.target) {
        event.target?.set('stroke', this.targetObjectStroke);
        this.canvasService.canvas?.renderAll();
      }
    });
    this.canvasService.canvas.on('mouse:down', (event) =>
      this.onMouseDown(event)
    );
    this.canvasService.canvas.on('mouse:dblclick', (event) =>
      this.onMouseDoubleClick(event)
    );
    this.canvasService.canvas.on('mouse:move', (event) =>
      this.onMouseMove(event)
    );
    this.canvasService.canvas.on('mouse:up', (event) => this.onMouseUp(event));
    this.canvasService.canvas.on('mouse:wheel', (opt) => {
      var delta = opt.e.deltaY;
      var zoom = this.canvasService.canvas!.getZoom();
      zoom = zoom - delta * 0.001;
      if (zoom > 10) zoom = 10;
      if (zoom < 0.1) zoom = 0.1;
      this.canvasService.canvas!.zoomToPoint(
        { x: opt.e.offsetX, y: opt.e.offsetY },
        zoom
      );
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });
    this.canvasService.canvas.on('path:created', (event) =>
      this.onPathCreated(event as unknown as { path: fabric.Path })
    );

    this.canvasService.canvas?.on('object:moving', (event) => {
      this.socketService.emit('objects:modified', {
        objects: this.canvasService.canvas?.toObject(['_id','name']).objects,
        roomId: this.canvasService.projectId,
      });
    });
  }

  onMouseDown(event: fabric.IEvent<MouseEvent>): void {
    if (!this.canvasService.canvas) return;
    if (event.e.altKey) {
      this.lastPosX = event.e.clientX;
      this.lastPosY = event.e.clientY;
      this.isDragging = true;
      this.canvasService.canvas!.selection = false;
      return;
    }
    if (
      this.app$?.role &&
      this.app$.role != 'select' &&
      this.app$.role != 'pen' &&
      this.app$.role != 'image'
    ) {
      this.isDrawing = true;
      const obj = this.createObjects(event, this.app$.role);
      if (obj) {
        obj._id = uuidv4();
        this.canvasService.currentDrawingObject = obj;
        this.canvasService.updateObjects(obj);
        if (obj.type === 'i-text') {
          const text = obj as fabric.IText;
          text.enterEditing();
        }
      }
    } else if (this.app$?.role === 'pen') {
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
        const obj = this.createObjects(event, this.app$.role);
        if (obj) {
          obj._id = uuidv4();
          this.canvasService.currentDrawingObject = obj;
          this.canvasService.updateObjects(obj);
        }
      }
    }
  }
  onMouseDoubleClick(event: fabric.IEvent<MouseEvent>): void {
    if (this.app$?.role === 'select' && event.target?.type === 'path') {
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
    if (this.canvasService.projectId && this.authService.auth.currentUser) {
      this.socketService.emit('mouse:move', {
        position: {
          x: event.pointer?.x,
          y: event.pointer?.y,
        },
        roomId: this.canvasService.projectId,
      });
    }

    const obj =
      this.canvasService.objects[this.canvasService.objects.length - 1];
    if (!obj) return;
    if (
      this.isDrawing &&
      event.pointer &&
      this.app$?.role &&
      this.app$.role != 'select' &&
      this.app$.role != 'pencil'
    ) {
      const { x, y } = this.canvasService.canvas!.getPointer(event.e, false);
      switch (this.app$.role) {
        case 'line':
          const line = obj as unknown as fabric.Line;
          line.set({ x2: x, y2: y });
          break;
        case 'rectangle':
          const rect = obj as fabric.Rect;
          rect.set({
            width: Math.abs(x - rect.left!),
            height: Math.abs(y - rect.top!),
          });
          break;
        case 'circle':
          const circle = obj as unknown as fabric.Circle;
          circle.set({
            radius: Math.floor(
              Math.abs(
                Math.sqrt((x - circle.left!) ** 2 + (y - circle.top!) ** 2)
              )
            ),
          });
          break;
        case 'pen':
          const pen = obj as unknown as fabric.Path;
          if (!pen.path) break;
          const toEdit = pen.path[pen.path.length - 1] as unknown as number[];
          toEdit[1] = x;
          toEdit[2] = y;
          this.canvasService.currentDrawingObject = obj;
          break;
        default:
          break;
      }
      this.canvasService.updateObjects(
        obj,
        'popAndPush'
      );
    }
    if (
      this.app$?.role === 'pen' &&
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

    if (this.isDragging && this.lastPosX && this.lastPosY) {
      var e = event.e;
      var vpt = this.canvasService.canvas!.viewportTransform;
      if (!vpt) return;
      vpt[4] += e.clientX - this.lastPosX;
      vpt[5] += e.clientY - this.lastPosY;
      this.canvasService.canvas!.requestRenderAll();
      this.lastPosX = e.clientX;
      this.lastPosY = e.clientY;
    }
  }

  onMouseUp(event: fabric.IEvent<MouseEvent>): void {
    if (!this.canvasService.canvas) return;
    this.isDrawing = false;
    this.isPathControlPointMoving = false;

    if (this.app$?.role === 'pen') {
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
          this.loadSVGFromString(penPath);
        }
      }
    }

    if (
      this.app$?.role !== 'pencil' &&
      this.app$?.role !== 'select' &&
      this.app$?.role !== 'pen'
    ) {
      this.canvasService.currentDrawingObject = undefined;
      this.setCurrentAction('select');
    }

    if (this.isDragging) {
      this.isDragging = false;
      this.canvasService.canvas.selection = true;
      // this.canvasService.canvas!.setCursor('grab');
    }
  }

  onPathCreated(e: { path: fabric.Path }): void {
    if (this.app$?.role !== 'pencil') return;
    const path = e.path as Object;
    path._id = uuidv4();
    this.canvasService.updateObjects(path);
  }

  createObjects(e: fabric.IEvent<MouseEvent>, role: Roles) {
    if (!e.pointer) return;
    // const { x, y } = e.pointer;
    const { x, y } = this.canvasService.canvas!.getPointer(e.e, false);
    if (role === 'line') {
      return new fabric.Line([x, y, x, y], {
        stroke: '#81868a',
        fill: '',
      }) as Object;
    } else if (role === 'rectangle') {
      return new fabric.Rect({
        top: y,
        left: x,
        fill: '',
        stroke: '#81868a',
        width: 0,
        height: 0,
      }) as Object;
    } else if (role === 'circle') {
      return new fabric.Circle({
        top: y,
        left: x,
        originX: 'center',
        originY: 'center',
        radius: 0,
        stroke: '#81868a',
        fill: '',
      }) as Object;
    } else if (role === 'pen') {
      const quadraticCurve = new fabric.Path(`M ${x} ${y}`, {
        fill: '',
        stroke: 'red',
        strokeWidth: 5,
        objectCaching: false,
        selectable: false,
      });
      // const quadratic_curve_group = new fabric.Group();
      return quadraticCurve as Object;
    } else if (role === 'text') {
      const text = new fabric.IText('', {
        top: y,
        left: x,
        stroke: '#81868a',
        fill: '#81868a',
        editable: true,
        selected: true,
      });
      return text as Object;
    } else {
      return;
    }
  }

  setCurrentAction(role: Roles) {
    if (!this.canvasService.canvas) return;
    this.store.dispatch(setRole({ role }));
    if (this.canvasService.currentDrawingObject?.type === 'path') {
      this.loadSVGFromString(this.canvasService.currentDrawingObject);
    }
    this.canvasService.currentDrawingObject = undefined;
    this.canvasService.reRender();
    if (role === 'pencil') {
      this.canvasService.canvas.isDrawingMode = true;
    } else {
      this.canvasService.canvas.isDrawingMode = false;
    }
    if (role === 'select') {
      this.objectCustomization(true);
    } else {
      this.objectCustomization(false);
    }
    this.canvasService.tempRefObj = [];
  }

  objectCustomization(arg: boolean) {
    this.canvasService.canvas?.getObjects().forEach((object) => {
      // Prevent customization:
      object.selectable = arg;
      object.evented = arg;
    });
    this.canvasService.canvas?.renderAll();
  }

  loadSVGFromString(data: Object) {
    fabric.loadSVGFromString(data.toSVG(), (str) => {
      const newPath = str[0] as Object;
      newPath._id = uuidv4();
      this.canvasService.updateObjects(
        newPath,
        'popAndPush'
      );
      this.canvasService.currentDrawingObject = undefined;
      this.setCurrentAction('select');
    });
  }

  ngOnDestroy() {
    if (this.canvasService.projectId) {
      this.socketService.emit('room:leave', this.canvasService.projectId);
    }
    this.canvasService.objects = [];
    this.canvasService.members = [];
    this.canvasService.projectId = null;
    this.canvasService.background = undefined;
    this.canvasService.version = undefined;
    this.canvasService.adminId = undefined;
    this.canvasService.currentDrawingObject = undefined;
    this.socketService.socket?.disconnect();
    this.socketService.socket?.off();
  }
}
