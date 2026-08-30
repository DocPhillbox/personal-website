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
import cometTailVertex from './cometTail.vert.glsl?raw'
import cometTailPars from './cometTail.pars.glsl?raw'
import cometTailFragment from './cometTail.frag.glsl?raw'
import orbitRingVertex from './orbitRing.vert.glsl?raw'
import orbitRingFragment from './orbitRing.frag.glsl?raw'
import meteorVertex from './meteor.vert.glsl?raw'
import meteorFragment from './meteor.frag.glsl?raw'

export const GAS_SURFACE_PARS = `${gasSurfacePars}\n${periodicNoise}`
export const GAS_SURFACE_FRAGMENT = gasSurfaceFragment

export const SUN_SURFACE_PARS = `${sunSurfacePars}\n${periodicNoise}`
export const SUN_SURFACE_FRAGMENT = sunSurfaceFragment

export const cometTailVertexShader = cometTailVertex
export const cometTailFragmentShader = `${cometTailPars}\n${periodicNoise}\n${cometTailFragment}`

export const orbitRingVertexShader = orbitRingVertex
export const orbitRingFragmentShader = orbitRingFragment

export const meteorVertexShader = meteorVertex
export const meteorFragmentShader = meteorFragment

export { atmosphereVertexShader, atmosphereFragmentShader }
