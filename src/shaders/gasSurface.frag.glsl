// Replaces <map_fragment> on the gas giant so its cloud deck flows.
#ifdef USE_MAP

  vec2 baseUv = vMapUv;

  // Uniform drift shifts every latitude by the same amount, so it rotates the
  // whole deck without ever destroying structure, however long it runs.
  float drift = mod(uTime * 0.030, 1.0);

  // Differential rotation must OSCILLATE rather than accumulate. An unbounded
  // per-latitude offset eventually shears neighbouring rows so far apart that
  // all vertical features smear away and only horizontal stripes are left.
  // Two out-of-phase components keep the slip from looking metronomic.
  float jetA = sin(baseUv.y * 16.0);
  float jetB = sin(baseUv.y * 27.0 + 1.7);
  float shear = sin(uTime * 0.100) * 0.075 * jetA
              + sin(uTime * 0.062 + 2.1) * 0.045 * jetB;

  // Iterative domain warp: warping the warp is what turns a bland scroll into
  // visible eddies rolling along the bands. `q` is itself periodic in x, so
  // feeding it back in keeps the whole field seamless across u = 0.
  vec2 warpP = vec2(baseUv.x * 6.0, baseUv.y * 3.0);
  vec2 q = vec2(
    pnFbm(warpP + vec2(uTime * 0.045, uTime * 0.018), 6.0),
    pnFbm(warpP + vec2(5.2, 1.3) + vec2(uTime * 0.032, 0.0), 6.0)
  );
  vec2 r = vec2(
    pnFbm(warpP + 3.0 * q + vec2(1.7, 9.2) + vec2(uTime * 0.070, 0.0), 6.0),
    pnFbm(warpP + 3.0 * q + vec2(8.3, 2.8) - vec2(uTime * 0.055, 0.0), 6.0)
  );

  vec2 gasUv = baseUv;
  gasUv.x += drift + shear + (r.x - 0.5) * 0.130;
  gasUv.y += (r.y - 0.5) * 0.030;

  vec4 sampledDiffuseColor = texture2D( map, gasUv );

  // Shade the eddies so they read as depth rather than as a sliding texture.
  float relief = 0.86 + 0.28 * r.x;
  sampledDiffuseColor.rgb *= relief;

  diffuseColor *= sampledDiffuseColor;

#endif
