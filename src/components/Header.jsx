export default function Header({ profile, showHint }) {
  return (
    <>
      <header className="header">
        <div>
          <h1 className="header__name">{profile.name}</h1>
          <p className="header__role">{profile.role}</p>
        </div>

        <div className="header__status">
          <span className="header__badge">{profile.status}</span>
          <span>{profile.location}</span>
          <a className="header__mail" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
        </div>
      </header>

      {showHint && <p className="header__hint">Sélectionnez une planète</p>}
    </>
  )
}
