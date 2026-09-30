import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTempos } from '../api/consultas'
import type { DesempenhoPorTempo, ResultadoTempos } from '../api/tipos'
import { Abas } from '../componentes/Abas'
import { Cartao } from '../componentes/Cartao'
import { CartaoDestaque } from '../componentes/CartaoDestaque'
import { Escudo } from '../componentes/Escudo'
import { Carregando, Erro, Vazio } from '../componentes/Estado'
import { Pagina } from '../componentes/Pagina'
import { TituloPagina } from '../componentes/TituloPagina'
import { usePreferencias } from '../preferencias'
import { contar, useAnimacao } from '../util/animacao'
import { formatarSaldo } from '../util/formato'

const COLUNAS = 'grid grid-cols-[minmax(170px,1fr)_44px_90px_90px_110px_56px_80px_240px]'
const cabecalho = 'px-1.5 py-2 font-mono text-[11px] font-extrabold tracking-[1px] text-texto-2 sm:px-2'

export function PaginaTempos() {
  const { data, isPending, isError, refetch } = useTempos()
  const { progresso } = useAnimacao(data !== undefined)

  const semJogos = data?.times.every((t) => t.jogos === 0)

  return (
    <Pagina className="pt-9 pb-12">
      <TituloPagina>1º x 2º tempo</TituloPagina>
      <p className="mt-[18px] max-w-[720px] text-[15px] leading-[1.55] text-pretty text-texto-2">
        Quem cresce e quem cai depois do intervalo. A última coluna compara os pontos que o time fez com os que faria
        se todos os jogos terminassem no intervalo.{' '}
        <Link to="/?tempo=primeiroTempo" className="font-bold text-destaque underline">
          Ver a tabela do 1º tempo
        </Link>
      </p>

      {isPending ? (
        <Carregando />
      ) : isError ? (
        <Erro tentarDeNovo={() => refetch()} />
      ) : semJogos ? (
        <Vazio>Ainda não há jogos com o placar do intervalo.</Vazio>
      ) : (
        <>
          <Destaques times={data.times} progresso={progresso} />
          <TabelaTempos times={data.times} progresso={progresso} />
          {data.temFaixas && <CartaoFaixas dados={data} />}
        </>
      )}
    </Pagina>
  )
}

function Destaques({ times, progresso }: { times: DesempenhoPorTempo[]; progresso: number }) {
  const porVariacao = [...times].sort((a, b) => b.pontosDepoisDoIntervalo - a.pontosDepoisDoIntervalo)
  const cresce = porVariacao[0]
  const some = porVariacao[porVariacao.length - 1]
  const virador = [...times].sort((a, b) => b.viradasAFavor - a.viradasAFavor)[0]

  return (
    <div className="mt-7 grid gap-3.5 md:grid-cols-3">
      <CartaoDestaque
        escuro
        rotulo="CRESCE NO 2º TEMPO"
        nome={cresce.time.nomeCurto}
        valor={formatarSaldo(contar(cresce.pontosDepoisDoIntervalo, progresso))}
      />
      <CartaoDestaque
        rotulo="SOME NO 2º TEMPO"
        corRotulo="text-vermelho"
        corValor="text-vermelho"
        nome={some.time.nomeCurto}
        valor={formatarSaldo(contar(some.pontosDepoisDoIntervalo, progresso))}
      />
      <CartaoDestaque
        rotulo="REI DA VIRADA"
        corRotulo="text-azul"
        nome={virador.time.nomeCurto}
        valor={contar(virador.viradasAFavor, progresso)}
      />
    </div>
  )
}

function TabelaTempos({ times, progresso }: { times: DesempenhoPorTempo[]; progresso: number }) {
  const { meuTime } = usePreferencias()
  const navegar = useNavigate()
  const ordenados = [...times].sort((a, b) => b.pontosDepoisDoIntervalo - a.pontosDepoisDoIntervalo)
  const maiorVariacao = Math.max(...times.map((t) => Math.abs(t.pontosDepoisDoIntervalo)), 1)
  const celula = 'font-mono text-[13px] font-medium'

  return (
    <div className="mt-7 overflow-x-auto">
      <div role="table" aria-label="Desempenho por tempo de jogo" className="min-w-[900px]">
        <div role="row" className={`${COLUNAS} h-9 items-center border-b-2 border-texto text-center`}>
          <span role="columnheader" className={`${cabecalho} text-left`}>TIME</span>
          <span role="columnheader" className={cabecalho}>
            <abbr title="Jogos com placar do intervalo" className="no-underline">J</abbr>
          </span>
          <span role="columnheader" className={cabecalho}>
            <abbr title="Gols marcados e sofridos no 1º tempo" className="no-underline">1º TEMPO</abbr>
          </span>
          <span role="columnheader" className={cabecalho}>
            <abbr title="Gols marcados e sofridos no 2º tempo" className="no-underline">2º TEMPO</abbr>
          </span>
          <span role="columnheader" className={cabecalho}>
            <abbr title="Pontos se os jogos terminassem no intervalo" className="no-underline">PTS NO INT.</abbr>
          </span>
          <span role="columnheader" className={cabecalho}>PTS</span>
          <span role="columnheader" className={cabecalho}>
            <abbr title="Viradas a favor / viradas sofridas" className="no-underline">VIRADAS</abbr>
          </span>
          <span role="columnheader" className={cabecalho}>
            <abbr title="Pontos ganhos (+) ou perdidos (−) depois do intervalo" className="no-underline">
              DEPOIS DO INTERVALO
            </abbr>
          </span>
        </div>
        {ordenados.map((linha) => (
          <div
            key={linha.time.id}
            role="row"
            onClick={() => navegar(`/times/${linha.time.id}`)}
            className={`${COLUNAS} h-[50px] cursor-pointer items-center border-b border-borda text-center transition-[translate] duration-200 hover:translate-x-1.5 ${
              meuTime === linha.time.id ? 'bg-realce' : ''
            }`}
          >
            <div role="cell" className="flex min-w-0 items-center gap-2.5 text-left">
              <Escudo time={linha.time} tamanho={28} />
              <Link
                to={`/times/${linha.time.id}`}
                onClick={(evento) => evento.stopPropagation()}
                className="truncate text-[15px] font-bold hover:text-destaque"
              >
                {linha.time.nomeCurto}
              </Link>
            </div>
            <span role="cell" className={`${celula} text-texto-2`}>{linha.jogos}</span>
            <span role="cell" className={celula}>{`${linha.golsProPrimeiroTempo}:${linha.golsContraPrimeiroTempo}`}</span>
            <span role="cell" className={celula}>{`${linha.golsProSegundoTempo}:${linha.golsContraSegundoTempo}`}</span>
            <span role="cell" className={celula}>{linha.pontosNoIntervalo}</span>
            <span role="cell" className="text-lg font-black">{linha.pontos}</span>
            <span role="cell" className={celula}>
              {linha.viradasAFavor} / {linha.viradasContra}
            </span>
            <div role="cell" className="px-2">
              <BarraDivergente valor={linha.pontosDepoisDoIntervalo} maximo={maiorVariacao} progresso={progresso} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Valor com sinal e uma barra a partir do centro: ganho para a direita, perda para a esquerda. */
function BarraDivergente({ valor, maximo, progresso }: { valor: number; maximo: number; progresso: number }) {
  const largura = `${(Math.abs(valor) / maximo) * 50 * progresso}%`
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative h-2.5 flex-1 bg-superficie-2">
        <span className="absolute -top-[3px] -bottom-[3px] left-1/2 -ml-px w-0.5 bg-texto" />
        {valor !== 0 && (
          <span
            className={`absolute inset-y-0 ${valor > 0 ? 'left-1/2 bg-verde' : 'right-1/2 bg-vermelho'}`}
            style={{ width: largura }}
          />
        )}
      </div>
      <span
        className={`w-[34px] text-right text-base font-black ${
          valor > 0 ? 'text-verde' : valor < 0 ? 'text-vermelho' : 'text-texto-2'
        }`}
      >
        {formatarSaldo(valor)}
      </span>
    </div>
  )
}

function CartaoFaixas({ dados }: { dados: ResultadoTempos }) {
  const [tipo, setTipo] = useState<'marcados' | 'sofridos'>('marcados')
  const comFaixas = dados.times.filter((t) => t.faixas)
  const maior = Math.max(...comFaixas.flatMap((t) => t.faixas![tipo]), 1)
  const cor = tipo === 'marcados' ? '#1f9d55' : '#e5484d'

  return (
    <Cartao
      className="mt-7"
      titulo={
        <div className="flex flex-wrap items-center justify-between gap-2">
          Gols por faixa de minuto
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
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead className="border-b border-borda">
            <tr>
              <th scope="col" className={`${cabecalho} text-left`}>
                TIME
              </th>
              {dados.rotulosFaixas.map((rotulo) => (
                <th key={rotulo} scope="col" className={`${cabecalho} text-center whitespace-nowrap`}>
                  {rotulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comFaixas.map((linha) => (
              <tr key={linha.time.id}>
                <td className="px-1.5 py-1 sm:px-2">
                  <Link to={`/times/${linha.time.id}`} className="flex items-center gap-2 font-bold hover:text-destaque">
                    <Escudo time={linha.time} />
                    <span className="max-w-[6rem] truncate sm:max-w-none">{linha.time.nomeCurto}</span>
                  </Link>
                </td>
                {linha.faixas![tipo].map((gols, indice) => {
                  const intensidade = Math.round((gols / maior) * 75)
                  return (
                    <td key={indice} className="p-0.5">
                      <div
                        className={`min-w-8 py-1.5 text-center font-mono ${intensidade > 45 ? 'font-extrabold text-white' : 'text-texto'}`}
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
