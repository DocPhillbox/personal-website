uniform vec3 uColor;
uniform float uIntensity;
uniform float uPower;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float facing = abs(dot(viewDir, normalize(vWorldNormal)));
  float rim = pow(1.0 - facing, uPower);

  gl_FragColor = vec4(uColor, rim * uIntensity);
}
