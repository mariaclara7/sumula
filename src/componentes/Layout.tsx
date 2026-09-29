import { NavLink, Outlet } from 'react-router'
import { NOME_COMPETICAO, TEMPORADA } from '../config'

const LINKS = [
  { para: '/', rotulo: 'Classificação' },
  { para: '/chances', rotulo: 'Chances' },
  { para: '/confronto', rotulo: 'Confronto direto' },
  { para: '/artilharia', rotulo: 'Artilharia' },
]

export function Layout() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-borda bg-superficie">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <NavLink to="/" className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-destaque">Súmula</span>
            <span className="text-xs text-texto-3">
              {NOME_COMPETICAO} {TEMPORADA}
            </span>
          </NavLink>
          <nav className="-mx-1 flex gap-1 overflow-x-auto">
            {LINKS.map((link) => (
              <NavLink
                key={link.para}
                to={link.para}
                end
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium ${
                    isActive ? 'bg-superficie-2 text-texto' : 'text-texto-2 hover:text-texto'
                  }`
                }
              >
                {link.rotulo}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-8 text-xs text-texto-3">
        Dados: football-data.org
      </footer>
    </div>
  )
}
