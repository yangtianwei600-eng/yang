import { Geometry, ATTR_POSITION, ATTR_NORMAL } from "./Geometry";

/** An equilateral triangle (circumradius ~0.6) in the XY plane, facing +Z. */
export class TriangleGeometry extends Geometry {
  constructor() {
    super();

    // Circumradius 0.6 keeps the whole triangle inside a portrait phone's
    // (narrow) horizontal FOV even while it spins.
    const positions = new Float32Array([
      0.0, 0.6, 0.0,
      -0.52, -0.3, 0.0,
      0.52, -0.3, 0.0,
    ]);

    const normals = new Float32Array([
      0.0, 0.0, 1.0,
      0.0, 0.0, 1.0,
      0.0, 0.0, 1.0,
    ]);

    this.setAttribute("a_position", ATTR_POSITION, 3, positions);
    this.setAttribute("a_normal", ATTR_NORMAL, 3, normals);
  }
}
