import { motion } from 'framer-motion'

export default function NavList({ sections, selectedId, onSelect }) {
  return (
    <nav className="nav-list" aria-label="Sections du portfolio">
      {sections.map((s) => {
        const active = selectedId === s.id
        return (
          <button
            key={s.id}
            type="button"
            className="nav-list__item"
            data-active={active}
            onClick={() => onSelect(s.id)}
            aria-pressed={active}
          >
            {/* A single shared element that framer-motion animates between
                buttons, rather than each button toggling its own background. */}
            {active && (
              <motion.span
                layoutId="nav-active"
                className="nav-list__highlight"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="nav-list__dot" style={{ background: s.color }} />
            <span className="nav-list__index">{s.index}</span>
            {s.label}
          </button>
        )
      })}
    </nav>
  )
}
