import { NavLink, Route, Routes } from 'react-router-dom'
import CarStunt from './components/CarStunt.jsx'
import FireStunt from './components/FireStunt.jsx'
import RoadSign from './components/RoadSign.jsx'
import { BoxPile, StuntFigure, useStunt } from './components/Stunt.jsx'

const links = [
  { to: '/ihmiset', label: 'Ihmiset' },
  { to: '/historia', label: 'Historia' },
  { to: '/yhteystiedot', label: 'Yhteystiedot' },
  { to: '/linkit', label: 'Linkit' },
]

function Header() {
  return (
    <header className="site-header">
      <NavLink to="/" className="brand">
        Suomen stunt-historia
      </NavLink>
      <nav aria-label="Päävalikko">
        <ul className="nav-list">
          {links.map(({ to, label }) => (
            <li key={to}>
              <NavLink to={to} className="nav-link">
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

function Home() {
  const stunt = useStunt()

  return (
    <section className="hero">
      <div className="hero-text">
        <h1>Avaamme tänne suomalaista stunt-historiaa käsittelevän tietopankin</h1>
        <p>Tarinoita tekijöistä ja vuosikymmenistä kotimaisen stunt-työn takaa.</p>
        <RoadSign />
      </div>
      <div className="stunt-stage">
        <StuntFigure stunt={stunt} />
        <BoxPile stunt={stunt} />
      </div>
    </section>
  )
}

function People() {
  return (
    <section className="page">
      <h1>Ihmiset</h1>
      <p>Tämä sivu on vielä työn alla.</p>
      <FireStunt />
    </section>
  )
}

function History() {
  return (
    <section className="page">
      <h1>Historia</h1>
      <p>Tämä sivu on vielä työn alla.</p>
      <CarStunt />
    </section>
  )
}

function Placeholder({ title }) {
  return (
    <section className="page">
      <h1>{title}</h1>
      <p>Tämä sivu on vielä työn alla.</p>
    </section>
  )
}

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ihmiset" element={<People />} />
          <Route path="/historia" element={<History />} />
          <Route path="/yhteystiedot" element={<Placeholder title="Yhteystiedot" />} />
          <Route path="/linkit" element={<Placeholder title="Linkit" />} />
        </Routes>
      </main>
    </>
  )
}
