import { Vec3 } from "../math/Vec3";
import { Quat } from "../math/Quat";
import { Mat4 } from "../math/Mat4";

/**
 * Scene-graph node. Holds a local TRS transform and a parent/child hierarchy.
 *
 * World matrices are recomputed every frame via `updateWorldMatrix` (simple and
 * always correct). Dirty-flagging to skip unchanged subtrees is a clean future
 * optimization once scenes grow large; at kernel scale it is irrelevant.
 */
export class Node {
  name: string;

  readonly position = new Vec3(0, 0, 0);
  readonly rotation = new Quat();
  readonly scale = new Vec3(1, 1, 1);

  readonly localMatrix = new Mat4();
  readonly worldMatrix = new Mat4();

  parent: Node | null = null;
  readonly children: Node[] = [];

  constructor(name = "Node") {
    this.name = name;
  }

  add(child: Node): this {
    if (child.parent) child.parent.remove(child);
    child.parent = this;
    this.children.push(child);
    return this;
  }

  remove(child: Node): this {
    const i = this.children.indexOf(child);
    if (i !== -1) {
      this.children.splice(i, 1);
      child.parent = null;
    }
    return this;
  }

  /** Recompose the local matrix from position/rotation/scale. */
  updateLocalMatrix(): void {
    this.localMatrix.compose(this.position, this.rotation, this.scale);
  }

  /** Recompute this node's world matrix and all descendants'. */
  updateWorldMatrix(parentWorld: Mat4 | null): void {
    this.updateLocalMatrix();
    if (parentWorld) {
      this.worldMatrix.multiplyMatrices(parentWorld, this.localMatrix);
    } else {
      this.worldMatrix.copy(this.localMatrix);
    }
    for (const child of this.children) {
      child.updateWorldMatrix(this.worldMatrix);
    }
  }

  /** Depth-first traversal, this node first. */
  traverse(callback: (node: Node) => void): void {
    callback(this);
    for (const child of this.children) child.traverse(callback);
  }
}
