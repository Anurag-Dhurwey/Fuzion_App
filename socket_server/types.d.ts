export type ShapeTypes =
  | "line"
  | "rect"
  | "circle"
  | "i-text"
  | "image"
  | "path";
export interface IObjectOptions {
  _id: string;
  /**
   * Type of an object (rect, circle, path, etc.).
   * Note that this property is meant to be read-only and not meant to be modified.
   * If you modify, certain parts of Fabric (such as JSON loading) won't work correctly.
   */
  type: string | undefined;

  /**
   * Horizontal origin of transformation of an object (one of "left", "right", "center")
   */
  originX?: string | undefined;

  /**
   * Vertical origin of transformation of an object (one of "top", "bottom", "center")
   */
  originY?: string | undefined;

  /**
   * Top position of an object. Note that by default it's relative to object center. You can change this by setting originY={top/center/bottom}
   */
  top?: number | undefined;

  /**
   * Left position of an object. Note that by default it's relative to object center. You can change this by setting originX={left/center/right}
   */
  left?: number | undefined;

  /**
   * Object width
   */
  width?: number | undefined;

  /**
   * Object height
   */
  height?: number | undefined;

  /**
   * Object scale factor (horizontal)
   */
  scaleX?: number | undefined;

  /**
   * Object scale factor (vertical)
   */
  scaleY?: number | undefined;

  /**
   * When true, an object is rendered as flipped horizontally
   */
  flipX?: boolean | undefined;

  /**
   * When true, an object is rendered as flipped vertically
   */
  flipY?: boolean | undefined;

  /**
   * Opacity of an object
   */
  opacity?: number | undefined;

  /**
   * Angle of rotation of an object (in degrees)
   */
  angle?: number | undefined;

  /**
   * Object skew factor (horizontal)
   */
  skewX?: number | undefined;

  /**
   * Object skew factor (vertical)
   */
  skewY?: number | undefined;

  /**
   * Size of object's controlling corners (in pixels)
   */
  cornerSize?: number | undefined;
}

export type Group = IObjectOptions & {
  objects: Fab_Objects[];
  type: "group";
  isMinimized?: boolean;
  isJoined?:boolean
  _id: string;
};

export type Fab_Objects =  Group|(IObjectOptions&{type:ShapeTypes})
export type Project = {
  id: string;
  background: string;
  objects: string;
  version: string;
  user: string;
  width: number;
  height: number;
  members: string[];
  promotional?: boolean;
};
