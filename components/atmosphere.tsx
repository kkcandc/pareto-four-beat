"use client";

import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uMood;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

vec3 moodColor(float m) {
  vec3 cyan = vec3(0.22, 0.62, 0.78);
  vec3 violet = vec3(0.48, 0.40, 0.78);
  vec3 gold = vec3(0.86, 0.62, 0.30);
  vec3 ivory = vec3(0.93, 0.88, 0.78);
  vec3 quiet = vec3(0.28, 0.24, 0.20);
  float x = clamp(m, 0.0, 4.0);
  if (x < 1.0) return mix(cyan, violet, x);
  if (x < 2.0) return mix(violet, gold, x - 1.0);
  if (x < 3.0) return mix(gold, ivory, x - 2.0);
  return mix(ivory, quiet, x - 3.0);
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  float t = uTime;
  vec3 accent = moodColor(uMood);
  vec3 col = vec3(0.035, 0.038, 0.048);
  float n = noise(p * 1.6 + vec2(t * 0.03, -t * 0.02));
  float ribbon = smoothstep(0.55, 0.0, abs(p.y + sin(p.x * 2.2 + t * 0.18) * 0.08));
  float orbA = smoothstep(0.72, 0.0, length(p - vec2(-0.55 + sin(t * 0.2) * 0.05, 0.15)));
  float orbB = smoothstep(0.62, 0.0, length(p - vec2(0.62, -0.28 + cos(t * 0.17) * 0.04)));
  col += accent * ribbon * 0.16;
  col += accent * orbA * 0.22;
  col += accent * orbB * 0.16;
  col += vec3(0.08, 0.07, 0.05) * n * 0.35;
  float vignette = smoothstep(1.25, 0.25, length(p));
  col *= mix(0.45, 1.0, vignette);
  gl_FragColor = vec4(col, 1.0);
}
`;

export function Atmosphere({ mood }: { mood: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const moodRef = useRef(mood);
  moodRef.current = mood;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!gl) return;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertex = compile(gl.VERTEX_SHADER, VERT);
    const fragment = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vertex || !fragment) return;
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, "aPos");
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const resolution = gl.getUniformLocation(program, "uResolution");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uMood = gl.getUniformLocation(program, "uMood");

    const draw = () => {
      if (document.hidden) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, performance.now() / 1000);
      gl.uniform1f(uMood, moodRef.current);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    const timer = window.setInterval(draw, 1000 / 30);

    return () => {
      window.clearInterval(timer);
      observer.disconnect();
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.deleteBuffer(buffer);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas ref={canvasRef} className="atmosphere" aria-hidden="true" />;
}
