// Builds the material props needed to swap three's <map_fragment> chunk for
// custom GLSL, dropping declarations (uniforms, helper functions) next to
// <common> so they sit at global scope in the fragment shader.
//
// `key` matters more than it looks. three caches compiled programs and, by
// default, `Material.customProgramCacheKey()` returns `onBeforeCompile.toString()`.
// Every callback built here has identical source text — the GLSL lives in
// closure variables, which don't appear in toString() — so without an explicit
// key two materials of the same class would silently share one program and one
// of them would render with the other's shader.
//
// The returned callback identity must also stay stable across renders or three
// recompiles every frame, so callers should memoise the result.
export function animateMapFragment({ key, pars, fragment, uniforms }) {
  if (!key) throw new Error('animateMapFragment requires a unique `key` for the program cache')

  return {
    onBeforeCompile: (shader) => {
      Object.assign(shader.uniforms, uniforms)
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${pars}`)
        .replace('#include <map_fragment>', fragment)
    },
    customProgramCacheKey: () => key,
  }
}
