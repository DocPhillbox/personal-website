export default function Header({ profile, showHint }) {
  return (
    <>
      <header className="header">
        <div>
          <p className="header__id">SYS://{profile.name.toLowerCase().replace(/\s+/g, '-')}</p>
          <h1 className="header__name">{profile.name}</h1>
          <p className="header__role">{profile.role}</p>
        </div>
        <div className="header__status" style={{ pointerEvents: 'auto' }}>
          <div>
            STATUT — <strong>{profile.status}</strong>
          </div>
          <div>{profile.location}</div>
          <div>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </div>
        </div>
      </header>

      {showHint && <p className="header__hint">CLIQUEZ SUR UNE PLANÈTE POUR EXPLORER LE SYSTÈME</p>}
    </>
  )
}
