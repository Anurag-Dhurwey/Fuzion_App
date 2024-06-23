import { Component, HostListener, OnInit } from '@angular/core';
import {
  ActivatedRoute,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToolBarComponent } from '../tool-bar/tool-bar.component';
import {
  Roles,
  Fab_Objects,
  Project,
  Fab_Path,
  QuadraticCurveControlPoint,
  Fab_PathArray,
  Fab_IText,
  FabObjectsPropertiesOnly,
} from '../../../types/app.types';
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
import { ImportImageComponent } from '../import-image/import-image.component';
import { ColorPickerComponent } from '../color-picker/color-picker.component';
import Color from 'color';
// import { ActiveSelection } from 'fabric/fabric-impl';

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
    ImportImageComponent,
    // ColorPickerComponent
  ],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.css',
})
export class CanvasComponent implements OnInit {
  title = 'Fuzion';
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
  private lastPosX: undefined | number;
  private lastPosY: undefined | number;
  // window = window;

  projectResFromServer: boolean = false;

  private webWorker: Worker | null = null;

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
    if (this.layerService.renameLayerForm) {
      if (['Escape', 'Tab', 'Enter'].includes(event.key)) {
        this.layerService.exitLayerRenameForm();
      }
    }
    if (this.canvasService?.role == 'text') return;
    if (event.key == ' ') {
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
    if (this.canvasService?.role == 'text' || this.layerService.renameLayerForm)
      return;
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

  resizeLayer_panel = (e: MouseEvent) => {
    this.canvasService.layout.width.layer_panel = Math.min(
      (e.clientX / window.innerWidth) * 100,
      50
    );
    //  this.canvasService.layout.width.canvas_viewport-=e.movementX
  };
  resizeProperty_panel = (e: MouseEvent) => {
    // console.log(e.clientX);
    this.canvasService.layout.width.property_panel = Math.min(
      100 - (e.clientX / window.innerWidth) * 100,
      50
    );
    // this.canvasService.layout.width.canvas_viewport-=e.movementX
  };
  stopResizePanel = () => {
    document.removeEventListener('mousemove', this.resizeLayer_panel);
    document.removeEventListener('mousemove', this.resizeProperty_panel);
    document.removeEventListener('mouseup', this.stopResizePanel);
  };
  startResizePanel(panel: 'layer_panel' | 'property_panel') {
    if (panel == 'layer_panel') {
      document.addEventListener('mousemove', this.resizeLayer_panel);
      document.addEventListener('mouseup', this.stopResizePanel);
    } else {
      document.addEventListener('mousemove', this.resizeProperty_panel);
      document.addEventListener('mouseup', this.stopResizePanel);
    }
  }

  async saveObjectsToDb() {
    if (!this.canvasService.totalChanges.size) return;
    if (this.socketService.socket?.connected && this.canvasService.projectId) {
      // try {
      const res = await this.dbService.updateObjects(
        JSON.stringify(this.canvasService.objects),
        this.canvasService.projectId
      );
      if (res) {
        this.socketService.emit.saveObjectsToDB_succeeded(
          this.canvasService.projectId
        );
        this.canvasService.totalChanges.clear();
      } else {
        console.error('failed to save');
      }
      // } catch (error) {

      // }
    } else {
      this.canvasService.toggleLayoutVisibility(['export_panel'], true);
      // this.canvasService.totalChanges.clear();
    }
  }

  createWebWorker() {
    // createWorker(): void {
    const workerBlob = new Blob(
      [
        `
        onmessage = function(e) {
          const data = e.data;
          // Perform heavy computation
          const result = performHeavyComputation(data);
          postMessage(result);
        };
  
        function performHeavyComputation(data) {
          // Your heavy computation logic here
          // For demonstration, just returning the data
          return data;
        }
      `,
      ],
      { type: 'application/javascript' }
    );

    this.webWorker = new Worker(URL.createObjectURL(workerBlob));
    // }
  }

  private onProjectEvent = (data: Project) => {
    console.log('onProject');
    if (this.projectResFromServer) return;
    this.projectResFromServer = true;
    this.initializeCanvasSetup(data);

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
          this.socketService.presense[this.socketService.presense.length - 1]
        );
      }
      // this.socketService.presense = data.filter(
      //   (pre) => pre.id !== this.socketService.socket?.id
      // );
    });
    this.socketService.on.object_modified((new_objects, method) => {
      console.log('come');
      if (typeof new_objects === 'string') {
        let parsed = JSON.parse(new_objects);
        new_objects = Array.isArray(parsed) ? parsed : [parsed];
      }
      if (!Array.isArray(new_objects)) {
        new_objects = [new_objects];
      }
      this.canvasService.enliveObjs(new_objects, () => {}, method);
    });
    this.socketService.on.saveObjectsToDB_succeeded((roomId) => {
      if (this.canvasService.projectId === roomId) {
        this.canvasService.totalChanges.clear();
      }
    });
    this.socketService.on.set_object_property((_id, property) => {
      const found = this.canvasService.getObjectById(_id);
      if (found) {
        (found as fabric.Object).set(property);
        this.canvasService.canvas?.requestRenderAll();
      }
    });
    this.canvasService.projectId &&
      this.socketService.emit.room_join(this.canvasService.projectId);
  };

  private initializeCanvasSetup(project?: Project) {
    const board = document.getElementById('canvas') as HTMLCanvasElement;
    board.width = this.canvasService.frame.x;
    board.height = this.canvasService.frame.y;
    // fabric.Object.prototype.toObject = function (additionalProperties) {
    //   return fabric.Object.prototype.toObject.call(
    //     this,
    //     ['_id', 'pathType'].concat(additionalProperties || [])
    //   );
    // };
    this.canvasService.canvas = new fabric.Canvas(board, {
      backgroundColor: this.canvasService.background || '#282829',
      stopContextMenu: true,
      preserveObjectStacking: true,
      // skipTargetFind: this.canvasService.isMobile(),
      selectionKey: 'ctrlKey',
      // backgroundImage: '../../../assets/img/grid.jpg',
      // backgroundVpt:false,
      // defaultCursor:'pointer',
      // hoverCursor:'pointer'
      // targetFindTolerance:5,
      // perPixelTargetFind:true
    });

    this.canvasService.canvas.on('mouse:down', (event) => {
      this.layerService.exitLayerRenameForm();
      this.canvasService.preview_scence_stop();
      if (
        this.canvasService.editingPath &&
        (!event.target || !(event.target as QuadraticCurveControlPoint).ctrlOf)
      ) {
        this.canvasService.removeQuadraticCurveControlPoints();
      }
      // if(this.quadraticCurveControlPoints.length&& !event.target||!(event.target as QuadraticCurveControlPoint).ctrlOf){

      // }
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
      // console.log(event.selected[0].lo);
      // if (!event.selected) return;
      // event.selected.forEach((obj: any) => {
      //   // console.log(obj.calcTransformMatrix())
      //   if (!this.canvasService.isSelected(obj._id)) {
      //     this.canvasService.selectedObj.push(obj);
      //   }
      // });
    });
    this.canvasService.canvas?.on('selection:updated', (event) => {
      if (
        this.canvasService.editingPath &&
        (!event.selected ||
          !(event.selected[0] as QuadraticCurveControlPoint).ctrlOf)
      ) {
        this.canvasService.removeQuadraticCurveControlPoints();
      }
      // if (!event.selected) return;
      // if (!event.e.ctrlKey) this.canvasService.selectedObj = [];
      // event.selected.forEach((obj: any) => {
      //   this.canvasService.selectedObj.push(obj);
      // });
    });
    this.canvasService.canvas?.on('before:selection:cleared', (e) => {
      // this.canvasService.selectedObj = [];
      // console.log((this.canvasService.activeObjects as any).angleOfset)
      // (e.target as ActiveSelection).
    });
    this.canvasService.canvas?.on('selection:cleared', (e) => {
      if (this.canvasService.editingPath) {
        this.canvasService.removeQuadraticCurveControlPoints();
      }
      // this.canvasService.selectedObj = [];
      // (e.target as ActiveSelection).
    });
    this.canvasService.canvas?.on('object:moving', (e) => {
      // this.canvasService.emitReplaceObjsEventToSocket();
      // let x: number = 0;

      // let y: number = 0;
      // if (e.e.clientX && e.e.clientY) {
      //   x = e.e.movementX;

      //   y = e.e.movementY;
      // } else if (
      //   (e.e as unknown as TouchEvent).touches?.length &&
      //   this.lastPosX &&
      //   this.lastPosY
      // ) {
      //   // this.canvasService.transformViewPort(
      //   x = (e.e as unknown as TouchEvent).touches[0].clientX - this.lastPosX;
      //   y = (e.e as unknown as TouchEvent).touches[0].clientY - this.lastPosY;
      //   // );
      //   this.lastPosX = (e.e as unknown as TouchEvent).touches[0].clientX;
      //   this.lastPosY = (e.e as unknown as TouchEvent).touches[0].clientY;
      // }
      // x = e.e.movementX || (e.e as unknown as TouchEvent).touches[0].clientX;
      // y = e.e.movementY || (e.e as unknown as TouchEvent).touches[0].clientY;
      if (
        (e.target as QuadraticCurveControlPoint).ctrlOf &&
        e.target?.left &&
        e.target?.top
      ) {
        this.onQuadraticCurveControlPointMoving(
          e.target as QuadraticCurveControlPoint,
          e.target.left,
          e.target.top
        );
      }
    });
    this.canvasService.canvas?.on('object:resizing', () => {
      // this.canvasService.emitReplaceObjsEventToSocket();
    });
    this.canvasService.canvas?.on('object:rotating', (e) => {
      // this.canvasService.emitReplaceObjsEventToSocket();
    });
    this.canvasService.canvas?.on('object:scaling', () => {
      // this.canvasService.emitReplaceObjsEventToSocket();
    });
    this.canvasService.canvas?.on('object:modified', (e) => {
      this.canvasService.emitReplaceObjsEventToSocket();
      this.canvasService.oneDarrayOfSelectedObj.forEach((ob) => {
        this.canvasService.totalChanges.add(ob._id);
      });
      console.log('modified');
    });
    // this.canvasService.canvas.on('text:editing:entered', (e) => {
    //   console.log(e.target);
    // });
    this.canvasService.canvas.on('text:editing:exited', (e) => {
      if (!e.target || e.target.type != 'i-text') {
        return;
      }
      if ((e.target as fabric.IText).text?.length) {
        // this.currentDrawingObject.exitEditing();
        this.canvasService.updateObjects([e.target as Fab_IText], 'replace');
      } else {
        // this.currentDrawingObject.exitEditing();
        this.canvasService.updateObjects([e.target as Fab_IText], 'delete');
      }
    });
    // this.canvasService.addGrid()
    project && this.canvasService.enliveProject(project, () => {}, true);
  }

  get is_goodToGo() {
    return (
      (this.authService.auth.currentUser &&
        this.canvasService.projectId &&
        this.projectResFromServer &&
        this.socketService.socket?.connected) ||
      (this.canvasService.projectId &&
        window.location.pathname.includes('demo')) ||
      !this.canvasService.projectId
    );
  }

  ngOnInit(): void {
    this.canvasService.projectId = this.route.snapshot.paramMap.get('id');
    if (this.canvasService.projectId) {
      this.dbService
        .getProjectsByIds(this.canvasService.projectId)
        .then((data) => {
          if (
            (this.authService.auth.currentUser?.uid === data[0].user ||
              data[0].members.includes(
                this.authService.auth.currentUser!.uid
              )) &&
            this.canvasService.projectId &&
            !this.window.location.pathname.includes('demo') &&
            this.authService.auth.currentUser?.email
          ) {
            this.socketService.connect(
              this.canvasService.projectId,
              this.authService.auth.currentUser.email,
              {
                onProject: this.onProjectEvent,
              }
            );
          } else if (this.window.location.pathname.includes('demo')) {
            this.initializeCanvasSetup(data[0]);
          }
        });
    } else {
      this.initializeCanvasSetup();
    }

    this.createWebWorker();
    if (this.webWorker) {
      this.webWorker.onmessage = (event) => {
        const { type, res } = event.data as {
          type: 'quadCtrlPointMovement';
          res?: { x?: number; y?: number };
        };
      };
    }
  }

  onQuadraticCurveControlPointMoving(
    point: QuadraticCurveControlPoint,
    x: number,
    y: number
  ) {
    // const curve = this.canvasService.oneDarrayOfObjects.find(
    //   (ob) => ob._id === point.ctrlOf
    // ) as Fab_Path;
    if (!this.canvasService.editingPath) return;
    const path = this.canvasService.editingPath
      .path as unknown as Fab_PathArray;
    if (path && point.top && point.left) {
      if (point.index == 0) {
        // const start1 = (path[point.index] as unknown as number[])[1];
        // const start2 = (path[point.index] as unknown as number[])[2];
        (path[point.index] as unknown as number[])[1] = x;
        (path[point.index] as unknown as number[])[2] = y;
        if (this.canvasService.editingPath.clipStartEndPoint) {
          // const end1 = (path[path.length - 1] as unknown as number[])[3];
          // const end2 = (path[path.length - 1] as unknown as number[])[4];
          (path[path.length - 1] as unknown as number[])[3] = x;
          (path[path.length - 1] as unknown as number[])[4] = y;
          // const end_point =
          //   this.canvasService.quadraticCurveControlPoints[path.length - 1];
          // end_point.left &&
          //   this.canvasService.quadraticCurveControlPoints[path.length - 1].set(
          //     'top',
          //     end_point.left + x
          //   );
          // end_point.top &&
          //   this.canvasService.quadraticCurveControlPoints[path.length - 1].set(
          //     'top',
          //     end_point.top + y
          //   );
        }
      } else if (point.index === path.length - 1 && point.ctrlType == 'node') {
        // const end1 = (path[path.length - 1] as unknown as number[])[3];
        // const end2 = (path[path.length - 1] as unknown as number[])[4];
        (path[path.length - 1] as unknown as number[])[3] = x;
        (path[path.length - 1] as unknown as number[])[4] = y;
        if (this.canvasService.editingPath.clipStartEndPoint) {
          // const start1 = (path[0] as unknown as number[])[1];
          // const start2 = (path[0] as unknown as number[])[2];
          (path[0] as unknown as number[])[1] = x;
          (path[0] as unknown as number[])[2] = y;

          // const start_point = this.canvasService.quadraticCurveControlPoints[0];
          // start_point.left &&
          //   this.canvasService.quadraticCurveControlPoints[0].set(
          //     'top',
          //     start_point.left + x
          //   );
          // start_point.top &&
          //   this.canvasService.quadraticCurveControlPoints[0].set(
          //     'top',
          //     start_point.top + y
          //   );
        }
      } else {
        if (point.ctrlType == 'node') {
          // const p1 = (path[point.index] as unknown as number[])[3];
          // const p2 = (path[point.index] as unknown as number[])[4];
          // console.log(p1,' ',p2,' ',x,' ',y);
          (path[point.index] as unknown as number[])[3] = x;
          (path[point.index] as unknown as number[])[4] = y;
        } else if (point.ctrlType == 'curve') {
          // const p1 = (path[point.index] as unknown as number[])[1];
          // const p2 = (path[point.index] as unknown as number[])[2];
          // console.log(p1,' ',p2,' ',x,' ',y);
          (path[point.index] as unknown as number[])[1] = x;
          (path[point.index] as unknown as number[])[2] = y;
        }
      }
      this.canvasService.loadSVGFromString(
        this.canvasService.editingPath,
        {
          _id: this.canvasService.editingPath._id,
          pathType: this.canvasService.editingPath.pathType,
          clipStartEndPoint: this.canvasService.editingPath.clipStartEndPoint,
          name: this.canvasService.editingPath.name || 'path',
        },
        'replace'
      );
      this.canvasService.quadraticCurveControlPoints.forEach((point) =>
        this.canvasService.canvas?.bringToFront(point)
      );
    }
  }

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
          obj.name = obj.type;
          this.canvasService.updateObjects(obj);
          this.canvasService.currentDrawingObject = obj;
          (obj as fabric.IText).enterEditing();
        }
      } else {
        // (this.canvasService.currentDrawingObject as fabric.IText).exitEditing();
        // !(this.canvasService.currentDrawingObject as fabric.IText).text &&
        //   this.canvasService.updateObjects(
        //     [this.canvasService.currentDrawingObject],
        //     'delete'
        //   );
        (this.canvasService.currentDrawingObject as Fab_IText).exitEditing();
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
        const toEdit = pen.path as unknown as Fab_PathArray[];
        const midX =
          x -
          (x -
            (toEdit[toEdit.length - 1][toEdit.length == 1 ? 1 : 3] as number)) /
            2;
        const midY =
          y -
          (y -
            (toEdit[toEdit.length - 1][toEdit.length == 1 ? 2 : 4] as number)) /
            2;
        toEdit.push(['Q', midX, midY, x, y]);
        pen.set('path', toEdit as any[]);
        // console.log((this.canvasService.currentDrawingObject as any).pathType)
        // this.canvasService.updateObjects(
        //   this.canvasService.currentDrawingObject,
        //   'popAndPush'
        // );
      } else {
        const obj = this.createObjects(
          event,
          this.canvasService.role
        ) as Fab_Path;
        if (obj) {
          obj._id = uuidv4();
          obj.name = obj.type;
          obj.pathType = 'quadratic_curve';
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
        obj.name = obj.type;
        this.canvasService.updateObjects(obj);
        this.canvasService.currentDrawingObject = obj;
      }
    }
  }
  onMouseDoubleClick(event: fabric.IEvent<MouseEvent>): void {
    if (
      this.canvasService?.role === 'select' &&
      event.target?.type === 'path' &&
      (event.target as Fab_Path).pathType == 'quadratic_curve'
    ) {
      this.canvasService.addQuadraticCurveControlPoints(
        event.target as Fab_Path
      );
      // this.editingPath=event.target as Fab_Path
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
    const obj = this.canvasService.objects[0];
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
      const start = pen.path[pen.path.length - 1] as unknown as number[];

      if (this.canvasService.quadraticCurveRefLine) {
        this.canvasService.quadraticCurveRefLine.set({
          x1: start[3] || start[1],
          y1: start[4] || start[2],
          x2: x,
          y2: y,
        });
        this.canvasService.canvas?.requestRenderAll();
      } else {
        this.canvasService.quadraticCurveRefLine = new fabric.Line(
          [start[3] || start[1], start[4] || start[2], x, y],
          {
            stroke: '#81868a',
            strokeWidth: 1,
          }
        );
        this.canvasService.canvas?.add(
          this.canvasService.quadraticCurveRefLine
        );
      }
    } else if (
      this.isPathControlPointMoving &&
      this.canvasService.quadraticCurveRefLine
    ) {
      this.canvasService.canvas?.remove(
        this.canvasService.quadraticCurveRefLine
      );
      this.canvasService.quadraticCurveRefLine = null;
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
        const penPath = this.canvasService.currentDrawingObject as Fab_Path;
        const path = penPath.path as unknown as number[][];

        if (
          Math.abs(path[0][1] - path[path.length - 1][3]) < 5 &&
          Math.abs(path[0][2] - path[path.length - 1][4]) < 5
        ) {
          path[path.length - 1][3] = path[0][1];
          path[path.length - 1][4] = path[0][2];
          this.canvasService.loadSVGFromString(
            penPath,
            {
              _id: penPath._id,
              pathType: 'quadratic_curve',
              name: penPath.name || 'path',
            },
            'popAndPush'
          );
          this.canvasService.canvas.remove(
            this.canvasService.quadraticCurveRefLine!
          );
          this.canvasService.quadraticCurveRefLine = null;
          this.canvasService.setRole('select');
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
    const path = e.path as Fab_Path;
    path._id = uuidv4();
    path.name = path.type;
    path.pathType = 'free_hand';
    this.canvasService.updateObjects(path);
  }

  defaultProperties = {
    stroke: '#81868a',
    strokeWidth: 4,
  };

  createObjects(e: fabric.IEvent<MouseEvent>, role: Roles) {
    if (!e.pointer) return;
    // const { x, y } = e.pointer;
    const { x, y } = this.canvasService.canvas!.getPointer(e.e, false);
    if (role === 'line') {
      return new fabric.Line([x, y, x + 100, y], {
        stroke: this.defaultProperties.stroke,
        strokeWidth: this.defaultProperties.strokeWidth,
        fill: '',
      }) as Fab_Objects;
    } else if (role === 'rectangle') {
      return new fabric.Rect({
        top: y,
        left: x,
        fill: '',
        stroke: this.defaultProperties.stroke,
        strokeWidth: this.defaultProperties.strokeWidth,
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
        stroke: this.defaultProperties.stroke,
        strokeWidth: this.defaultProperties.strokeWidth,
        fill: '',
      }) as Fab_Objects;
    } else if (role === 'pen') {
      const quadraticCurve = new fabric.Path(`M ${x} ${y}`, {
        fill: '',
        stroke: this.defaultProperties.stroke,
        strokeWidth: this.defaultProperties.strokeWidth,
        objectCaching: false,
        selectable: false,
      });
      // const quadratic_curve_group = new fabric.Group();
      return quadraticCurve as Fab_Objects;
    } else if (role === 'text') {
      const text = new fabric.IText('', {
        top: y,
        left: x,
        stroke: this.defaultProperties.stroke,
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

  ngOnDestroy() {
    if (this.canvasService.projectId) {
      this.socketService.emit.room_leave(this.canvasService.projectId);
    }
    this.socketService.socket?.disconnect();
    this.socketService.socket?.off();
    this.canvasService.unMountProject();
  }
}
