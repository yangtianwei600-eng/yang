import { Material } from "./Material";
import { Shader } from "./Shader";
import { Vec3 } from "../math/Vec3";

const VERTEX_SRC = `#version 300 es
precision highp float;

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

out vec3 v_worldNormal;
out vec3 v_worldPosition;

void main() {
  vec4 worldPosition = u_modelMatrix * vec4(a_position, 1.0);
  v_worldPosition = worldPosition.xyz;

  // mat3(model) is the correct normal transform ONLY for uniform scale.
  // A dedicated inverse-transpose normal matrix arrives with non-uniform scale.
  v_worldNormal = mat3(u_modelMatrix) * a_normal;

  gl_Position = u_projectionMatrix * u_viewMatrix * worldPosition;
}
`;

const FRAGMENT_SRC = `#version 300 es
precision highp float;

in vec3 v_worldNormal;
in vec3 v_worldPosition;

uniform vec3 u_cameraPosition;

uniform vec3 u_lightDirection; // surface -> light, world space
uniform vec3 u_lightColor;
uniform float u_lightIntensity;

uniform vec3 u_albedo;
uniform float u_metallic;
uniform float u_roughness;
uniform float u_ambient;

out vec4 fragColor;

const float PI = 3.141592653589793;

// GGX / Trowbridge-Reitz normal distribution.
float D_GGX(float NdotH, float a) {
  float a2 = a * a;
  float d = (NdotH * NdotH) * (a2 - 1.0) + 1.0;
  return a2 / max(PI * d * d, 1e-7);
}

// Smith geometry term, Schlick-GGX with direct-lighting k remap.
float G_SchlickGGX(float NdotX, float roughness) {
  float r = roughness + 1.0;
  float k = (r * r) / 8.0;
  return NdotX / (NdotX * (1.0 - k) + k);
}
float G_Smith(float NdotV, float NdotL, float roughness) {
  return G_SchlickGGX(NdotV, roughness) * G_SchlickGGX(NdotL, roughness);
}

// Schlick Fresnel.
vec3 F_Schlick(float cosTheta, vec3 F0) {
  return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// Approximate linear -> sRGB. Full tone mapping lands in the post-processing module.
vec3 linearToSRGB(vec3 c) {
  return pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2));
}

void main() {
  vec3 N = normalize(v_worldNormal);
  vec3 V = normalize(u_cameraPosition - v_worldPosition);
  vec3 L = normalize(u_lightDirection);
  vec3 H = normalize(V + L);

  float NdotL = max(dot(N, L), 0.0);
  float NdotV = max(dot(N, V), 1e-4);
  float NdotH = max(dot(N, H), 0.0);
  float VdotH = max(dot(V, H), 0.0);

  float roughness = clamp(u_roughness, 0.04, 1.0);
  float a = roughness * roughness; // perceptual -> linear roughness

  // Dielectrics reflect ~4%; metals tint specular with the base color.
  vec3 F0 = mix(vec3(0.04), u_albedo, u_metallic);

  float D = D_GGX(NdotH, a);
  float G = G_Smith(NdotV, NdotL, roughness);
  vec3  F = F_Schlick(VdotH, F0);

  vec3 specular = (D * G) * F / max(4.0 * NdotV * NdotL, 1e-4);

  // Energy conservation; metals have no diffuse term.
  vec3 kd = (vec3(1.0) - F) * (1.0 - u_metallic);
  vec3 diffuse = kd * u_albedo / PI;

  vec3 radiance = u_lightColor * u_lightIntensity;
  vec3 color = (diffuse + specular) * radiance * NdotL;

  // Flat ambient stand-in for IBL so grazing/back areas are not pure black.
  color += u_albedo * u_ambient;

  fragColor = vec4(linearToSRGB(color), 1.0);
}
`;

export interface PBRMaterialParams {
  albedo?: Vec3; // linear-space base color
  metallic?: number;
  roughness?: number;
  ambient?: number;
}

export class PBRMaterial extends Material {
  albedo: Vec3;
  metallic: number;
  roughness: number;
  ambient: number;

  constructor(params: PBRMaterialParams = {}) {
    super(new Shader(VERTEX_SRC, FRAGMENT_SRC));
    this.albedo = params.albedo ?? new Vec3(0.95, 0.35, 0.18);
    this.metallic = params.metallic ?? 0.1;
    this.roughness = params.roughness ?? 0.35;
    this.ambient = params.ambient ?? 0.03;
  }

  setUniforms(gl: WebGL2RenderingContext): void {
    this.shader.setVec3(gl, "u_albedo", this.albedo.x, this.albedo.y, this.albedo.z);
    this.shader.setFloat(gl, "u_metallic", this.metallic);
    this.shader.setFloat(gl, "u_roughness", this.roughness);
    this.shader.setFloat(gl, "u_ambient", this.ambient);
  }
}
