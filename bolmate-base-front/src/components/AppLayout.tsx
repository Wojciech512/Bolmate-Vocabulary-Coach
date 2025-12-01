import { Link, useLocation } from 'react-router-dom'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

const AppLayout = ({ children }: Props) => {
  const location = useLocation()

  return (
    <div className="app-shell">
      <header>
        <h1>Bolmate Base</h1>
        <nav>
          <Link className={location.pathname === '/' ? 'active' : ''} to="/">
            Start
          </Link>
          <Link className={location.pathname.startsWith('/users') ? 'active' : ''} to="/users">
            Users
          </Link>
        </nav>
      </header>
      <main>{children}</main>
      <footer>Ready-to-run Flask + React boilerplate</footer>
    </div>
  )
}

export default AppLayout
