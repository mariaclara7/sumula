import { Fragment, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { useProbabilidades } from '../api/consultas'
import type { ProbabilidadesTime } from '../api/tipos'
import { BarraChance } from '../componentes/BarraChance'
import { CartaoDestaque } from '../componentes/CartaoDestaque'
import { Escudo } from '../componentes/Escudo'
import { BotaoPrincipal, Carregando, Erro, Vazio } from '../componentes/Estado'
import { Pagina } from '../componentes/Pagina'
import { SecaoMatematica } from '../componentes/SecaoMatematica'
import { TituloPagina } from '../componentes/TituloPagina'
import { FAIXAS_CHANCES, chanceNaFaixa, type Zona } from '../config'
import { usePreferencias } from '../preferencias'
import { contar, useAnimacao } from '../util/animacao'

// Nomes curtos das colunas, como no cabeçalho do design.
const ROTULO: Record<string, string> = {
  Título: 'TÍTULO',
  Libertadores: 'LIBERTA',
  'Pré-Libertadores': 'PRÉ-LIB.',
  'Sul-Americana': 'SUL-AM.',
  Rebaixamento: 'REBAIX.',
}

// No gráfico da faixa do título a barra usa a cor do texto, como no design.
const COR_BARRA: Record<string, string> = { Título: 'bg-texto' }

const COLUNAS = 'grid grid-cols-[52px_minmax(160px,1fr)_52px_92px_repeat(5,110px)]'
const faixa = (nome: string) => FAIXAS_CHANCES.find((f) => f.nome === nome)!

/** Coluna pela qual a tabela está ordenada. Começa pela posição atual, como a classificação. */
type Ordem = { chave: string; crescente: boolean }
const ORDEM_INICIAL: Ordem = { chave: 'pos', crescente: true }

export function PaginaChances() {
  const { data, isPending, isError, refetch } = useProbabilidades()
  const { progresso, repetir } = useAnimacao(data !== undefined)
  const { meuTime } = usePreferencias()
  const navegar = useNavigate()
  const [ordem, setOrdem] = useState<Ordem>(ORDEM_INICIAL)

  /** Clicar na coluna ordena por ela; clicar de novo inverte. Posição começa crescente, o resto do maior para o menor. */
  function ordenarPor(chave: string) {
    setOrdem((atual) => (atual.chave === chave ? { chave, crescente: !atual.crescente } : { chave, crescente: chave === 'pos' }))
  }

  const conteudo = () => {
    if (isPending) return <Carregando />
    if (isError) return <Erro tentarDeNovo={() => refetch()} />
    if (data.times.length === 0) return <Vazio>Ainda não há dados desta temporada.</Vazio>

    const chance = (t: ProbabilidadesTime, zona: Zona) => chanceNaFaixa(t.posicoes, zona)
    const maior = (lista: ProbabilidadesTime[], zona: Zona) =>
      [...lista].sort((a, b) => chance(b, zona) - chance(a, zona))[0]

    const titulo = faixa('Título')
    const libertadores = faixa('Libertadores')
    const rebaixamento = faixa('Rebaixamento')
    const favorito = maior(data.times, titulo)
    // "Mais perto": entre quem ainda não tem a vaga praticamente garantida (e sem repetir o favorito).
    const pertoDaLiberta = maior(
      data.times.filter((t) => t !== favorito && chance(t, libertadores) < 0.99),
      libertadores,
    )
    const ameacado = maior(data.times, rebaixamento)
    const porcentagem = (t: ProbabilidadesTime | undefined, zona: Zona) =>
      t ? `${contar(chance(t, zona) * 100, progresso)}%` : '—'

    const valores: Record<string, (t: ProbabilidadesTime) => number> = {
      pos: (t) => t.posicaoAtual,
      pts: (t) => t.pontosAtuais,
      esp: (t) => t.pontosEsperados,
      ...Object.fromEntries(FAIXAS_CHANCES.map((f) => [f.nome, (t: ProbabilidadesTime) => chance(t, f)])),
    }
    const valor = valores[ordem.chave] ?? valores.pos
    // Empate na coluna escolhida: vale a posição atual.
    const ordenados = [...data.times].sort(
      (a, b) => (ordem.crescente ? valor(a) - valor(b) : valor(b) - valor(a)) || a.posicaoAtual - b.posicaoAtual,
    )
    const cabecalho = (chave: string, titulo: string, rotulo: ReactNode, alinhamento = 'justify-center') => {
      const ativa = ordem.chave === chave
      return (
        <span
          role="columnheader"
          aria-sort={ativa ? (ordem.crescente ? 'ascending' : 'descending') : 'none'}
          className={`flex ${alinhamento}`}
        >
          <button
            type="button"
            title={`Ordenar por ${titulo.toLowerCase()}`}
            onClick={() => ordenarPor(chave)}
            className={`cursor-pointer px-1.5 py-1 tracking-[1px] whitespace-nowrap ${ativa ? 'bg-texto text-texto-invertido' : 'hover:text-texto'}`}
          >
            {rotulo}
            {ativa && <span aria-hidden>{ordem.crescente ? ' ▲' : ' ▼'}</span>}
          </button>
        </span>
      )
    }

    return (
      <>
        <div className="mt-7 grid gap-3.5 md:grid-cols-3">
          <CartaoDestaque escuro rotulo="FAVORITO AO TÍTULO" nome={favorito.time.nomeCurto} valor={porcentagem(favorito, titulo)} />
          <CartaoDestaque
            rotulo="MAIS PERTO DA LIBERTA"
            corRotulo="text-azul"
            nome={pertoDaLiberta?.time.nomeCurto ?? '—'}
            valor={porcentagem(pertoDaLiberta, libertadores)}
          />
          <CartaoDestaque
            rotulo="MAIS AMEAÇADO"
            corRotulo="text-vermelho"
            corValor="text-vermelho"
            nome={ameacado.time.nomeCurto}
            valor={porcentagem(ameacado, rebaixamento)}
          />
        </div>

        <p className="mt-7 text-[13px] text-texto-2">Clique no nome de uma coluna para ordenar a tabela por ela.</p>
        <div className="mt-2 overflow-x-auto">
          <div role="table" aria-label="Chances de cada time" className="min-w-[940px] pr-1.5">
            <div
              role="row"
              className={`${COLUNAS} h-9 items-center border-b-2 border-texto text-center font-mono text-[11px] font-extrabold tracking-[1px] text-texto-2`}
            >
              {cabecalho('pos', 'Posição atual', 'POS')}
              <span role="columnheader" className="text-left">TIME</span>
              {cabecalho('pts', 'Pontos atuais', 'PTS')}
              {cabecalho('esp', 'Pontos esperados ao fim do campeonato', 'PTS ESP.')}
              {FAIXAS_CHANCES.map((f) => (
                <Fragment key={f.nome}>{cabecalho(f.nome, `Chance de ${f.nome}`, ROTULO[f.nome] ?? f.nome)}</Fragment>
              ))}
            </div>
            {ordenados.map((linha) => (
              <div
                key={linha.time.id}
                role="row"
                onClick={() => navegar(`/times/${linha.time.id}`)}
                className={`${COLUNAS} h-[54px] cursor-pointer items-center border-b border-borda text-center transition-[translate] duration-200 hover:translate-x-1.5 ${
                  meuTime === linha.time.id ? 'bg-realce' : ''
                }`}
              >
                <span role="cell" className="text-lg font-black">{linha.posicaoAtual}</span>
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
                <span role="cell" className="text-lg font-black tabular-nums">{linha.pontosAtuais}</span>
                <span role="cell" className="font-mono text-sm font-medium text-texto-2 tabular-nums">
                  {contar(linha.pontosEsperados, progresso)}
                </span>
                {FAIXAS_CHANCES.map((f) => (
                  <div key={f.nome} role="cell" className="px-2.5">
                    <BarraChance chance={chance(linha, f)} cor={COR_BARRA[f.nome] ?? f.cor} progresso={progresso} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  return (
    <Pagina className="pt-9 pb-12">
      <TituloPagina>Chances</TituloPagina>
      <p className="mt-[18px] max-w-[720px] text-[15px] leading-[1.55] text-pretty text-texto-2">
        {data && data.partidasRestantes > 0
          ? `Simulamos os ${data.partidasRestantes} jogos que faltam ${data.simulacoes.toLocaleString('pt-BR')} vezes. `
          : 'Simulamos os jogos que faltam milhares de vezes. '}
        O placar de cada jogo é sorteado a partir dos gols marcados e sofridos por cada time na temporada, com vantagem
        para o mandante. A chance é a fração das simulações em que o time termina na faixa.
      </p>
      {data && (
        <div className="mt-5 flex flex-wrap items-center gap-3.5">
          <BotaoPrincipal onClick={repetir}>Ver a simulação de novo</BotaoPrincipal>
          <span className="font-mono text-sm font-bold tabular-nums">
            {contar(data.simulacoes, progresso).toLocaleString('pt-BR')} simulações
          </span>
        </div>
      )}
      {conteudo()}
      <SecaoMatematica />
    </Pagina>
  )
}
