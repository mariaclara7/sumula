import { useRef } from 'react'
import { Link, useNavigate } from 'react-router'
import type { LinhaClassificacao } from '../api/tipos'
import { zonaDaPosicao } from '../config'
import { contar } from '../util/animacao'
import { formatarPercentual, formatarSaldo } from '../util/formato'
import { faixaDaNota, notaDoTime } from '../util/notas'
import { Escudo } from './Escudo'
import { FormaRecente } from './FormaRecente'
import { LegendaZonas } from './LegendaZonas'
import { useDeslizar } from './useDeslizar'

type Props = {
  linhas: LinhaClassificacao[]
  /** As faixas de Libertadores/rebaixamento só fazem sentido na tabela com todos os jogos. */
  mostrarZonas: boolean
  /** Posição de cada time na tabela normal, para mostrar ▲▼ quando um filtro muda a ordem. */
  posicaoNormal?: Map<number, number>
  /** Linha destacada ("meu time"). */
  destaque?: number | null
  /** 0 a 1: números contam e barras crescem junto com a animação da página. */
  progresso?: number
}

// No celular ficam só posição, time, pontos e forma; o resto aparece a partir do tablet.
const COLUNAS =
  'grid grid-cols-[40px_minmax(0,1fr)_40px_104px] md:grid-cols-[64px_minmax(0,1fr)_64px_60px_44px_110px_48px_48px_56px_150px_150px]'
const SO_TABLET = 'hidden md:flex'

export function TabelaClassificacao({ linhas, mostrarZonas, posicaoNormal, destaque, progresso = 1 }: Props) {
  const navegar = useNavigate()
  const corpo = useRef<HTMLDivElement>(null)
  useDeslizar(corpo, linhas.map((l) => l.time.id).join())

  return (
    <div>
      <div className="overflow-x-auto">
        {/* md:pr-1.5: espaço para a linha deslizar no hover sem criar barra de rolagem. */}
        <div role="table" aria-label="Classificação" className="md:min-w-[1000px] md:pr-1.5">
          <div
            role="row"
            className={`${COLUNAS} h-8 items-center border-b-2 border-texto text-center font-mono text-[10px] font-extrabold tracking-[1px] text-texto-2 md:h-9 md:text-[11px]`}
          >
            <span role="columnheader" className="pl-2.5 text-left md:pl-0 md:text-center">
              <abbr title="Posição" className="no-underline">#</abbr>
            </span>
            <span role="columnheader" className="text-left">TIME</span>
            <span role="columnheader" className={`${SO_TABLET} justify-center`}>
              <abbr title="Nota geral, a partir do aproveitamento" className="no-underline">OVR</abbr>
            </span>
            <span role="columnheader">
              <abbr title="Pontos" className="no-underline">PTS</abbr>
            </span>
            <span role="columnheader" className={`${SO_TABLET} justify-center`}>
              <abbr title="Jogos" className="no-underline">J</abbr>
            </span>
            <span role="columnheader" className={`${SO_TABLET} justify-center`}>
              <abbr title="Vitórias, empates e derrotas" className="no-underline">V · E · D</abbr>
            </span>
            <span role="columnheader" className={`${SO_TABLET} justify-center`}>
              <abbr title="Gols pró" className="no-underline">GP</abbr>
            </span>
            <span role="columnheader" className={`${SO_TABLET} justify-center`}>
              <abbr title="Gols contra" className="no-underline">GC</abbr>
            </span>
            <span role="columnheader" className={`${SO_TABLET} justify-center`}>
              <abbr title="Saldo de gols" className="no-underline">SG</abbr>
            </span>
            <span role="columnheader" className={`${SO_TABLET} justify-center`}>
              <abbr title="Aproveitamento" className="no-underline">APROV.</abbr>
            </span>
            <span role="columnheader">FORMA</span>
          </div>

          <div ref={corpo} role="rowgroup">
            {linhas.map((linha) => {
              const zona = mostrarZonas ? zonaDaPosicao(linha.posicao) : undefined
              const nota = notaDoTime(linha.aproveitamento)
              const normal = posicaoNormal?.get(linha.time.id)
              const variacao = normal === undefined ? 0 : normal - linha.posicao

              return (
                <div
                  key={linha.time.id}
                  role="row"
                  data-deslizar={linha.time.id}
                  onClick={() => navegar(`/times/${linha.time.id}`)}
                  className={`${COLUNAS} h-14 cursor-pointer items-center border-b border-borda text-center transition-[translate] duration-200 md:hover:translate-x-1.5 ${
                    destaque === linha.time.id ? 'bg-realce' : ''
                  }`}
                >
                  <div role="cell" className="flex h-full items-center gap-2 md:gap-3">
                    <span
                      title={zona?.nome}
                      className={`h-full w-1 md:w-1.5 ${zona?.cor ?? 'bg-transparent'}`}
                    />
                    <span className="text-[17px] font-black md:text-[22px] md:tracking-[-1px]">{linha.posicao}</span>
                  </div>
                  <div role="cell" className="flex min-w-0 items-center gap-2 text-left md:gap-3">
                    <Escudo time={linha.time} tamanho={28} />
                    <Link
                      to={`/times/${linha.time.id}`}
                      onClick={(evento) => evento.stopPropagation()}
                      className="truncate text-sm font-bold hover:text-destaque md:text-base"
                    >
                      {linha.time.nomeCurto}
                    </Link>
                    {variacao !== 0 && (
                      <span
                        title={`${variacao > 0 ? 'Sobe' : 'Cai'} ${Math.abs(variacao)} em relação à tabela normal`}
                        className={`font-mono text-[11px] font-extrabold whitespace-nowrap md:text-xs ${variacao > 0 ? 'text-verde' : 'text-vermelho'}`}
                      >
                        {variacao > 0 ? `▲${variacao}` : `▼${-variacao}`}
                      </span>
                    )}
                  </div>
                  <div role="cell" className={`${SO_TABLET} justify-center`}>
                    <span
                      title={`Faixa ${faixaDaNota(nota).nome.toLowerCase()}`}
                      className={`inclinado-p grid h-[26px] w-10 place-items-center text-sm font-black text-grafite ${faixaDaNota(nota).cor}`}
                    >
                      {contar(nota, progresso)}
                    </span>
                  </div>
                  <span role="cell" className="text-lg font-black tabular-nums md:text-[22px]">
                    {contar(linha.pontos, progresso)}
                  </span>
                  <span role="cell" className={`${SO_TABLET} justify-center font-mono text-[13px] font-medium text-texto-2`}>
                    {linha.jogos}
                  </span>
                  <span role="cell" className={`${SO_TABLET} justify-center font-mono text-[13px] font-medium`}>
                    {`${linha.vitorias} · ${linha.empates} · ${linha.derrotas}`}
                  </span>
                  <span role="cell" className={`${SO_TABLET} justify-center font-mono text-[13px] font-medium`}>
                    {linha.golsPro}
                  </span>
                  <span role="cell" className={`${SO_TABLET} justify-center font-mono text-[13px] font-medium text-texto-2`}>
                    {linha.golsContra}
                  </span>
                  <span role="cell" className={`${SO_TABLET} justify-center font-mono text-[13px] font-medium`}>
                    {formatarSaldo(linha.saldo)}
                  </span>
                  <div role="cell" className={`${SO_TABLET} items-center gap-2.5 px-2`}>
                    <div className="h-2 flex-1 bg-superficie-2">
                      <div className="h-full bg-texto" style={{ width: `${linha.aproveitamento * progresso}%` }} />
                    </div>
                    <span className="w-11 text-right font-mono text-xs font-medium text-texto-2">
                      {formatarPercentual(linha.aproveitamento)}
                    </span>
                  </div>
                  <div role="cell" className="flex justify-center">
                    <span className="md:hidden">
                      <FormaRecente resultados={linha.ultimosResultados} tamanho="p" />
                    </span>
                    <span className="hidden md:block">
                      <FormaRecente resultados={linha.ultimosResultados} />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {mostrarZonas && <LegendaZonas />}
    </div>
  )
}
