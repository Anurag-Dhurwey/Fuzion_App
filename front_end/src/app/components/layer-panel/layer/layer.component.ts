import { Component, EventEmitter, Input, Output } from '@angular/core';
// import { CanvasService } from '../../../services/canvas/canvas.service';
// import { Object } from '../../../../types/app.types';
@Component({
  selector: 'app-layer',
  standalone: true,
  imports: [],
  templateUrl: './layer.component.html',
  styleUrl: './layer.component.css',
})
export class LayerComponent {
  // @Input() projectId: string | null = null;
  // @Input() layers: Object[] | undefined;
  // @Input() parentGroupIds: (string | null)[] = [];
  // @Input() changeOrder: null | {
  //   from: { obj_id: string; group_id: string | null; index: number };
  //   to?: { group_id: string | null; index: number };
  // } = null;
  // // @Input() isEqualToChangeOrder_to:((index:number,group_id:string|null)=>boolean)|undefined;
  // @Output() onContextClickAtLayer = new EventEmitter<{e:MouseEvent,obj:Object}>();
  // @Output() setObjToMove = new EventEmitter<{obj_id:string,group_id:string|null,index:number}>();
  // @Output() setPositionToMove = new EventEmitter<{group_id:string|null,index:number}>();
  // @Output() onLeftClick = new EventEmitter<{e:MouseEvent,obj:Object}>();
  // constructor(public canvasService: CanvasService) {}

  // traveseAndSetToAll(objects: Object[], property: keyof Object, value: any) {
  //   objects.forEach((obj) => {
  //     obj[property] = value;
  //     if (obj.type === 'group') {
  //       this.traveseAndSetToAll(obj._objects, property, value);
  //     }
  //   });
  // }

  // toggleVisibility(obj: Object, arg?: boolean) {
  //   obj.visible = arg !== undefined ? arg : !obj.visible;
  //   obj.evented = arg !== undefined ? arg : !obj.evented;
  //   if (obj.type === 'group') {
  //     this.traveseAndSetToAll(obj._objects, 'visible', obj.visible);
  //   }
  //   this.canvasService.reRender();
  // }
  // toggleControllability(obj: Object, arg?: boolean) {
  //   obj.selectable = arg !== undefined ? arg : !obj.selectable;
  //   obj.evented = arg !== undefined ? arg : !obj.evented;
  //   if (obj.type === 'group') {
  //     this.traveseAndSetToAll(obj._objects, 'selectable', obj.selectable);
  //   }
  //   this.canvasService.reRender();
  // }

  // parentGroupIdsForChild(id: string) {
  //   return [...this.parentGroupIds, id];
  // }

  // isEqualToChangeOrder_to(index: number, group_id: string|null) {
  //   return (
  //     this.changeOrder?.to?.group_id === group_id &&
  //     index === this.changeOrder.to.index
  //   );
  // }

}
