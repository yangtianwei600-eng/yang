import { Node } from "../scene/Node";
import { Camera } from "../scene/Camera";
import { Mesh } from "../mesh/Mesh";
import { Vec3 } from "../math/Vec3";
import { Clock } from "./Clock";

/**
 * A single infinite (directional) light. `direction` points FROM the surface
 * TOWARD the light, in world space (renormalized in the shader).
 */
export interface DirectionalLight {
  direction: Vec3;
  color: Vec3;
  intensity: number;
}

export interface RendererOptions {
  canvas: HTMLCanvasElement;
  /**
   * Upper bound on devicePixelRatio for the backing store. The iPhone 15 Pro Max
   * reports DPR 3; full-screen at 3x is ~3.6M fragments vs ~1.6M at 2x for a
   * near-identical look at that PPI. Capping DPR is the biggest fill-rate lever
   * on mobile and will become a per-tier knob in the cross-platform module.
   * Default: 2.
   */
  maxPixelRatio?: number;
  clearColor?: [number, number, number, number];
}

export class Renderer {
  readonly gl: WebGL2RenderingContext;
  readonly canvas: HTMLCanvasElement;

  private maxPixelRatio: number;
  private clearColor: [number, number, number, number];

  private clock = new Clock();
  private rafId = 0;
  private running = false;

  private pixelWidth = 1;
  private pixelHeight = 1;
  private needsResize = true;
  private resizeObserver: ResizeObserver;

  private updateCb: ((dt: number, elapsed: number) => void) | null = null;

  constructor(opts: RendererOptions) {
    this.canvas = opts.canvas;
    this.maxPixelRatio = opts.maxPixelRatio ?? 2;
    this.clearColor = opts.clearColor ?? [0.02, 0.02, 0.05, 1.0];

    const gl = this.canvas.getContext("webgl2", {
      alpha: false,
      depth: true,
      stencil: false,
      antialias: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    if (!gl) {
      throw new Error(
        "WebGL2 is not available. The device/browser may not support it, or it is disabled in settings.",
      );
    }
    this.gl = gl;

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    // Phase 1: show both faces so a winding mistake never yields a blank screen.
    // Back-face culling will be re-enabled once geometry is finalized.
    gl.disable(gl.CULL_FACE);
    gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]);

    // ResizeObserver avoids reading clientWidth every frame (which forces layout).
    this.resizeObserver = new ResizeObserver(() => {
      this.needsResize = true;
    });
    this.resizeObserver.observe(this.canvas);

    this.applyResize();
  }

  get aspect(): number {
    return this.pixelHeight === 0 ? 1 : this.pixelWidth / this.pixelHeight;
  }

  private applyResize(): boolean {
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxPixelRatio);
    const w = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));
    if (w === this.pixelWidth && h === this.pixelHeight) return false;
    this.canvas.width = w;
    this.canvas.height = h;
    this.pixelWidth = w;
    this.pixelHeight = h;
    this.gl.viewport(0, 0, w, h);
    return true;
  }

  onUpdate(callback: (dt: number, elapsed: number) => void): void {
    this.updateCb = callback;
  }

  start(root: Node, camera: Camera, light: DirectionalLight): void {
    if (this.running) return;
    this.running = true;

    const loop = (nowMs: number) => {
      if (!this.running) return;

      if (this.needsResize) {
        this.needsResize = false;
        if (this.applyResize()) camera.setAspect(this.aspect);
      }

      const dt = this.clock.tick(nowMs);
      if (this.updateCb) this.updateCb(dt, this.clock.elapsed);

      this.render(root, camera, light);
      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  dispose(): void {
    this.stop();
    this.resizeObserver.disconnect();
  }

  render(root: Node, camera: Camera, light: DirectionalLight): void {
    const gl = this.gl;

    camera.updateView();
    root.updateWorldMatrix(null);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Phase 1: a naive traversal that sets every uniform per draw. With many
    // meshes this becomes sort-by-material + shared uniform buffer objects (UBOs).
    root.traverse((node) => {
      if (!(node instanceof Mesh)) return;
      const material = node.material;
      const shader = material.shader;

      material.use(gl);

      shader.setMat4(gl, "u_modelMatrix", node.worldMatrix.elements);
      shader.setMat4(gl, "u_viewMatrix", camera.viewMatrix.elements);
      shader.setMat4(gl, "u_projectionMatrix", camera.projectionMatrix.elements);
      shader.setVec3(gl, "u_cameraPosition", camera.position.x, camera.position.y, camera.position.z);
      shader.setVec3(gl, "u_lightDirection", light.direction.x, light.direction.y, light.direction.z);
      shader.setVec3(gl, "u_lightColor", light.color.x, light.color.y, light.color.z);
      shader.setFloat(gl, "u_lightIntensity", light.intensity);

      material.setUniforms(gl);

      node.geometry.draw(gl);
    });
  }
}
