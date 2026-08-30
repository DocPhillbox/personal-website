// Comet dust tail. The comet itself is stationary, so all the life has to come
// from the tail: filaments drifting outward and a coma that pulses gently.
//
// vUv.x runs 0 at the nucleus to 1 at the tail tip; vUv.y runs across the width.

void main() {
  float along = clamp(vUv.x, 0.0, 1.0);
  float across = (vUv.y - 0.5) * 2.0;

  // The tail flares as it recedes, narrow and dense at the nucleus.
  float halfWidth = mix(0.07, 1.0, pow(along, 0.62));
  float radial = abs(across) / halfWidth;
  if (radial > 1.0) discard;

  // Dust streaming away from the nucleus. Scrolling along -x pushes the
  // filaments outward, which is what sells the tail as flowing material.
  float streaks = pnFbm(vec2(along * 4.5 - uTime * 0.05, across * 3.0 + 11.0), 256.0);
  float fibres = pnRidged(vec2(along * 3.2 - uTime * 0.035, across * 2.4), 256.0);

  float radialFall = pow(1.0 - radial, 1.9);
  float lengthFall = pow(1.0 - along, 1.45);
  float body = radialFall * lengthFall;

  // Modulate, never gate: the tail should thin out, not break into patches.
  float texture = mix(0.55, 1.4, streaks * 0.55 + fibres * 0.45);

  // Bright coma hugging the nucleus, slowly breathing.
  float coma = pow(1.0 - along, 9.0) * (0.85 + 0.15 * sin(uTime * 0.6));

  vec3 colour = mix(uColorInner, uColorOuter, smoothstep(0.0, 0.5, along));
  colour += uColorInner * coma * 0.9;

  float alpha = (body * texture + coma * 0.55) * uOpacity;

  gl_FragColor = vec4(colour, clamp(alpha, 0.0, 1.0));
}
