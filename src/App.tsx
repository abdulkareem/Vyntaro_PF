import { useMemo } from 'react'
import './App.css'

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="section">
      <h2>{title}</h2>
      <div className="section-content">{children}</div>
    </section>
  )
}

export default function App() {
  const year = useMemo(() => new Date().getFullYear(), [])
  return (
    <div className="app">
      <header className="header">
        <div className="brand">Vyntaro</div>
        <nav className="nav">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#projects">Projects</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>
      <main>
        <Section id="home" title="Welcome">
          <p>Building clean, reliable software and delightful user experiences.</p>
        </Section>
        <Section id="about" title="About">
          <p>Engineer focused on front‑end, scalability, and strong UX foundations.</p>
        </Section>
        <Section id="projects" title="Projects">
          <ul className="projects">
            <li>
              <h3>Project One</h3>
              <p>Describe a featured project here with a succinct value proposition.</p>
            </li>
            <li>
              <h3>Project Two</h3>
              <p>Another project card with key tech and outcomes.</p>
            </li>
          </ul>
        </Section>
        <Section id="contact" title="Contact">
          <p>
            Reach out via <a href="mailto:contact@example.com">email</a> or find me on{' '}
            <a href="https://github.com" target="_blank">GitHub</a>.
          </p>
        </Section>
      </main>
      <footer className="footer">© {year} Vyntaro</footer>
    </div>
  )
}
