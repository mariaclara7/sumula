import { useState } from 'react'
import { Link } from 'react-router'
import { useTempos } from '../api/consultas'
import type { DesempenhoPorTempo, ResultadoTempos } from '../api/tipos'
import { Abas } from '../componentes/Abas'
import { Cartao } from '../componentes/Cartao'
import { Escudo } from '../componentes/Escudo'
import { Carregando, Erro, Vazio } from '../componentes/Estado'
import { formatarSaldo } from '../util/formato'

const cabecalho = 'px-1.5 py-2 text-xs font-medium text-texto-3 sm:px-2'
const celula = 'px-1.5 py-2 tabular-nums sm:px-2'

export function PaginaTempos() {
  const { data, isPending, isError, refetch } = useTempos()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">1º x 2º tempo</h1>
        <p className="mt-1 max-w-2xl text-sm text-texto-2">
          Quem cresce e quem cai depois do intervalo. A última coluna compara os pontos que o time fez com os que
          faria se todos os jogos terminassem no intervalo.{' '}
          <Link to="/?tempo=primeiroTempo" className="text-destaque hover:underline">
            Ver a tabela do 1º tempo
          </Link>
        </p>
      </div>

      <Cartao>
        {isPending ? (
          <Carregando />
        ) : isError ? (
          <Erro tentarDeNovo={() => refetch()} />
        ) : data.times.every((t) => t.jogos === 0) ? (
          <Vazio>Ainda não há jogos com o placar do intervalo.</Vazio>
        ) : (
          <TabelaTempos times={data.times} />
        )}
      </Cartao>

      {data?.temFaixas && <CartaoFaixas dados={data} />}
    </div>
  )
}

function TabelaTempos({ times }: { times: DesempenhoPorTempo[] }) {
  const maiorVariacao = Math.max(...times.map((t) => Math.abs(t.pontosDepoisDoIntervalo)), 1)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-borda">
          <tr>
            <th scope="col" className={`${cabecalho} text-left`}>
              Time
            </th>
            <th scope="col" className={`${cabecalho} hidden text-center md:table-cell`}>
              <abbr title="Jogos com placar do intervalo" className="no-underline">
                J
              </abbr>
            </th>
            <th scope="col" className={`${cabecalho} text-center`}>
              <abbr title="Gols marcados e sofridos no 1º tempo" className="no-underline">
                1º tempo
              </abbr>
            </th>
            <th scope="col" className={`${cabecalho} text-center`}>
              <abbr title="Gols marcados e sofridos no 2º tempo" className="no-underline">
                2º tempo
              </abbr>
            </th>
            <th scope="col" className={`${cabecalho} hidden text-center md:table-cell`}>
              Pts no intervalo
            </th>
            <th scope="col" className={`${cabecalho} hidden text-center md:table-cell`}>
              Pts
            </th>
            <th scope="col" className={`${cabecalho} hidden text-center sm:table-cell`}>
              <abbr title="Viradas a favor / viradas sofridas" className="no-underline">
                Viradas
              </abbr>
            </th>
            <th scope="col" className={`${cabecalho} text-center`}>
              <abbr title="Pontos ganhos (+) ou perdidos (−) depois do intervalo" className="no-underline">
                Depois do intervalo
              </abbr>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-borda">
          {times.map((linha) => (
            <tr key={linha.time.id} className="hover:bg-superficie-2">
              <td className="px-1.5 py-2 sm:px-2">
                <Link to={`/times/${linha.time.id}`} className="flex items-center gap-2 font-medium hover:underline">
                  <Escudo time={linha.time} />
                  <span className="max-w-[5rem] truncate sm:max-w-none">{linha.time.nomeCurto}</span>
                </Link>
              </td>
              <td className={`${celula} hidden text-center text-texto-2 md:table-cell`}>{linha.jogos}</td>
              <td className={`${celula} text-center`}>{`${linha.golsProPrimeiroTempo}:${linha.golsContraPrimeiroTempo}`}</td>
              <td className={`${celula} text-center`}>{`${linha.golsProSegundoTempo}:${linha.golsContraSegundoTempo}`}</td>
              <td className={`${celula} hidden text-center md:table-cell`}>{linha.pontosNoIntervalo}</td>
              <td className={`${celula} hidden text-center font-bold md:table-cell`}>{linha.pontos}</td>
              <td className={`${celula} hidden text-center sm:table-cell`}>
                {linha.viradasAFavor} / {linha.viradasContra}
              </td>
              <td className={celula}>
                <BarraDivergente valor={linha.pontosDepoisDoIntervalo} maximo={maiorVariacao} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Valor com sinal e uma barra a partir do centro: ganho para a direita, perda para a esquerda. */
function BarraDivergente({ valor, maximo }: { valor: number; maximo: number }) {
  const largura = `${(Math.abs(valor) / maximo) * 50}%`
  return (
    <div className="flex min-w-20 items-center gap-1.5 sm:min-w-24 sm:gap-2">
      <div className="relative h-2 flex-1 rounded-full bg-superficie-2">
        <div className="absolute inset-y-0 left-1/2 w-px bg-texto-3" />
        {valor !== 0 && (
          <div
            className={`absolute inset-y-0 ${valor > 0 ? 'left-1/2 rounded-r-full bg-serie' : 'right-1/2 rounded-l-full bg-serie-2'}`}
            style={{ width: largura }}
          />
        )}
      </div>
      <span className="w-7 text-right font-semibold tabular-nums">{formatarSaldo(valor)}</span>
    </div>
  )
}

function CartaoFaixas({ dados }: { dados: ResultadoTempos }) {
  const [tipo, setTipo] = useState<'marcados' | 'sofridos'>('marcados')
  const comFaixas = dados.times.filter((t) => t.faixas)
  const maior = Math.max(...comFaixas.flatMap((t) => t.faixas![tipo]), 1)
  const cor = tipo === 'marcados' ? 'var(--serie)' : 'var(--serie-2)'

  return (
    <Cartao>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-borda px-4 py-3">
        <h2 className="text-sm font-semibold">Gols por faixa de minuto</h2>
        <Abas
          rotulo="Gols"
          opcoes={[
            { valor: 'marcados', rotulo: 'Marcados' },
            { valor: 'sofridos', rotulo: 'Sofridos' },
          ]}
          valor={tipo}
          aoMudar={setTipo}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead className="border-b border-borda">
            <tr>
              <th scope="col" className={`${cabecalho} text-left`}>
                Time
              </th>
              {dados.rotulosFaixas.map((rotulo) => (
                <th key={rotulo} scope="col" className={`${cabecalho} whitespace-nowrap text-center`}>
                  {rotulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comFaixas.map((linha) => (
              <tr key={linha.time.id}>
                <td className="px-1.5 py-1 sm:px-2">
                  <Link to={`/times/${linha.time.id}`} className="flex items-center gap-2 font-medium hover:underline">
                    <Escudo time={linha.time} />
                    <span className="max-w-[6rem] truncate sm:max-w-none">{linha.time.nomeCurto}</span>
                  </Link>
                </td>
                {linha.faixas![tipo].map((gols, indice) => {
                  const intensidade = Math.round((gols / maior) * 75)
                  return (
                    <td key={indice} className="p-0.5">
                      <div
                        className={`min-w-8 rounded py-1.5 text-center ${intensidade > 45 ? 'font-semibold text-white' : 'text-texto'}`}
                        style={{ background: `color-mix(in oklab, ${cor} ${intensidade}%, var(--superficie-2))` }}
                      >
                        {gols}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Cartao>
  )
}
