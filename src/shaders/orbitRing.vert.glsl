varying vec2 vLocal;

void main() {
  // RingGeometry is authored in the XY plane; the mesh is laid flat by its own
  // rotation, so the raw attribute still gives us clean ring-space coordinates.
  vLocal = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
