import { Renderer, type DirectionalLight } from "./core/Renderer";
import { Node } from "./scene/Node";
import { Camera } from "./scene/Camera";
import { Mesh } from "./mesh/Mesh";
import { TriangleGeometry } from "./geometry/TriangleGeometry";
import { PBRMaterial } from "./material/PBRMaterial";
import { Vec3 } from "./math/Vec3";

/** Render a fatal message directly to screen (no devtools needed on mobile). */
function showFatal(message: string): void {
  const el = document.createElement("pre");
  el.style.cssText =
    "position:fixed;inset:0;margin:0;padding:24px;display:flex;align-items:center;" +
    "justify-content:flex-start;text-align:left;color:#ff6b6b;background:#0a0a0f;" +
    "font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;" +
    "overflow:auto;z-index:10;box-sizing:border-box;";
  el.textContent = "Renderer error\n\n" + message;
  document.body.appendChild(el);
}

const canvas = document.getElementById("app") as HTMLCanvasElement | null;
if (!canvas) throw new Error("Canvas element #app not found.");

try {
  const renderer = new Renderer({
    canvas,
    maxPixelRatio: 2,
    clearColor: [0.02, 0.02, 0.05, 1.0],
  });

  const camera = new Camera(50, renderer.aspect, 0.1, 100);
  camera.position.set(0, 0, 3.2);
  camera.target.set(0, 0, 0);

  const root = new Node("root");

  const triangle = new Mesh(new TriangleGeometry(), new PBRMaterial(), "triangle");
  root.add(triangle);

  const light: DirectionalLight = {
    direction: new Vec3(0.4, 0.6, 0.8).normalize(),
    color: new Vec3(1.0, 0.96, 0.9),
    intensity: 3.0,
  };

  // Compile + upload up front so any GLSL/GL error surfaces immediately on-device.
  triangle.material.shader.compile(renderer.gl);
  triangle.geometry.upload(renderer.gl);

  // Spin about a tilted axis so the surface normal sweeps the light and the
  // GGX highlight visibly moves across the face (proves the shader responds to
  // orientation, not just a static fill).
  const spinAxis = new Vec3(0.25, 1.0, 0.0).normalize();
  let angle = 0;

  renderer.onUpdate((dt) => {
    angle += dt * 0.6;
    triangle.rotation.setFromAxisAngle(spinAxis, angle);
  });

  renderer.start(root, camera, light);
} catch (err) {
  showFatal(err instanceof Error ? (err.stack ?? err.message) : String(err));
  throw err;
}
