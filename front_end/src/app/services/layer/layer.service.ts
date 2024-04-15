import { Injectable } from '@angular/core';
import { CanvasService } from '../canvas/canvas.service';
import { Group, Object, Position } from '../../../types/app.types';
import { fabric } from 'fabric';
import { IGroupOptions } from 'fabric/fabric-impl';
import { v4 } from 'uuid';
@Injectable({
  providedIn: 'root',
})
export class LayerService {
  context_menu: Position | null = null;
  changeOrder: null | {
    from: { obj_id: string; group_id: string | null; index: number };
    to?: { group_id: string | null; index: number };
  } = null;
  constructor(public canvasService: CanvasService) {}

  private traveseAndSetToAll(
    objects: Object[],
    property: keyof Object,
    value: any
  ) {
    objects.forEach((obj) => {
      obj[property] = value;
      if (obj.type === 'group') {
        this.traveseAndSetToAll(obj._objects, property, value);
      }
    });
  }

  toggleVisibility(obj: Object, arg?: boolean) {
    obj.visible = arg !== undefined ? arg : !obj.visible;
    obj.evented = arg !== undefined ? arg : !obj.evented;
    if (obj.type === 'group') {
      this.traveseAndSetToAll(obj._objects, 'visible', obj.visible);
    }
    this.canvasService.reRender();
  }
  toggleControllability(obj: Object, arg?: boolean) {
    obj.selectable = arg !== undefined ? arg : !obj.selectable;
    obj.evented = arg !== undefined ? arg : !obj.evented;
    if (obj.type === 'group') {
      this.traveseAndSetToAll(obj._objects, 'selectable', obj.selectable);
    }
    this.canvasService.reRender();
  }

  setActiveSelection(e: MouseEvent, object: Object) {
    if (e.ctrlKey) {
      if (!this.canvasService.isSelected(object._id)) {
        const ids = CanvasService.extractIds([object]);
        this.canvasService.filterSelectedObjByIds(ids);
        let pre = [...this.canvasService.selectedObj];
        pre = this.canvasService.removeEmptyGroups(pre);
        this.canvasService.canvas?.discardActiveObject();
        this.canvasService.selectedObj = [object, ...pre];
      } else {
        this.canvasService.filterSelectedObjByIds([object._id]);
        let pre = [...this.canvasService.selectedObj];
        pre = this.canvasService.removeEmptyGroups(pre);
        this.canvasService.canvas?.discardActiveObject();
        this.canvasService.selectedObj = [...pre];
        // this.canvasService.canvas?.discardActiveObject();
      }
    } else {
      this.canvasService.canvas?.discardActiveObject();
      this.canvasService.selectedObj = [object];
    }
    if (this.canvasService.oneArrayOfSelectedObj.length === 1) {
      const select = this.canvasService.oneArrayOfSelectedObj[0];
      this.canvasService.canvas?.setActiveObject(select);
      // this.canvasService.canvas?.requestRenderAll();
    } else if (this.canvasService.oneArrayOfSelectedObj.length > 1) {
      const select = new fabric.ActiveSelection(
        this.canvasService.oneArrayOfSelectedObj,
        {
          canvas: this.canvasService.canvas,
        }
      );
      this.canvasService.canvas?.setActiveObject(select);
      // this.canvasService.canvas?.requestRenderAll();
    } else {
      this.canvasService.canvas?.discardActiveObject();
    }
    this.canvasService.canvas?.requestRenderAll();
    console.log(this.canvasService.selectedObj);
  }
  onLeftClick(e: MouseEvent, data: Object,groupId:null|string) {
    if(e.ctrlKey&& this.canvasService.isSelected(groupId||'')){
      console.log(groupId)
      return
    }else{

      this.setActiveSelection(e, data);
    }
  }

  createGroup() {
    // Recursive function to find and remove elements from the root array
    function findAndRemoveElement(
      array: Object[],
      elementId: string,
      group_id_to_ignore_removel: string
    ) {
      let found = false;

      array.forEach((element, index) => {
        if (element._id === elementId) {
          array.splice(index, 1);
          found = true; // Element found and removed
        } else if (
          element.type === 'group' &&
          element._id != group_id_to_ignore_removel &&
          element._objects
        ) {
          // Recursively search in sub-elements for groups
          if (
            findAndRemoveElement(
              element._objects,
              elementId,
              group_id_to_ignore_removel
            )
          ) {
            found = true; // Element found and removed in sub-elements
          }
        }
      });

      return found; // Return whether the element was found
    }

    // Function to create and insert a group at the specified position
    const createAndInsertGroup = (
      rootArray: Object[],
      selectedElements: Object[]
    ) => {
      if (!selectedElements.length) return rootArray;
      // Remove selected elements from their original positions
      const newGroupId = v4();
      console.log({ selectedElements });
      // const newRoot = add_series_Property(rootArray);
      // Calculate the series index for the new group
      let indexes = selectedElements.map((element) => {
        return this.canvasService.seriesIndex(element._id, 'indexes') as number;
      });
      // indexes=indexes.filter(num=>Number.isInteger(num))
      const seriesIndex = Math.min(...indexes);
      console.log(indexes);
      // console.log(selectedElements[0].left,selectedElements[0].top)
      const newGroup = new fabric.Group([], {
        _id: newGroupId,
        top: selectedElements[0].top,
        left: selectedElements[0].left,
      } as IGroupOptions).setCoords() as Group;
      newGroup._objects = selectedElements;
      // Function to recursively insert the new group
      const insertGroup = (array: Object[]): Object[] => {
        return array.flatMap((element) => {
          if (element.type === 'group' && element._objects) {
            element._objects = insertGroup(element._objects);
          }
          if (this.canvasService.seriesIndex(element._id) === seriesIndex) {
            console.log('done', ' ', [newGroup]);
            return [newGroup, element];
          } else {
            return [element];
          }
        });
      };

      rootArray = insertGroup(rootArray);

      selectedElements.forEach((element) => {
        findAndRemoveElement(rootArray, element._id, newGroupId);
      });

      return rootArray;
    };
    if (!this.canvasService.objects) return;
    const updatedStack = createAndInsertGroup(
      [...this.canvasService.objects],
      [...this.canvasService.selectedObj]
    );

    this.canvasService.updateObjects(updatedStack, 'reset');
  }

  setObjToMove(id: string, group_id: string | null, index: number) {
    this.changeOrder = {
      from: { obj_id: id, index, group_id },
    };
  }

  setPositionToMove(group_id: string | null, index: number) {
    if (this.changeOrder?.from) {
      this.changeOrder.to = { group_id, index };
    }
  }

  changeOrderIndex() {
    // Function to find an element or group by ID in a nested structure
    function findElementById(
      id: string | null,
      array: Object[]
    ): Object | null {
      for (const element of array) {
        if (element._id === id) {
          return element;
        }
        if (element.type === 'group' && element._objects) {
          const found = findElementById(id, element._objects);
          if (found) {
            return found;
          }
        }
      }
      return null;
    }

    // Function to move elements within the nested structure
    function moveElements(
      data: Object[],
      sourceIds: string[],
      group_id: string | null,
      targetIndex: number
    ) {
      const sourceElements = sourceIds
        .map((id) => findElementById(id, data))
        .filter((element): element is Object => element !== null);

      // Remove the source elements from their original positions
      const removeElements = (array: Object[]) => {
        sourceIds.forEach((sourceId) => {
          const index = array.findIndex((element) => element._id === sourceId);
          if (index !== -1) {
            array.splice(index, 1);
          }
        });

        for (const element of array) {
          if (element.type === 'group' && element._objects) {
            removeElements(element._objects);
          }
        }
      };

      removeElements(data);

      // Find the target element or group
      const targetParent = findElementById(group_id, data);

      // If target is a group, move the source elements to its "elements" property
      if (targetParent?.type === 'group' && targetParent._objects) {
        targetParent._objects.splice(targetIndex, 0, ...sourceElements);
      } else {
        // If target is not a group, move the source elements to the main array
        data.splice(targetIndex, 0, ...sourceElements);
      }
      return data;
    }

    if (
      this.changeOrder?.from.obj_id &&
      this.changeOrder.to?.group_id !== undefined
    ) {
      const updatedStack = moveElements(
        [...this.canvasService.objects],
        [this.changeOrder.from.obj_id],
        this.changeOrder.to.group_id,
        this.changeOrder.to.index
      );
      this.canvasService.updateObjects(updatedStack, 'reset');
    }
  }
  onContextClickAtLayer(e: MouseEvent, obj: Object) {
    e.preventDefault();
    this.context_menu = { x: e.clientX, y: e.clientY };
    if (this.canvasService.selectedObj.length) {
      if (!this.canvasService.idsOfSelectedObj.includes(obj._id)) {
        this.setActiveSelection(e, obj);
      }
    } else {
      this.setActiveSelection(e, obj);
    }
  }
}
