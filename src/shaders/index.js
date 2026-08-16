// GLSL lives in .glsl files; Vite's `?raw` suffix imports them as strings.
// The only assembly done here is prepending the shared noise library to the
// shaders that call into it, since raw imports have no #include mechanism.
import periodicNoise from './lib/periodicNoise.glsl?raw'
import gasSurfacePars from './gasSurface.pars.glsl?raw'
import gasSurfaceFragment from './gasSurface.frag.glsl?raw'
import sunSurfacePars from './sunSurface.pars.glsl?raw'
import sunSurfaceFragment from './sunSurface.frag.glsl?raw'
import atmosphereVertexShader from './atmosphere.vert.glsl?raw'
import atmosphereFragmentShader from './atmosphere.frag.glsl?raw'

export const GAS_SURFACE_PARS = `${gasSurfacePars}\n${periodicNoise}`
export const GAS_SURFACE_FRAGMENT = gasSurfaceFragment

export const SUN_SURFACE_PARS = `${sunSurfacePars}\n${periodicNoise}`
export const SUN_SURFACE_FRAGMENT = sunSurfaceFragment

export { atmosphereVertexShader, atmosphereFragmentShader }
