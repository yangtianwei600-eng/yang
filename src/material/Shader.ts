/** Compiles + links a GLSL ES 3.00 program and caches uniform locations. */
export class Shader {
  program: WebGLProgram | null = null;

  private readonly vertexSrc: string;
  private readonly fragmentSrc: string;
  private uniformLocations = new Map<string, WebGLUniformLocation | null>();

  constructor(vertexSrc: string, fragmentSrc: string) {
    this.vertexSrc = vertexSrc;
    this.fragmentSrc = fragmentSrc;
  }

  compile(gl: WebGL2RenderingContext): void {
    if (this.program) return;

    const vs = this.createStage(gl, gl.VERTEX_SHADER, this.vertexSrc);
    const fs = this.createStage(gl, gl.FRAGMENT_SHADER, this.fragmentSrc);

    const program = gl.createProgram();
    if (!program) throw new Error("Failed to create shader program.");
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      throw new Error("Program link failed:\n" + log);
    }

    // Once linked, the individual stages can be freed.
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    this.program = program;
  }

  use(gl: WebGL2RenderingContext): void {
    if (!this.program) this.compile(gl);
    gl.useProgram(this.program);
  }

  setMat4(gl: WebGL2RenderingContext, name: string, value: Float32Array): void {
    const loc = this.location(gl, name);
    if (loc) gl.uniformMatrix4fv(loc, false, value);
  }

  setVec3(gl: WebGL2RenderingContext, name: string, x: number, y: number, z: number): void {
    const loc = this.location(gl, name);
    if (loc) gl.uniform3f(loc, x, y, z);
  }

  setFloat(gl: WebGL2RenderingContext, name: string, v: number): void {
    const loc = this.location(gl, name);
    if (loc) gl.uniform1f(loc, v);
  }

  private location(gl: WebGL2RenderingContext, name: string): WebGLUniformLocation | null {
    const cached = this.uniformLocations.get(name);
    if (cached !== undefined) return cached;
    const loc = this.program ? gl.getUniformLocation(this.program, name) : null;
    this.uniformLocations.set(name, loc);
    return loc;
  }

  private createStage(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Failed to create shader object.");
    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader) ?? "";
      const stage = type === gl.VERTEX_SHADER ? "vertex" : "fragment";
      gl.deleteShader(shader);
      throw new Error(stage + " shader compile failed:\n" + log + "\n\n" + Shader.numberLines(src));
    }
    return shader;
  }

  private static numberLines(src: string): string {
    return src
      .split("\n")
      .map((line, i) => String(i + 1).padStart(3, " ") + " | " + line)
      .join("\n");
  }
}
