// Replaces <map_fragment> on the sun: a boiling photosphere built from a
// churning domain warp plus granulation cells that flare and fade.
#ifdef USE_MAP

  vec2 baseUv = vMapUv;
  vec2 warpP = vec2(baseUv.x * 5.0, baseUv.y * 2.5);

  // Equirectangular UVs converge at the poles, so an unmodified warp there both
  // over-samples pinched texels and pushes v outside [0,1] into clamped edge
  // pixels — which is what reads as hard "edges" on the disc. Fade the warp out
  // before it reaches either pole.
  float poleFade = smoothstep(0.0, 0.16, baseUv.y) * smoothstep(1.0, 0.84, baseUv.y);

  float churnA = pnFbm(warpP + vec2(uTime * 0.20, uTime * 0.085), 5.0);
  float churnB = pnFbm(warpP * 1.8 + vec2(6.1, 2.7) - vec2(uTime * 0.31, 0.0), 9.0);

  // Finer, faster field driving the bright cells.
  float cells = pnFbm(warpP * 3.2 + vec2(uTime * 0.14, uTime * -0.065), 16.0);

  vec2 sunUv = baseUv;
  sunUv.x += (churnA - 0.5) * 0.095 * poleFade;
  sunUv.y += (churnB - 0.5) * 0.050 * poleFade;
  sunUv.y = clamp(sunUv.y, 0.002, 0.998);

  vec4 sampledDiffuseColor = texture2D( map, sunUv );

  // Brightness breathing across the whole disc.
  float shimmer = 0.80 + 0.28 * (churnA * 0.55 + churnB * 0.45);
  sampledDiffuseColor.rgb *= shimmer;

  // Localised flares: granulation cells brightening and cooling again.
  float hot = smoothstep(0.54, 0.86, cells * 0.6 + churnA * 0.4);
  sampledDiffuseColor.rgb += vec3(1.0, 0.58, 0.20) * hot * 0.38;

  diffuseColor *= sampledDiffuseColor;

#endif
