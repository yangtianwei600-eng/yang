import { Node } from "../scene/Node";
import { Geometry } from "../geometry/Geometry";
import { Material } from "../material/Material";

/** A drawable: a scene-graph node bound to a geometry and a material. */
export class Mesh extends Node {
  geometry: Geometry;
  material: Material;

  constructor(geometry: Geometry, material: Material, name = "Mesh") {
    super(name);
    this.geometry = geometry;
    this.material = material;
  }
}
