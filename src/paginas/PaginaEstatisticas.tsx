import { useState } from 'react'
import { Link } from 'react-router'
import { useEstatisticas } from '../api/consultas'
import type { EstatisticasTime, TipoSequencia } from '../api/tipos'
import { Abas } from '../componentes/Abas'
import { CartaoDestaque } from '../componentes/CartaoDestaque'
import { Escudo } from '../componentes/Escudo'
import { Carregando, Erro, Vazio } from '../componentes/Estado'
import { Pagina } from '../componentes/Pagina'
import { Rotulo, TituloPagina } from '../componentes/TituloPagina'
import { usePreferencias } from '../preferencias'
import { ROTULO_SEQUENCIA, formatarMedia, mediaPorJogo, percentual } from '../util/estatisticas'

type Coluna = {
  chave: string
  rotulo: string
  titulo: string
  valor: (t: EstatisticasTime) => number
  exibir: (t: EstatisticasTime) => string
  /** Para colunas em que menos é melhor (gols sofridos, sem marcar...), o primeiro clique ordena do menor. */
  menorEMelhor?: boolean
}

const COLUNAS_GOLS: Coluna[] = [
  {
    chave: 'marcados',
    rotulo: 'MARC./J',
    titulo: 'Gols marcados por jogo',
    valor: (t) => mediaPorJogo(t.gols.golsPro, t.gols.jogos),
    exibir: (t) => formatarMedia(mediaPorJogo(t.gols.golsPro, t.gols.jogos)),
  },
  {
    chave: 'sofridos',
    rotulo: 'SOFR./J',
    titulo: 'Gols sofridos por jogo',
    valor: (t) => mediaPorJogo(t.gols.golsContra, t.gols.jogos),
    exibir: (t) => formatarMedia(mediaPorJogo(t.gols.golsContra, t.gols.jogos)),
    menorEMelhor: true,
  },
  {
    chave: 'semSofrer',
    rotulo: 'SEM SOFRER',
    titulo: 'Jogos sem sofrer gol',
    valor: (t) => t.gols.semSofrerGol,
    exibir: (t) => String(t.gols.semSofrerGol),
  },
  {
    chave: 'semMarcar',
    rotulo: 'SEM MARCAR',
    titulo: 'Jogos sem marcar',
    valor: (t) => t.gols.semMarcar,
    exibir: (t) => String(t.gols.semMarcar),
    menorEMelhor: true,
  },
  {
    chave: 'mais25',
    rotulo: '+2,5 GOLS',
    titulo: 'Jogos com mais de 2,5 gols',
    valor: (t) => percentual(t.gols.maisDeDoisGolsEMeio, t.gols.jogos),
    exibir: (t) => `${percentual(t.gols.maisDeDoisGolsEMeio, t.gols.jogos)}%`,
  },
  {
    chave: 'ambos',
    rotulo: 'AMBOS MARCAM',
    titulo: 'Jogos em que os dois times marcaram',
    valor: (t) => percentual(t.gols.ambosMarcam, t.gols.jogos),
    exibir: (t) => `${percentual(t.gols.ambosMarcam, t.gols.jogos)}%`,
  },
]

const TIPOS: TipoSequencia[] = ['vitorias', 'invencibilidade', 'semVencer', 'derrotas', 'marcando', 'semSofrerGol']

const sequencia = (t: EstatisticasTime, tipo: TipoSequencia) => t.sequencias.find((s) => s.tipo === tipo)!

const COLUNAS_SEQUENCIAS: Coluna[] = TIPOS.map((tipo) => ({
  chave: tipo,
  rotulo: ROTULO_SEQUENCIA[tipo].toUpperCase(),
  titulo: `${ROTULO_SEQUENCIA[tipo]}: sequência atual (maior na temporada)`,
  valor: (t) => sequencia(t, tipo).atual,
  exibir: (t) => `${sequencia(t, tipo).atual} (${sequencia(t, tipo).maior})`,
}))

type Visao = 'gols' | 'sequencias'

export function PaginaEstatisticas() {
  const { data, isPending, isError, refetch } = useEstatisticas()
  const [visao, setVisao] = useState<Visao>('gols')

  const conteudo = () => {
    if (isPending) return <Carregando />
    if (isError) return <Erro tentarDeNovo={() => refetch()} />
    if (data.liga.jogos === 0) return <Vazio>As estatísticas aparecem depois da primeira rodada.</Vazio>

    const { liga, times } = data
    const lider = (tipo: TipoSequencia, campo: 'atual' | 'maior') =>
      [...times].sort((a, b) => sequencia(b, tipo)[campo] - sequencia(a, tipo)[campo])[0]

    const invicto = lider('invencibilidade', 'atual')
    const jejum = lider('semVencer', 'atual')
    const recordeVitorias = lider('vitorias', 'maior')

    return (
      <>
        <dl className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <IndicadorLiga rotulo="GOLS POR JOGO" valor={formatarMedia(mediaPorJogo(liga.gols, liga.jogos))} />
          <IndicadorLiga rotulo="MANDANTE VENCE" valor={`${percentual(liga.vitoriasMandante, liga.jogos)}%`} />
          <IndicadorLiga rotulo="EMPATES" valor={`${percentual(liga.empates, liga.jogos)}%`} />
          <IndicadorLiga rotulo="VISITANTE VENCE" valor={`${percentual(liga.vitoriasVisitante, liga.jogos)}%`} />
          <IndicadorLiga rotulo="+2,5 GOLS" valor={`${percentual(liga.maisDeDoisGolsEMeio, liga.jogos)}%`} />
          <IndicadorLiga rotulo="AMBOS MARCAM" valor={`${percentual(liga.ambosMarcam, liga.jogos)}%`} />
        </dl>
        <p className="mt-2 text-xs text-texto-2">{liga.jogos} jogos disputados.</p>

        <div className="mt-7 grid gap-3.5 md:grid-cols-3">
          <CartaoDestaque
            escuro
            rotulo="MAIOR INVENCIBILIDADE AGORA"
            nome={invicto.time.nomeCurto}
            valor={sequencia(invicto, 'invencibilidade').atual}
          />
          <CartaoDestaque
            rotulo="MAIOR JEJUM DE VITÓRIAS"
            corRotulo="text-vermelho"
            corValor="text-vermelho"
            nome={jejum.time.nomeCurto}
            valor={sequencia(jejum, 'semVencer').atual}
          />
          <CartaoDestaque
            rotulo="RECORDE DE VITÓRIAS SEGUIDAS"
            corRotulo="text-azul"
            nome={recordeVitorias.time.nomeCurto}
            valor={sequencia(recordeVitorias, 'vitorias').maior}
          />
        </div>

        <div className="mt-9 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-black tracking-[-1px] uppercase">Por time</h2>
          <Abas
            rotulo="Tabela"
            opcoes={[
              { valor: 'gols', rotulo: 'Gols' },
              { valor: 'sequencias', rotulo: 'Sequências' },
            ]}
            valor={visao}
            aoMudar={setVisao}
          />
        </div>
        {visao === 'sequencias' && (
          <p className="mt-2 text-xs text-texto-2">
            Sequência atual e, entre parênteses, a maior da temporada. Clique no nome de uma coluna para ordenar.
          </p>
        )}
        <TabelaOrdenavel key={visao} times={times} colunas={visao === 'gols' ? COLUNAS_GOLS : COLUNAS_SEQUENCIAS} />
      </>
    )
  }

  return (
    <Pagina className="pt-9 pb-12">
      <TituloPagina>Estatísticas</TituloPagina>
      <p className="mt-[18px] max-w-[720px] text-[15px] leading-[1.55] text-pretty text-texto-2">
        Gols, placares e sequências de cada time na temporada, calculados a partir dos resultados.
      </p>
      {conteudo()}
    </Pagina>
  )
}

function IndicadorLiga({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="border-2 border-texto bg-superficie px-4 py-3">
      <dt>
        <Rotulo className="text-[11px] tracking-[1.5px] text-texto-2">{rotulo}</Rotulo>
      </dt>
      <dd className="mt-1 text-[30px] leading-[1.1] font-black tracking-[-1px] tabular-nums">{valor}</dd>
    </div>
  )
}

function TabelaOrdenavel({ times, colunas }: { times: EstatisticasTime[]; colunas: Coluna[] }) {
  const { meuTime } = usePreferencias()
  const [ordem, setOrdem] = useState<{ chave: string; crescente: boolean }>({
    chave: colunas[0].chave,
    crescente: colunas[0].menorEMelhor ?? false,
  })

  const coluna = colunas.find((c) => c.chave === ordem.chave) ?? colunas[0]
  const ordenados = [...times].sort((a, b) => {
    const diferenca = coluna.valor(a) - coluna.valor(b)
    return (ordem.crescente ? diferenca : -diferenca) || a.time.nomeCurto.localeCompare(b.time.nomeCurto, 'pt-BR')
  })

  function ordenarPor(c: Coluna) {
    setOrdem((atual) =>
      atual.chave === c.chave
        ? { chave: c.chave, crescente: !atual.crescente }
        : { chave: c.chave, crescente: c.menorEMelhor ?? false },
    )
  }

  return (
    <>
      <p className="mt-3 text-xs text-texto-2 sm:hidden">Deslize a tabela para o lado para ver todas as colunas →</p>
      <div className="mt-2 overflow-x-auto border-2 border-texto bg-superficie sm:mt-4">
        <table className="w-full min-w-[760px] text-center">
          <thead className="font-mono text-[11px] font-extrabold tracking-[1px] text-texto-2">
            <tr className="h-10 border-b-2 border-texto">
              <th scope="col" className="w-10 font-extrabold">
                #
              </th>
              <th scope="col" className="text-left font-extrabold">
                TIME
              </th>
              <th scope="col" className="hidden w-12 font-extrabold sm:table-cell">
                <abbr title="Jogos" className="no-underline">
                  J
                </abbr>
              </th>
              {colunas.map((c) => {
                const ativa = c.chave === ordem.chave
                return (
                  <th
                    key={c.chave}
                    scope="col"
                    aria-sort={ativa ? (ordem.crescente ? 'ascending' : 'descending') : 'none'}
                    className="px-1 font-extrabold"
                  >
                    <button
                      type="button"
                      title={c.titulo}
                      onClick={() => ordenarPor(c)}
                      className={`cursor-pointer px-1.5 py-1 tracking-[1px] ${ativa ? 'bg-texto text-texto-invertido' : 'hover:text-texto'}`}
                    >
                      {c.rotulo} {ativa ? (ordem.crescente ? '▲' : '▼') : ''}
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="font-mono text-[13px] font-medium tabular-nums">
            {ordenados.map((t, indice) => (
              <tr key={t.time.id} className={`h-12 border-t border-borda ${meuTime === t.time.id ? 'bg-realce' : ''}`}>
                <td className="font-sans text-base font-black">{indice + 1}</td>
                <td className="text-left">
                  <Link
                    to={`/times/${t.time.id}`}
                    className="flex items-center gap-2 font-sans text-sm font-bold hover:text-destaque"
                  >
                    <Escudo time={t.time} tamanho={24} />
                    <span className="max-w-[7rem] truncate sm:max-w-none">{t.time.nomeCurto}</span>
                  </Link>
                </td>
                <td className="hidden text-texto-2 sm:table-cell">{t.gols.jogos}</td>
                {colunas.map((c) => (
                  <td key={c.chave} className={c.chave === ordem.chave ? 'font-sans text-base font-black' : ''}>
                    {c.exibir(t)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
