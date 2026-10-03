import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useTimes } from '../api/consultas'
import { NOME_COMPETICAO, TEMPORADA } from '../config'
import { usePreferencias } from '../preferencias'
import { Escudo } from './Escudo'
import { Logo } from './Logo'
import { Pagina } from './Pagina'
import { Rodape } from './Rodape'
import { Seletor } from './Seletor'

const LINKS = [
  { para: '/', rotulo: 'Classificação' },
  { para: '/simulador', rotulo: 'Simulador' },
  { para: '/chances', rotulo: 'Chances' },
  { para: '/estatisticas', rotulo: 'Estatísticas' },
  { para: '/evolucao', rotulo: 'Evolução' },
  { para: '/tempos', rotulo: '1º x 2º tempo' },
  { para: '/confronto', rotulo: 'Comparador' },
  { para: '/artilharia', rotulo: 'Artilharia' },
]

export function Layout() {
  const { pathname } = useLocation()

  // Troca de página começa do topo (trocar só o filtro da URL não mexe na rolagem).
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 bg-grafite text-creme">
        <Pagina className="flex h-[60px] items-center gap-2 sm:gap-4">
          <Link to="/" className="shrink-0 text-xl font-black tracking-[-.5px] hover:text-creme sm:text-2xl">
            <Logo />
          </Link>
          <span className="hidden text-xs text-cinza md:inline">
            {NOME_COMPETICAO} {TEMPORADA}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <SeletorMeuTime />
            <BotaoTema />
          </div>
        </Pagina>
        <Pagina>
          <nav className="flex gap-1 overflow-x-auto pb-3 [scrollbar-width:none]">
            {LINKS.map((link) => (
              <NavLink
                key={link.para}
                to={link.para}
                end
                className={({ isActive }) =>
                  `inclinado flex-none px-3.5 py-2 text-sm font-bold transition-[background-color,color,transform] duration-200 hover:-translate-y-px ${
                    isActive ? 'bg-lima text-grafite hover:text-grafite' : 'text-cinza hover:text-creme'
                  }`
                }
              >
                {link.rotulo}
              </NavLink>
            ))}
          </nav>
        </Pagina>
      </header>

      <main key={pathname} className="flex-1 animate-entrada">
        <Outlet />
      </main>

      <Rodape />
    </div>
  )
}

function SeletorMeuTime() {
  const { meuTime, escolherMeuTime } = usePreferencias()
  const times = useTimes()
  const time = meuTime === null ? undefined : times.data?.porId.get(meuTime)
  const opcoes = [...(times.data?.lista ?? [])].sort((a, b) => a.nomeCurto.localeCompare(b.nomeCurto, 'pt-BR'))

  return (
    <Seletor
      rotulo="Meu time (fica destacado nas tabelas)"
      alinhar="direita"
      valor={meuTime}
      aoMudar={escolherMeuTime}
      opcoes={[
        { valor: null, rotulo: 'Nenhum', icone: <span aria-hidden className="size-5 rounded-full border-2 border-dashed border-texto-2" /> },
        ...opcoes.map((opcao) => ({ valor: opcao.id, rotulo: opcao.nomeCurto, icone: <Escudo time={opcao} tamanho={20} circulo /> })),
      ]}
      className="flex items-center gap-2 rounded-full border border-linha-escura py-1 pr-3 pl-1 text-[13px] transition-colors hover:border-lima focus-visible:border-lima focus-visible:outline-none aria-expanded:border-lima"
    >
      {time ? (
        <Escudo time={time} tamanho={26} circulo />
      ) : (
        <span aria-hidden className="size-[26px] rounded-full border-2 border-dashed border-linha-escura" />
      )}
      <span className="hidden text-cinza md:inline">Meu time</span>
      <span className="max-w-28 truncate font-extrabold">{time?.nomeCurto ?? 'Escolher'}</span>
    </Seletor>
  )
}

function BotaoTema() {
  const { tema, alternarTema } = usePreferencias()
  const escuro = tema === 'escuro'

  return (
    <button
      type="button"
      onClick={alternarTema}
      aria-label={escuro ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
      className="flex h-9 flex-none cursor-pointer items-center gap-2 rounded-full border border-linha-escura px-3 text-xs font-bold transition-[border-color,transform] duration-200 hover:border-lima active:scale-[.94]"
    >
      <span
        aria-hidden
        className={`size-3.5 rounded-full border-2 border-lima transition-colors duration-300 ${escuro ? 'bg-lima' : 'bg-transparent'}`}
      />
      {/* Em celulares bem estreitos fica só a bolinha; o aria-label continua dizendo o que o botão faz. */}
      <span className="hidden min-[360px]:inline">{escuro ? 'Claro' : 'Escuro'}</span>
    </button>
  )
}
