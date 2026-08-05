import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import './App.css'
import Scene from './components/Scene.jsx'
import Header from './components/Header.jsx'
import NavList from './components/NavList.jsx'
import InfoPanel from './components/InfoPanel.jsx'
import { PROFILE, SECTIONS } from './data/content.js'

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
  const reducedMotion = useReducedMotion()

  const selectedSection = useMemo(() => SECTIONS.find((s) => s.id === selectedId) || null, [selectedId])

  const handleSelect = (id) => setSelectedId(id)
  const handleClose = () => setSelectedId(null)

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
      <Scene
        sections={SECTIONS}
        selectedId={selectedId}
        onSelect={handleSelect}
        onClose={handleClose}
        reducedMotion={reducedMotion}
      />

      <Header profile={PROFILE} showHint={!selectedId} />
      <NavList sections={SECTIONS} selectedId={selectedId} onSelect={handleSelect} />

      <AnimatePresence>
        {selectedSection && <InfoPanel section={selectedSection} onClose={handleClose} />}
      </AnimatePresence>
    </div>
  )
}
