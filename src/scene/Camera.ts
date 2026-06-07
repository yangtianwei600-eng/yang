import { Vec3 } from "../math/Vec3";
import { Mat4 } from "../math/Mat4";

/** Perspective camera producing view + projection matrices. */
export class Camera {
  readonly position = new Vec3(0, 0, 3);
  readonly target = new Vec3(0, 0, 0);
  readonly up = new Vec3(0, 1, 0);

  fovY: number; // radians
  aspect: number;
  near: number;
  far: number;

  readonly viewMatrix = new Mat4();
  readonly projectionMatrix = new Mat4();

  constructor(fovYDegrees = 50, aspect = 1, near = 0.1, far = 100) {
    this.fovY = (fovYDegrees * Math.PI) / 180;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.updateProjection();
  }

  setAspect(aspect: number): void {
    if (aspect === this.aspect) return;
    this.aspect = aspect;
    this.updateProjection();
  }

  updateProjection(): void {
    this.projectionMatrix.perspective(this.fovY, this.aspect, this.near, this.far);
  }

  updateView(): void {
    this.viewMatrix.lookAt(this.position, this.target, this.up);
  }
}
