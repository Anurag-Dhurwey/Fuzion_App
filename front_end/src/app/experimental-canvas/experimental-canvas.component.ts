import { Component, ElementRef, viewChild } from '@angular/core';
import { fabric } from 'fabric';
import { v4 as uuidv4 } from 'uuid';
@Component({
  selector: 'app-experimental-canvas',
  standalone: true,
  imports: [],
  templateUrl: './experimental-canvas.component.html',
  styleUrl: './experimental-canvas.component.css',
})
export class ExperimentalCanvasComponent {
  divEl = viewChild<ElementRef>('experimentalCanvas');
  canvas: fabric.Canvas | null = null;
  object: Path[] = [];
  refPoints: RefPoints[] = [];
  refLine: boolean = false;
  currentDrawingObject: Path | null = null;
  draw: boolean = false;
  ngAfterViewInit() {
    this.canvas = new fabric.Canvas(
      document.getElementById('experimentalCanvas') as HTMLCanvasElement,
      {
        backgroundColor: '#282829',
        stopContextMenu: true,
        preserveObjectStacking: true,
        // skipTargetFind: this.canvasService.isMobile(),
        selectionKey: 'ctrlKey',
        selection: false,
        // defaultCursor:'pointer',
        // hoverCursor:'pointer'
        // targetFindTolerance:5,
        // perPixelTargetFind:true
      }
    );

    this.canvas.on('mouse:down', (e) => {
      if (this.draw) {
        this.refLine = true;
        const { x, y } = this.canvas!.getPointer(e.e, false);
        if (this.currentDrawingObject) {
          const toEdit = this.currentDrawingObject.path as unknown as (
            | number
            | string
          )[][];
          const midX =
            x -
            (x -
              (toEdit[toEdit.length - 1][
                toEdit.length == 1 ? 1 : 3
              ] as number)) /
              2;
          const midY =
            y -
            (y -
              (toEdit[toEdit.length - 1][
                toEdit.length == 1 ? 2 : 4
              ] as number)) /
              2;
          console.log(midX, midY, x, y);

          toEdit.push(['Q', midX, midY, x, y]);
          this.updateObjs(this.currentDrawingObject, 'popAndPush');
        } else {
          // const obj = this.createObjects(event, this.canvasService.role);
          const obj = new fabric.Path(`M ${x} ${y}`, {
            fill: '',
            stroke: 'red',
            strokeWidth: 5,
            dirty: true,
          }) as Path;

          // if (obj) {
          obj._id = uuidv4();
          this.currentDrawingObject = obj;
          this.updateObjs(this.currentDrawingObject, 'push');
          // this.canvasService.updateObjects(obj);
          // }
        }
      }
    });
    this.canvas.on('mouse:move', (e) => {
      const { x, y } = this.canvas!.getPointer(e.e, false);
      if (!this.currentDrawingObject?.path || !this.draw) {
        return;
      }

      const start = this.currentDrawingObject.path[
        this.currentDrawingObject.path.length - 1
      ] as unknown as number[];
      this.reRender();
      const ref = new fabric.Line(
        [start[3] || start[1], start[4] || start[2], x, y],
        {
          stroke: '#81868a',
          strokeWidth: 1,
          selectable: false,
          perPixelTargetFind: false,
        }
      );
      // console.log( [start[3] || start[1], start[4] || start[2], x, y]);
      this.canvas?.add(ref);
      this.canvas?.renderAll();
    });
    this.canvas.on('mouse:up', (e) => {
      if (this.currentDrawingObject) {
        const penPath = this.currentDrawingObject as fabric.Path & {
          isPathClosed?: boolean;
          _id: string;
          type: 'path';
        };
        const path = penPath.path as unknown as number[][];
        this.loadSVGFromString(penPath);
        if (
          Math.abs(path[0][1] - path[path.length - 1][3]) < 5 &&
          Math.abs(path[0][2] - path[path.length - 1][4]) < 5
        ) {
          this.refLine = false;
          this.draw = false;
          this.currentDrawingObject = null;
          console.log('done');
        }
      }
    });
    this.canvas.on('selection:created', (e) => {
      console.log(e.selected![0]);

      if (e.selected && e.selected[0].type == 'path') {
        // const obj=this.object.find(ob=>ob._id===(e.selected![0] as Path)._id)
        this.getTransformedPoints(e.selected![0] as Path).forEach(
          (point, i) => {
            if (point[0] === 'M' || point[0] === 'L') {
              const circle = new fabric.Circle({
                left: point[1],
                top: point[2],
                radius: 10,
                fill: 'blue',
                hasControls: false,
                hasBorders: false,
              }) as RefPoints;
              circle.name = 'node';
              circle.index = i;
              circle.ctrlOf = (e.selected![0] as Path)._id;

              this.refPoints.push(circle);
            } else if (point[0] === 'Q') {
              const circle = new fabric.Circle({
                left: point[1],
                top: point[2],
                radius: 10,
                fill: 'blue',
                hasControls: false,
                hasBorders: false,
              }) as RefPoints;
              circle.name = 'curve';
              circle.index = i;
              circle.ctrlOf = (e.selected![0] as Path)._id;

              this.refPoints.push(circle);
              const circle2 = new fabric.Circle({
                left: point[3],
                top: point[4],
                radius: 10,
                fill: 'blue',
                hasControls: false,
                hasBorders: false,
              }) as RefPoints;
              circle2.name = 'node';
              circle2.index = i;
              circle2.ctrlOf = (e.selected![0] as Path)._id;

              this.refPoints.push(circle2);
            }
          }
        );
        // if(!obj)return
        // const sPoint = obj.path![0] as unknown as number[];

        this.refPoints.forEach((poi) => {
          this.canvas?.add(poi);
        });
      }
    });
    this.canvas.on('selection:cleared', (e) => {
      this.refPoints.forEach((poi) => {
        this.canvas?.remove(poi);
      });
      this.refPoints = [];
      // this.object[0].set('path',([["M",100,100],["Q",400,300,200,500],["Q",300,600,500,800]] as any[]))
      // this.canvas?.renderAll()
    });
    this.canvas.on('object:moving', (e) => {
      // console.log(e.target)
      if (e.target && (e.target as RefPoints).ctrlOf) {
        console.log('found');
        this.onControlPointMoving(
          e.target as RefPoints,
          e.e.movementX,
          e.e.movementY
        );
      }
    });
  }

  onControlPointMoving(point: RefPoints, moveX: number, moveY: number) {
    const path = this.object.find((ob) => ob._id === point.ctrlOf);
    if (path && path.path) {
      if (point.name == 'node') {
        // const p1 = (path.path[point.index] as unknown as number[])[3];
        // const p2 = (path.path[point.index] as unknown as number[])[4];
        (path.path[point.index] as unknown as number[])[
          point.index == 0 ? 1 : 3
        ] = point.left!;
        (path.path[point.index] as unknown as number[])[
          point.index == 0 ? 2 : 4
        ] = point.top!;
      } else if (point.name == 'curve') {
        // const p1 = (path.path[point.index] as unknown as number[])[1];
        // const p2 = (path.path[point.index] as unknown as number[])[2];
        (path.path[point.index] as unknown as number[])[1] = point.left!;
        (path.path[point.index] as unknown as number[])[2] = point.top!;
      }
      // console.log('found_2');

      // this.updateObjs(path,'replace')
      console.log(path.path![point.index]);
      this.loadSVGFromString(path, 'replace', false);
      // path.set('path',path.r)
    }
  }

  toggleDraw() {
    this.draw = !this.draw;
  }

  loadSVGFromString(
    data: Path,
    method: 'push' | 'popAndPush' | 'replace' = 'popAndPush',
    reRender = true
  ) {
    fabric.loadSVGFromString(data.toSVG(), (str) => {
      const newPath = str[0] as Path;
      newPath._id = data._id;
      this.updateObjs(newPath, method);
      reRender && this.reRender();
    });
  }

  updateObjs(obj: Path, meyhod: 'push' | 'popAndPush' | 'replace') {
    if (meyhod == 'push') {
      this.object.push(obj);
      this.canvas?.add(this.object[this.object.length - 1]);
    } else if (meyhod === 'popAndPush') {
      this.canvas?.remove(this.object[this.object.length - 1]);
      this.object[this.object.length - 1] = obj;
      this.canvas?.add(this.object[this.object.length - 1]);
    } else if (meyhod == 'replace') {
      const i = this.object.findIndex((ob) => ob._id == obj._id);
      if (i != -1) {
        this.canvas?.remove(this.object[i]);
        this.object[i] = obj;
        this.canvas?.add(this.object[i]);
      }
    }
    this.canvas?.renderAll();
  }

  getTransformedPoints(path: Path) {
    // Get the transformation matrix of the object
    var matrix = path.calcTransformMatrix();

    // Initialize an array to hold the transformed points
    var transformedPoints: PathArray[] = [];

    // Iterate through the path commands
    // (path.path as unknown as PathArray[]).forEach((command) =>{
    //   // For commands that have coordinates (like 'M' or 'L')
    //   if (['M', 'L', 'C', 'Q'].includes(command[0])) {
    //     var points:number[][] = [];

    //     // Depending on the command, the number of points varies
    //     if (command[0] === 'M' || command[0] === 'L') {
    //       points.push([command[1], command[2]]);
    //     } else if (command[0] === 'C') {
    //       points.push([command[1], command[2]], [command[3], command[4]], [command[5], command[6]]);
    //     } else if (command[0] === 'Q') {
    //       points.push([command[1], command[2]], [command[3], command[4]]);
    //     }

    //     // Transform each point using the object's matrix
    //     points.forEach(function(point) {
    //       var transformedPoint = fabric.util.transformPoint({x:point[0],y:point[1]}as fabric.Point,matrix,true);
    //       transformedPoints.push(transformedPoint);
    //     });
    //   }
    // });

    (path.path as unknown as PathArray[]).forEach((command) => {
      if (['M', 'L', 'C', 'Q'].includes(command[0])) {
        // var points:number[][] = [];

        // Depending on the command, the number of points varies
        if (command[0] === 'M' || command[0] === 'L') {
          // points.push([command[1], command[2]]);
          // const transformedPoint = fabric.util.transformPoint(
          //   { x: command[1], y: command[2] } as fabric.Point,
          //   matrix,
          //   true
          // );
          const point = this.absolutePoints(
            command[1] - path.pathOffset.x,
            command[2] - path.pathOffset.y,
            matrix
          );
          transformedPoints.push([
            command[0],
            point.x,
            point.y,
          ] as unknown as PathArray);
        } else if (command[0] === 'C') {
          // points.push([command[1], command[2]], [command[3], command[4]], [command[5], command[6]]);
        } else if (command[0] === 'Q') {
          // const transformedPoint = fabric.util.transformPoint(
          //   { x: command[1], y: command[2] } as fabric.Point,
          //   matrix,
          //   true
          // );
          // const transformedPoint2 = fabric.util.transformPoint(
          //   { x: command[3], y: command[4] } as fabric.Point,
          //   matrix,
          //   true
          // );
          const point_1 = this.absolutePoints(
            command[1] - path.pathOffset.x,
            command[2] - path.pathOffset.y,
            matrix
          );
          const point_2 = this.absolutePoints(
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
          ] as unknown as PathArray);

          // points.push([command[1], command[2]], [command[3], command[4]]);
        }

        // Transform each point using the object's matrix
        // points.forEach(function(point) {
        //   var transformedPoint = fabric.util.transformPoint({x:point[0],y:point[1]}as fabric.Point,matrix,true);
        //   transformedPoints.push(transformedPoint);
        // });
      }
    });
    return transformedPoints;
  }

  absolutePoints(x: number, y: number, matrix: any[]) {
    return fabric.util.transformPoint(
      { x, y } as fabric.Point,
      fabric.util.multiplyTransformMatrices(
        this.canvas!.viewportTransform!,
        matrix
      )
    );
  }

  reRender() {
    this.canvas?.clear();
    this.canvas?.setBackgroundColor('#282829', () => {});
    this.object.forEach((obj) => {
      this.canvas?.add(obj);
    });
    this.refPoints.forEach((ref) => {
      this.canvas?.add(ref);
    });
  }

  renderRefPoints() {}
}

type Path = fabric.Path & { _id: string };
type RefPoints = fabric.Circle & {
  name: 'curve' | 'node';
  index: number;
  ctrlOf: string;
};
type PathArray = [string, number, number, number, number, number, number];
