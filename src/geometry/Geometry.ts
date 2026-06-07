// Canonical attribute slots. Shaders bind to these with `layout(location = N)`.
export const ATTR_POSITION = 0;
export const ATTR_NORMAL = 1;
// Reserved for later: UV = 2, COLOR = 3, TANGENT = 4, INSTANCE_* = 8+ ...

interface GeometryAttribute {
  name: string;
  location: number;
  size: number; // components per vertex (1..4)
  data: Float32Array;
}

/**
 * Base geometry. Owns CPU-side attribute arrays + optional indices, and lazily
 * uploads them into a single VAO so draws are one bind + one draw call.
 *
 * Phase 1 uses one VBO per attribute (non-interleaved) for clarity. Interleaving
 * into a single buffer is a Phase 2 bandwidth/cache optimization.
 */
export class Geometry {
  private attributes: GeometryAttribute[] = [];
  private indices: Uint16Array | Uint32Array | null = null;
  private vertexCount = 0;

  private vao: WebGLVertexArrayObject | null = null;
  private buffers: WebGLBuffer[] = [];
  private indexBuffer: WebGLBuffer | null = null;
  private indexType = 0;
  private uploaded = false;

  protected setAttribute(name: string, location: number, size: number, data: Float32Array): void {
    this.attributes.push({ name, location, size, data });
    if (this.vertexCount === 0) this.vertexCount = data.length / size;
  }

  protected setIndices(indices: Uint16Array | Uint32Array): void {
    this.indices = indices;
  }

  upload(gl: WebGL2RenderingContext): void {
    if (this.uploaded) return;

    const vao = gl.createVertexArray();
    if (!vao) throw new Error("Failed to create VAO.");
    this.vao = vao;
    gl.bindVertexArray(vao);

    for (const attr of this.attributes) {
      const buffer = gl.createBuffer();
      if (!buffer) throw new Error("Failed to create vertex buffer.");
      this.buffers.push(buffer);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, attr.data, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(attr.location);
      gl.vertexAttribPointer(attr.location, attr.size, gl.FLOAT, false, 0, 0);
    }

    if (this.indices) {
      const ib = gl.createBuffer();
      if (!ib) throw new Error("Failed to create index buffer.");
      this.indexBuffer = ib;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
      this.indexType = this.indices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
    }

    gl.bindVertexArray(null);
    this.uploaded = true;
  }

  draw(gl: WebGL2RenderingContext): void {
    if (!this.uploaded) this.upload(gl);
    gl.bindVertexArray(this.vao);
    if (this.indices) {
      gl.drawElements(gl.TRIANGLES, this.indices.length, this.indexType, 0);
    } else {
      gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
    }
    gl.bindVertexArray(null);
  }

  dispose(gl: WebGL2RenderingContext): void {
    for (const b of this.buffers) gl.deleteBuffer(b);
    if (this.indexBuffer) gl.deleteBuffer(this.indexBuffer);
    if (this.vao) gl.deleteVertexArray(this.vao);
    this.buffers = [];
    this.indexBuffer = null;
    this.vao = null;
    this.uploaded = false;
  }
}
