import { useState } from 'react'
import { useArtilharia, useClassificacao, useTimes } from '../api/consultas'
import type { Artilheiro, Time } from '../api/tipos'
import { CartaoJogador } from '../componentes/CartaoJogador'
import { Confete } from '../componentes/Confete'
import { Escudo } from '../componentes/Escudo'
import { Carregando, Erro, Vazio } from '../componentes/Estado'
import { Pagina } from '../componentes/Pagina'
import { TituloPagina } from '../componentes/TituloPagina'
import { usePreferencias } from '../preferencias'
import { contar, useAnimacao } from '../util/animacao'
import { notaDoJogador } from '../util/notas'
import { Sigla } from '../componentes/Sigla'

const COLUNAS = 'grid grid-cols-[48px_minmax(200px,1fr)_200px_64px_64px_64px]'
const cabecalho = 'font-mono text-[11px] font-extrabold tracking-[1px] text-texto-2'
// Altura dos cards do pódio no computador: o 1º é o mais alto.
const ALTURA_PODIO = ['md:min-h-[330px]', 'md:min-h-[290px]', 'md:min-h-[270px]']

export function PaginaArtilharia() {
  const artilharia = useArtilharia()
  const times = useTimes()
  const tabela = useClassificacao('geral', 'todos', 'jogoTodo')
  const { meuTime } = usePreferencias()
  const { progresso } = useAnimacao(artilharia.data !== undefined && times.data !== undefined)
  const [aberto, setAberto] = useState<number | null>(null)
  // Começa em 1: o card do artilheiro já aparece com uma rajada de confete.
  const [confete, setConfete] = useState(1)

  const conteudo = () => {
    if (artilharia.isPending || times.isPending) return <Carregando />
    if (artilharia.isError || times.isError) return <Erro tentarDeNovo={() => artilharia.refetch()} />
    if (artilharia.data.length === 0) return <Vazio>Ainda não há gols registrados.</Vazio>

    const lista = artilharia.data
    const timeDe = (a: Artilheiro) => times.data.porId.get(a.timeId)
    const maisGols = lista[0].gols

    function abrir(indice: number) {
      setAberto(indice)
      if (indice === 0) setConfete((c) => c + 1)
    }

    return (
      <>
        <div className="mt-[26px] grid items-end gap-4 md:grid-cols-3">
          {lista.slice(0, 3).map((artilheiro, indice) => (
            <CardPodio
              key={artilheiro.jogadorId}
              artilheiro={artilheiro}
              posicao={indice + 1}
              time={timeDe(artilheiro)}
              progresso={progresso}
              aoAbrir={() => abrir(indice)}
              confete={indice === 0 ? confete : 0}
            />
          ))}
        </div>

        {lista.length > 3 && (
          <div className="mt-[26px] overflow-x-auto">
            <div role="table" aria-label="Artilharia" className="min-w-[640px] pr-1.5">
              <div role="row" className={`${COLUNAS} h-9 items-center border-b-2 border-texto text-center`}>
                <span role="columnheader" className={cabecalho}>#</span>
                <span role="columnheader" className={`${cabecalho} text-left`}>JOGADOR</span>
                <span role="columnheader" className={cabecalho}>GOLS</span>
                <span role="columnheader" className={cabecalho}>
                  <Sigla dica="Assistências">ASSIST.</Sigla>
                </span>
                <span role="columnheader" className={cabecalho}>
                  <Sigla dica="Gols de pênalti">PÊN.</Sigla>
                </span>
                <span role="columnheader" className={cabecalho}>JOGOS</span>
              </div>
              {lista.slice(3).map((artilheiro, i) => {
                const indice = i + 3
                const time = timeDe(artilheiro)
                const empatadoComAnterior = lista[indice - 1].gols === artilheiro.gols
                return (
                  <div
                    key={artilheiro.jogadorId}
                    role="row"
                    className={`${COLUNAS} h-[58px] items-center border-b border-borda text-center transition-[translate] duration-200 hover:translate-x-1.5 ${
                      meuTime === artilheiro.timeId ? 'bg-realce' : ''
                    }`}
                  >
                    <span role="cell" className="text-lg font-black">{empatadoComAnterior ? '' : indice + 1}</span>
                    <div role="cell" className="text-left">
                      <button
                        type="button"
                        onClick={() => abrir(indice)}
                        className="flex w-full cursor-pointer items-center gap-2.5 text-left"
                      >
                        {time && <Escudo time={time} tamanho={30} />}
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] font-bold hover:text-destaque">{artilheiro.nome}</span>
                          {time && <span className="block text-xs text-texto-2">{time.nomeCurto}</span>}
                        </span>
                      </button>
                    </div>
                    <div role="cell" className="flex items-center gap-2.5 px-2.5">
                      <div className="h-2 flex-1 bg-superficie-2">
                        <div className="h-full bg-texto" style={{ width: `${(artilheiro.gols / maisGols) * 100 * progresso}%` }} />
                      </div>
                      <span className="w-6 text-lg font-black">{artilheiro.gols}</span>
                    </div>
                    <span role="cell" className="font-mono text-[13px] font-medium">{artilheiro.assistencias ?? '—'}</span>
                    <span role="cell" className="font-mono text-[13px] font-medium">{artilheiro.penaltis || '—'}</span>
                    <span role="cell" className="font-mono text-[13px] font-medium text-texto-2">{artilheiro.jogos ?? '—'}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {aberto !== null && lista[aberto] && (
          <CartaoJogador
            artilheiro={lista[aberto]}
            posicao={aberto + 1}
            time={timeDe(lista[aberto])}
            golsDoTime={tabela.data?.linhas.find((l) => l.time.id === lista[aberto].timeId)?.golsPro}
            aoFechar={() => setAberto(null)}
          />
        )}
      </>
    )
  }

  return (
    <Pagina className="pt-9 pb-12">
      <TituloPagina>Artilharia</TituloPagina>
      <p className="mt-3.5 text-[15px] text-texto-2">Toque em um jogador para ver o card completo.</p>
      {conteudo()}
    </Pagina>
  )
}

type PropsPodio = {
  artilheiro: Artilheiro
  posicao: number
  time: Time | undefined
  progresso: number
  aoAbrir: () => void
  confete: number
}

function CardPodio({ artilheiro, posicao, time, progresso, aoAbrir, confete }: PropsPodio) {
  const primeiro = posicao === 1
  const destaque = primeiro ? 'text-lima' : 'text-texto'

  return (
    <button
      type="button"
      onClick={aoAbrir}
      aria-label={`${posicao}º: ${artilheiro.nome}, ${artilheiro.gols} gols. Ver o card completo.`}
      className={`corte-duplo-p relative flex min-h-[250px] cursor-pointer flex-col justify-between overflow-hidden p-[22px] text-left transition-transform duration-[250ms] hover:-translate-y-1.5 ${ALTURA_PODIO[posicao - 1]} ${
        primeiro ? 'bg-grafite text-creme' : 'bg-superficie text-texto'
      }`}
    >
      <div className="flex w-full items-start justify-between">
        <div className="flex flex-col leading-[.9]">
          <span className="text-[52px] font-black tracking-[-2px]">{contar(notaDoJogador(artilheiro), progresso)}</span>
          <span className="font-mono text-xs font-extrabold tracking-[2px]">ATA</span>
        </div>
        <span aria-hidden className="text-[64px] leading-none font-black opacity-[.18]">
          {posicao}
        </span>
      </div>
      <div className="w-full">
        <div className="text-[26px] leading-[1.05] font-black tracking-[-.5px]">{artilheiro.nome}</div>
        {time && (
          <div className="mt-2 flex items-center gap-2 text-[13px] font-bold">
            <Escudo time={time} tamanho={22} circulo contorno={`0 0 0 1.5px ${primeiro ? '#f2f1ec' : 'var(--texto)'}`} />
            {time.nomeCurto}
          </div>
        )}
        <div className={`mt-4 grid grid-cols-3 gap-2 border-t-2 pt-2.5 ${primeiro ? 'border-lima' : 'border-texto'}`}>
          <div>
            <div className={`text-[30px] font-black ${destaque}`}>{contar(artilheiro.gols, progresso)}</div>
            <div className="text-[11px] opacity-70">gols</div>
          </div>
          <div>
            <div className="text-[30px] font-black">{artilheiro.assistencias ?? '—'}</div>
            <div className="text-[11px] opacity-70">assist.</div>
          </div>
          <div>
            <div className="text-[30px] font-black">{artilheiro.jogos ?? '—'}</div>
            <div className="text-[11px] opacity-70">jogos</div>
          </div>
        </div>
      </div>
      {primeiro && <Confete disparo={confete} />}
    </button>
  )
}
