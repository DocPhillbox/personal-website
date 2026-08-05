export default function NavList({ sections, selectedId, onSelect }) {
  return (
    <nav className="nav-list" aria-label="Sections du portfolio">
      {sections.map((s) => (
        <button
          key={s.id}
          type="button"
          className="nav-list__item"
          data-active={selectedId === s.id}
          onClick={() => onSelect(s.id)}
          aria-pressed={selectedId === s.id}
        >
          <span className="nav-list__dot" style={{ background: s.color }} />
          {s.index} · {s.label}
        </button>
      ))}
    </nav>
  )
}
