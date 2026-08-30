import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import './App.css'
import Scene from './components/Scene.jsx'
import Header from './components/Header.jsx'
import NavList from './components/NavList.jsx'
import InfoPanel from './components/InfoPanel.jsx'
import { PROFILE, SECTIONS } from './data/content.js'

/** Runs `flag(true)` on the next frame, or on a timer if frames are not coming. */
function deferOnce(flag) {
  let settled = false
  const run = () => {
    if (settled) return
    settled = true
    flag(true)
  }
  const frame = requestAnimationFrame(run)
  const timer = setTimeout(run, 120)
  return () => {
    cancelAnimationFrame(frame)
    clearTimeout(timer)
  }
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

export default function App() {
  const [selectedId, setSelectedId] = useState(null)
  const [sceneMounted, setSceneMounted] = useState(false)
  const [bootDone, setBootDone] = useState(false)
  const reducedMotion = useReducedMotion()

  const selectedSection = useMemo(() => SECTIONS.find((s) => s.id === selectedId) || null, [selectedId])

  const handleSelect = (id) => setSelectedId(id)
  const handleClose = () => setSelectedId(null)

  // Building the planet textures costs a few hundred milliseconds of synchronous
  // work. Deferring the scene by a frame lets the boot screen paint first, so
  // that cost lands behind a deliberate state instead of a blank window.
  //
  // rAF alone is not enough: it is paused in background tabs and whenever the
  // page is not compositing, which would strand the visitor on the boot screen.
  // Timers keep running there, so whichever fires first wins.
  useEffect(() => deferOnce(setSceneMounted), [])

  useEffect(() => {
    if (!sceneMounted) return undefined
    return deferOnce(setBootDone)
  }, [sceneMounted])

  // Synchronise la sélection avec le hash de l'URL (liens partageables, ex: #projets)
  useEffect(() => {
    const fromHash = window.location.hash.replace('#', '')
    if (SECTIONS.some((s) => s.id === fromHash)) setSelectedId(fromHash)
  }, [])

  useEffect(() => {
    const newHash = selectedId ? `#${selectedId}` : ' '
    window.history.replaceState(null, '', newHash.trim() === '' ? window.location.pathname : newHash)
  }, [selectedId])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app">
      {sceneMounted && (
        <Scene
          sections={SECTIONS}
          selectedId={selectedId}
          onSelect={handleSelect}
          onClose={handleClose}
          reducedMotion={reducedMotion}
        />
      )}

      <Header profile={PROFILE} showHint={!selectedId} />
      <NavList sections={SECTIONS} selectedId={selectedId} onSelect={handleSelect} />

      <AnimatePresence>
        {selectedSection && <InfoPanel section={selectedSection} onClose={handleClose} />}
      </AnimatePresence>

      <div className="boot" data-hidden={bootDone} aria-hidden={bootDone}>
        <p className="boot__mark">Initialisation du système</p>
        <div className="boot__bar" />
      </div>
    </div>
  )
}
