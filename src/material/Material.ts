import { Shader } from "./Shader";

/**
 * Base material: owns a shader program. The renderer sets the standard transform
 * and light uniforms; each material uploads its own parameters via setUniforms().
 */
export abstract class Material {
  readonly shader: Shader;

  constructor(shader: Shader) {
    this.shader = shader;
  }

  use(gl: WebGL2RenderingContext): void {
    this.shader.use(gl);
  }

  abstract setUniforms(gl: WebGL2RenderingContext): void;
}
