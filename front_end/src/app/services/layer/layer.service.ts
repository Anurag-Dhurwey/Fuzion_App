import { Injectable } from '@angular/core';
import { CanvasService } from '../canvas/canvas.service';
import { Fab_Group, Fab_Objects, Position } from '../../../types/app.types';
import { fabric } from 'fabric';
import { ActiveSelection, IGroupOptions } from 'fabric/fabric-impl';
import { v4 } from 'uuid';
import { SocketService } from '../socket/socket.service';
@Injectable({
  providedIn: 'root',
})
export class LayerService {
  context_menu: { position: Position; refObj: Fab_Objects } | null = null;
  changeOrder: null | {
    from: { obj_id: string; group_id: string | null; index: number };
    to?: { group_id: string | null; index: number };
  } = null;

  renameLayerForm: {
    layerId: string;
    name: string;
  } | null = null;

  constructor(
    public canvasService: CanvasService,
    private socketService: SocketService
  ) {}

  onLayerRename(target: EventTarget | null) {
    if (!this.renameLayerForm || !target) return;
    this.renameLayerForm.name = (target as HTMLInputElement).value;
  }
  exitLayerRenameForm() {
    if (this.renameLayerForm) {
      const found = this.canvasService.getObjectById(
        this.renameLayerForm.layerId
      );
      if (found) {
        found.name = this.renameLayerForm.name;
        this.canvasService.projectId &&
          this.socketService.emit.set_object_property(
            this.canvasService.projectId,
            found._id,
            { name: this.renameLayerForm.name }
          );
        this.canvasService.reRender();
        this.canvasService.saveStateInHistory();
      }
    }
    this.renameLayerForm = null;
  }

  private traveseAndSetToAll(
    objects: Fab_Objects[],
    property: keyof Fab_Objects,
    value: any
  ) {
    objects.forEach((obj) => {
      obj[property] = value;
      if (obj.type === 'group') {
        this.traveseAndSetToAll(obj._objects, property, value);
      }
    });
  }

  toggleVisibility(obj: Fab_Objects, arg?: boolean) {
    obj.visible = arg !== undefined ? arg : !obj.visible;
    obj.evented = arg !== undefined ? arg : !obj.evented;
    if (obj.type === 'group') {
      this.traveseAndSetToAll(obj._objects, 'visible', obj.visible);
    }
    // this.canvasService.reRender();
    this.canvasService.canvas?.requestRenderAll();
    this.canvasService.saveStateInHistory();
  }
  toggleControllability(obj: Fab_Objects, arg?: boolean) {
    obj.selectable = arg !== undefined ? arg : !obj.selectable;
    obj.evented = arg !== undefined ? arg : !obj.evented;
    if (obj.type === 'group') {
      this.traveseAndSetToAll(obj._objects, 'selectable', obj.selectable);
    }
    this.canvasService.canvas?.requestRenderAll();
    // this.canvasService.reRender();
    this.canvasService.saveStateInHistory();
  }

  setActiveSelection(e: MouseEvent, object: Fab_Objects) {
    if (object.type === 'group') {
      const selectable =
        this.canvasService.filterSelectableObjectsFromGroup(object);
      if (e.ctrlKey) {
        if (this.canvasService.activeObjects) {
          if (
            selectable.some((obj) =>
              this.canvasService.isSelected((obj as Fab_Objects)._id)
            )
          ) {
            selectable.forEach((obj) =>
              (
                this.canvasService.activeObjects as ActiveSelection
              ).removeWithUpdate(obj)
            );
          } else {
            selectable.forEach((obj) => {
              if (!this.canvasService.isSelected(obj._id)) {
                if (
                  this.canvasService.activeObjects?.type === 'activeSelection'
                ) {
                  (
                    this.canvasService.activeObjects as ActiveSelection
                  ).addWithUpdate(obj);
                } else {
                  const select = new fabric.ActiveSelection(
                    [...this.canvasService.oneDarrayOfSelectedObj, obj],
                    {
                      canvas: this.canvasService.canvas,
                    }
                  );
                  this.canvasService.canvas?.setActiveObject(select);
                }
              }
            });
          }
        } else {
          if (selectable.length === 1) {
            this.canvasService.canvas?.setActiveObject(selectable[0]);
          } else if (selectable.length > 1) {
            const select = new fabric.ActiveSelection(selectable, {
              canvas: this.canvasService.canvas,
            });
            this.canvasService.canvas?.setActiveObject(select);
          }
        }
      } else {
        this.canvasService.canvas?.discardActiveObject();
        // const selectable=this.canvasService.filterSelectableObjectsFromGroup(object)
        if (selectable.length === 1) {
          this.canvasService.canvas?.setActiveObject(selectable[0]);
        } else if (selectable.length > 1) {
          const select = new fabric.ActiveSelection(selectable, {
            canvas: this.canvasService.canvas,
          });
          this.canvasService.canvas?.setActiveObject(select);
        }
      }
    } else {
      if (e.ctrlKey) {
        if (this.canvasService.isSelected(object._id)) {
          if (this.canvasService.activeObjects?.type === 'activeSelection') {
            (
              this.canvasService.activeObjects as ActiveSelection
            ).removeWithUpdate(object);
          } else {
            this.canvasService.canvas?.discardActiveObject();
          }
        } else {
          if (this.canvasService.activeObjects) {
            if (this.canvasService.activeObjects.type === 'activeSelection') {
              (
                this.canvasService.activeObjects as ActiveSelection
              ).addWithUpdate(object);
            } else {
              const select = new fabric.ActiveSelection(
                [...this.canvasService.oneDarrayOfSelectedObj, object],
                {
                  canvas: this.canvasService.canvas,
                }
              );
              this.canvasService.canvas?.setActiveObject(select);
            }
          } else {
            this.canvasService.canvas?.setActiveObject(object);
          }
        }
      } else {
        this.canvasService.canvas?.discardActiveObject();
        // this.canvasService.selectedObj = [object];
        this.canvasService.canvas?.setActiveObject(object);
      }
    }

    if (this.canvasService.oneDarrayOfSelectedObj.length === 1) {
      this.canvasService.canvas?.setActiveObject(
        this.canvasService.oneDarrayOfSelectedObj[0]
      );
    }

    this.canvasService.canvas?.requestRenderAll();
  }

  setAllObjsToActiveSelection() {
    this.canvasService.canvas?.discardActiveObject();
    // this.canvasService.selectedObj = [...this.canvasService.oneDarrayOfObjects];
    if (this.canvasService.oneDarrayOfObjects.length === 1) {
      const select = this.canvasService.oneDarrayOfSelectedObj[0];
      this.canvasService.canvas?.setActiveObject(select);
      // this.canvasService.canvas?.requestRenderAll();
    } else if (this.canvasService.oneDarrayOfObjects.length > 1) {
      const select = new fabric.ActiveSelection(
        this.canvasService.oneDarrayOfSelectedObj,
        {
          canvas: this.canvasService.canvas,
        }
      );
      this.canvasService.canvas?.setActiveObject(select);
    }
    this.canvasService.canvas?.requestRenderAll();
  }

  onLeftClick(e: MouseEvent, data: Fab_Objects, groupId: null | string) {
    if (e.ctrlKey && this.canvasService.isSelected(groupId || '')) {
      return;
    } else {
      this.setActiveSelection(e, data);
    }
  }
  isGroupSelected(group: Fab_Group) {
    if (!group._objects.length) return false;
    if (group.isJoined) {
      return this.canvasService.isSelected(group._id);
    } else {
      return !this.canvasService
        .filterSelectableObjectsFromGroup(group)
        .some((ob) => !this.canvasService.isSelected(ob._id));
    }
  }
  createGroup() {
    // Recursive function to find and remove elements from the root array
    function findAndRemoveElement(
      array: Fab_Objects[],
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
      rootArray: Fab_Objects[],
      selectedElements: Fab_Objects[]
    ) => {
      if (!selectedElements.length || selectedElements.length === 1)
        return rootArray;
      // Remove selected elements from their original positions
      const newGroupId = v4();
      console.log({ selectedElements });
      // const newRoot = add_series_Property(rootArray);
      // Calculate the series index for the new group
      let indexes = selectedElements.map((element) => {
        return this.canvasService.seriesIndex(element._id) as number;
      });
      // indexes=indexes.filter(num=>Number.isInteger(num))
      const seriesIndex = Math.min(...indexes);
      console.log(indexes);
      // console.log(selectedElements[0].left,selectedElements[0].top)
      const newGroup = new fabric.Group(selectedElements, {
        _id: newGroupId,
        // top: selectedElements[0].top,
        // left: selectedElements[0].left,
        canvas: this.canvasService.canvas,
      } as IGroupOptions) as Fab_Group;
      newGroup.setCoords();
      newGroup.name = newGroup.type;
      newGroup.isMinimized = true;
      // newGroup._objects = selectedElements;
      // Function to recursively insert the new group
      const insertGroup = (array: Fab_Objects[]): Fab_Objects[] => {
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
      [...this.canvasService.oneDarrayOfSelectedObj]
    );

    this.canvasService.updateObjects(updatedStack, 'reset');
    this.canvasService.saveStateInHistory();
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
      array: Fab_Objects[]
    ): Fab_Objects | null {
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
      data: Fab_Objects[],
      sourceIds: string[],
      group_id: string | null,
      targetIndex: number
    ) {
      const sourceElements = sourceIds
        .map((id) => findElementById(id, data))
        .filter((element): element is Fab_Objects => element !== null);

      // Remove the source elements from their original positions
      const removeElements = (array: Fab_Objects[]) => {
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
      this.canvasService.saveStateInHistory();
    }
  }
  onContextClickAtLayer(e: MouseEvent, obj: Fab_Objects) {
    e.preventDefault();
    this.context_menu = {
      position: { x: e.clientX, y: e.clientY },
      refObj: obj,
    };
    if (this.canvasService.oneDarrayOfSelectedObj.length) {
      if (!this.canvasService.idsOfSelectedObj.includes(obj._id)) {
        this.setActiveSelection(e, obj);
      }
    } else {
      this.setActiveSelection(e, obj);
    }
  }
}
