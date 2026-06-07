import { Vec3 } from "./Vec3";

/** Unit quaternion (x, y, z, w). */
export class Quat {
  x: number;
  y: number;
  z: number;
  w: number;

  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  set(x: number, y: number, z: number, w: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  copy(q: Quat): this {
    return this.set(q.x, q.y, q.z, q.w);
  }

  identity(): this {
    return this.set(0, 0, 0, 1);
  }

  /** axis must be normalized; angle in radians. */
  setFromAxisAngle(axis: Vec3, angle: number): this {
    const half = angle * 0.5;
    const s = Math.sin(half);
    return this.set(axis.x * s, axis.y * s, axis.z * s, Math.cos(half));
  }

  /** this = this * q (Hamilton product). */
  multiply(q: Quat): this {
    const ax = this.x, ay = this.y, az = this.z, aw = this.w;
    const bx = q.x, by = q.y, bz = q.z, bw = q.w;
    return this.set(
      aw * bx + ax * bw + ay * bz - az * by,
      aw * by - ax * bz + ay * bw + az * bx,
      aw * bz + ax * by - ay * bx + az * bw,
      aw * bw - ax * bx - ay * by - az * bz,
    );
  }

  normalize(): this {
    const len = Math.hypot(this.x, this.y, this.z, this.w) || 1;
    const inv = 1 / len;
    return this.set(this.x * inv, this.y * inv, this.z * inv, this.w * inv);
  }
}
