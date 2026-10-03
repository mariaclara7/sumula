import { AUTORIA, NOME_COMPETICAO, TEMPORADA } from '../config'
import { Logo } from './Logo'
import { Pagina } from './Pagina'

export function Rodape() {
  const links = AUTORIA.links.filter((link) => link.url)

  return (
    <footer className="mt-16 bg-grafite text-creme">
      <Pagina className="grid gap-6 py-10 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <div className="text-xl font-black tracking-[-.5px]">
            <Logo />
          </div>
          <p className="mt-2 max-w-md text-sm text-cinza">
            Estatísticas, chances e simulador do {NOME_COMPETICAO} {TEMPORADA}.
          </p>
        </div>
        {links.length > 0 && (
          <nav aria-label="Redes" className="flex flex-wrap gap-2">
            {links.map((link) => (
              <a
                key={link.rotulo}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inclinado bg-creme/10 px-4 py-2 text-sm font-bold text-creme transition-colors hover:bg-lima hover:text-grafite"
              >
                {link.rotulo} ↗
              </a>
            ))}
          </nav>
        )}
      </Pagina>
      <Pagina>
        <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-t border-cinza/20 py-4 font-mono text-[11px] text-cinza">
          <span>{AUTORIA.nome ? `Feito por ${AUTORIA.nome}` : `© ${TEMPORADA} BraSúmula`}</span>
          <span>
            Dados:{' '}
            <a href="https://www.football-data.org" target="_blank" rel="noreferrer" className="underline hover:text-creme">
              football-data.org
            </a>{' '}
            · atualizados a cada 3 horas
          </span>
        </div>
      </Pagina>
    </footer>
  )
}
