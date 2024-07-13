import { StaticCanvas,util } from "fabric/node";
import {  FabricObject, Group } from "fabric";
import { Fab_Objects, Project } from "../../types";
const createExportableCanvas = async (project: Project) => {
  const { width, height, objects } = project;
  const canvas = new StaticCanvas(undefined, { width, height });
  const live = await util.enlivenObjects(JSON.parse(objects));
//   console.log({live})
  renderObjectsOnCanvas(canvas,live as any);
  canvas.renderAll()
  // const png = canvas.toDataURL({ format: "png", multiplier: 1 });
  return canvas;
};

const renderObjectsOnCanvas = (
  canvas: StaticCanvas,
  objects: FabricObject[]
) => {
  canvas.clear();

  const draw = (objects: FabricObject[]) => {
    objects.forEach((obj) => {
      if (obj.type === "group") {
        draw([...(obj as Group)._objects].reverse() as FabricObject[]);
      } else {
        canvas.add(obj as unknown as FabricObject);
      }
    });
  };
  draw([...objects].reverse());
};

export { createExportableCanvas };
