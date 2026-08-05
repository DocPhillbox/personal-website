import { motion } from 'framer-motion'

export default function InfoPanel({ section, onClose }) {
  return (
    <motion.aside
      className="panel"
      role="dialog"
      aria-label={section.label}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <button className="panel__close" onClick={onClose} aria-label="Fermer le panneau">
        ✕
      </button>

      <p className="panel__kicker" style={{ color: section.color }}>
        {section.kicker}
      </p>
      <h2 className="panel__title">{section.title}</h2>

      {section.paragraphs && (
        <>
          {section.paragraphs.map((p, i) => (
            <p className="panel__lead" key={i}>
              {p}
            </p>
          ))}
          {section.meta && (
            <div className="panel__meta">
              {section.meta.map((m) => (
                <div className="panel__meta-row" key={m.label}>
                  <span>{m.label}</span>
                  <span>{m.value}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {section.categories &&
        section.categories.map((cat) => (
          <div className="panel__category" key={cat.label}>
            <p className="panel__category-label">{cat.label.toUpperCase()}</p>
            <div className="panel__chips">
              {cat.items.map((item) => (
                <span className="panel__chip" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}

      {section.projects &&
        section.projects.map((p) => (
          <article className="panel__project" key={p.name}>
            <h3 className="panel__project-name">{p.name}</h3>
            <p className="panel__project-desc">{p.desc}</p>
            <div className="panel__chips" style={{ marginBottom: '10px' }}>
              {p.stack.map((s) => (
                <span className="panel__chip" key={s}>
                  {s}
                </span>
              ))}
            </div>
            <a className="panel__project-link" href={p.link} style={{ color: section.color }}>
              Voir le projet →
            </a>
          </article>
        ))}
    </motion.aside>
  )
}
