import { Link, useSearchParams } from 'react-router'
import { useClassificacao, useConfronto, usePalpites, useProbabilidades, useTimes } from '../api/consultas'
import type { LinhaClassificacao, ProbabilidadesTime, Time } from '../api/tipos'
import { Cartao } from '../componentes/Cartao'
import { Escudo } from '../componentes/Escudo'
import { Carregando, Erro, Vazio } from '../componentes/Estado'
import { ListaPartidas } from '../componentes/ListaPartidas'
import { Pagina } from '../componentes/Pagina'
import { TituloPagina } from '../componentes/TituloPagina'
import { FAIXAS_CHANCES, chanceNaFaixa } from '../config'
import { usePreferencias } from '../preferencias'
import { contar, useAnimacao } from '../util/animacao'
import { formatarChance, formatarPercentual, formatarSaldo } from '../util/formato'
import { notaDoTime } from '../util/notas'

function lerId(valor: string | null) {
  const numero = Number(valor)
  return valor && Number.isInteger(numero) ? numero : undefined
}

type Disputa = {
  rotulo: string
  a: number
  b: number
  /** 1: maior é melhor; -1: menor é melhor. */
  sentido: 1 | -1
  formatar: (valor: number) => string
}

export function PaginaConfronto() {
  const [busca, setBusca] = useSearchParams()
  const { meuTime } = usePreferencias()
  const times = useTimes()
  const tabela = useClassificacao('geral', 'todos', 'jogoTodo')
  const probabilidades = useProbabilidades()
  const palpites = usePalpites()

  // Sem escolha na URL: o "meu time" (ou o líder) contra o líder (ou o vice).
  const ordem = tabela.data?.linhas.map((l) => l.time.id) ?? times.data?.lista.map((t) => t.id) ?? []
  const timeA = lerId(busca.get('a')) ?? meuTime ?? ordem[0]
  const timeB = lerId(busca.get('b')) ?? ordem.find((id) => id !== timeA)
  const confronto = useConfronto(timeA, timeB)
  const { progresso } = useAnimacao(confronto.data !== undefined && tabela.data !== undefined)

  function escolher(chave: 'a' | 'b', valor: string) {
    setBusca(
      (atual) => {
        // Fixa os dois na URL, para o link compartilhado mostrar o mesmo confronto.
        if (timeA !== undefined) atual.set('a', String(timeA))
        if (timeB !== undefined) atual.set('b', String(timeB))
        atual.set(chave, valor)
        return atual
      },
      { replace: true },
    )
  }

  const cabecalho = (
    <>
      <TituloPagina>Comparador</TituloPagina>
      <p className="mt-3.5 text-[15px] text-texto-2">Confronto direto e números da temporada, lado a lado.</p>
    </>
  )

  if (times.isPending) return <Pagina className="pt-9 pb-12">{cabecalho}<Carregando /></Pagina>
  if (times.isError) return <Pagina className="pt-9 pb-12">{cabecalho}<Erro tentarDeNovo={() => times.refetch()} /></Pagina>

  const a = timeA !== undefined ? times.data.porId.get(timeA) : undefined
  const b = timeB !== undefined ? times.data.porId.get(timeB) : undefined
  const linha = (id: number) => tabela.data?.linhas.find((l) => l.time.id === id)
  const chances = (id: number) => probabilidades.data?.times.find((t) => t.time.id === id)
  const nota = (id: number) => {
    const l = linha(id)
    return l ? contar(notaDoTime(l.aproveitamento), progresso) : '—'
  }

  return (
    <Pagina className="pt-9 pb-12">
      {cabecalho}

      <div className="mt-[22px] grid gap-3 md:grid-cols-2">
        <SeletorTime rotulo="TIME A" times={times.data.lista} time={a} bloqueado={timeB} aoMudar={(v) => escolher('a', v)} />
        <SeletorTime rotulo="TIME B" times={times.data.lista} time={b} bloqueado={timeA} aoMudar={(v) => escolher('b', v)} />
      </div>

      {!a || !b ? (
        <Vazio>Escolha dois times para comparar.</Vazio>
      ) : confronto.isPending ? (
        <Carregando />
      ) : confronto.isError ? (
        <Erro tentarDeNovo={() => confronto.refetch()} />
      ) : (
        <>
          {/* minmax(0,1fr): um nome longo não pode alargar a coluna além do card. */}
          <div className="corte-duplo mt-[18px] grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 bg-grafite px-5 py-7 text-creme">
            <Lado time={a} nota={nota(a.id)} corNota="bg-lima" />
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2.5 text-[40px] leading-none font-black tracking-[-2px] tabular-nums md:gap-[22px] md:text-[72px]">
                <span className="text-lima">{contar(confronto.data.vitoriasA, progresso)}</span>
                <span className="text-lg tracking-normal whitespace-nowrap text-cinza">
                  {confronto.data.empates} emp.
                </span>
                <span>{contar(confronto.data.vitoriasB, progresso)}</span>
              </div>
              <span className="text-center font-mono text-xs font-bold text-cinza">
                {confronto.data.jogos === 0
                  ? 'Ainda não se enfrentaram'
                  : `${confronto.data.jogos} ${confronto.data.jogos === 1 ? 'jogo' : 'jogos'} · gols ${confronto.data.golsA} × ${confronto.data.golsB}`}
              </span>
            </div>
            <Lado time={b} nota={nota(b.id)} corNota="bg-creme" />
          </div>

          <Disputas a={a.id} b={b.id} linha={linha} chances={chances} progresso={progresso} />

          <Cartao titulo="Jogos na temporada" className="mt-[18px]">
            <ListaPartidas
              partidas={confronto.data.partidas}
              times={times.data.porId}
              perspectiva={a.id}
              palpites={palpites.data}
              vazio="Ainda não se enfrentaram nesta temporada."
            />
          </Cartao>
        </>
      )}
    </Pagina>
  )
}

function Lado({ time, nota, corNota }: { time: Time; nota: React.ReactNode; corNota: string }) {
  return (
    <Link
      to={`/times/${time.id}`}
      className="flex min-w-0 flex-col items-center gap-2.5 transition-transform duration-200 hover:scale-[1.04] hover:text-creme"
    >
      <span className="md:hidden">
        <Escudo time={time} tamanho={56} circulo contorno="0 0 0 3px #f2f1ec" />
      </span>
      <span className="hidden md:block">
        <Escudo time={time} tamanho={88} circulo contorno="0 0 0 3px #f2f1ec" />
      </span>
      <span className="w-full truncate text-center text-base font-black md:text-xl md:whitespace-normal md:break-words">
        {time.nomeCurto}
      </span>
      <span className={`px-2 py-[3px] font-mono text-xs font-extrabold text-grafite ${corNota}`}>OVR {nota}</span>
    </Link>
  )
}

type PropsDisputas = {
  a: number
  b: number
  linha: (id: number) => LinhaClassificacao | undefined
  chances: (id: number) => ProbabilidadesTime | undefined
  progresso: number
}

/** Números da temporada lado a lado; a barra de quem leva a melhor fica lima. */
function Disputas({ a, b, linha, chances, progresso }: PropsDisputas) {
  const la = linha(a)
  const lb = linha(b)
  if (!la || !lb) return null

  const inteiro = (v: number) => String(v)
  const disputas: Disputa[] = [
    { rotulo: 'PONTOS', a: la.pontos, b: lb.pontos, sentido: 1, formatar: inteiro },
    { rotulo: 'APROVEITAMENTO', a: la.aproveitamento, b: lb.aproveitamento, sentido: 1, formatar: formatarPercentual },
    { rotulo: 'GOLS MARCADOS', a: la.golsPro, b: lb.golsPro, sentido: 1, formatar: inteiro },
    { rotulo: 'GOLS SOFRIDOS', a: la.golsContra, b: lb.golsContra, sentido: -1, formatar: inteiro },
    { rotulo: 'SALDO', a: la.saldo, b: lb.saldo, sentido: 1, formatar: formatarSaldo },
  ]

  const ca = chances(a)
  const cb = chances(b)
  if (ca && cb) {
    const faixa = (nome: string) => FAIXAS_CHANCES.find((f) => f.nome === nome)!
    const libertadores = faixa('Libertadores')
    const rebaixamento = faixa('Rebaixamento')
    disputas.push(
      {
        rotulo: 'PONTOS ESPERADOS',
        a: Math.round(ca.pontosEsperados),
        b: Math.round(cb.pontosEsperados),
        sentido: 1,
        formatar: inteiro,
      },
      {
        rotulo: 'CHANCE DE LIBERTADORES',
        a: chanceNaFaixa(ca.posicoes, libertadores),
        b: chanceNaFaixa(cb.posicoes, libertadores),
        sentido: 1,
        formatar: formatarChance,
      },
      {
        rotulo: 'RISCO DE REBAIXAMENTO',
        a: chanceNaFaixa(ca.posicoes, rebaixamento),
        b: chanceNaFaixa(cb.posicoes, rebaixamento),
        sentido: -1,
        formatar: formatarChance,
      },
    )
  }

  return (
    <section aria-label="Números da temporada" className="mt-[18px] border-2 border-texto bg-superficie px-[18px] pt-2 pb-3.5">
      {disputas.map((d) => {
        const maior = Math.max(Math.abs(d.a), Math.abs(d.b), 1e-9)
        const venceA = d.sentido > 0 ? d.a > d.b : d.a < d.b
        const venceB = d.sentido > 0 ? d.b > d.a : d.b < d.a
        const largura = (v: number) => `${(Math.abs(v) / maior) * 100 * progresso}%`
        return (
          <div key={d.rotulo} className="grid grid-cols-[56px_minmax(0,1fr)_56px] items-center gap-2.5 border-b border-borda py-3">
            <span className={`text-lg font-black tabular-nums ${venceA ? 'text-texto' : 'text-texto-2'}`}>{d.formatar(d.a)}</span>
            <div>
              <div className="mb-1.5 text-center font-mono text-[11px] font-extrabold tracking-[1px] text-texto-2">{d.rotulo}</div>
              <div className="grid grid-cols-2 gap-1">
                <div className="flex h-2.5 justify-end bg-superficie-2">
                  <div className={`h-full ${venceA ? 'bg-lima' : 'bg-texto-2'}`} style={{ width: largura(d.a) }} />
                </div>
                <div className="h-2.5 bg-superficie-2">
                  <div className={`h-full ${venceB ? 'bg-lima' : 'bg-texto-2'}`} style={{ width: largura(d.b) }} />
                </div>
              </div>
            </div>
            <span className={`text-right text-lg font-black tabular-nums ${venceB ? 'text-texto' : 'text-texto-2'}`}>
              {d.formatar(d.b)}
            </span>
          </div>
        )
      })}
    </section>
  )
}

type SeletorProps = {
  rotulo: string
  times: Time[]
  time: Time | undefined
  bloqueado: number | undefined
  aoMudar: (valor: string) => void
}

function SeletorTime({ rotulo, times, time, bloqueado, aoMudar }: SeletorProps) {
  const opcoes = [...times].sort((x, y) => x.nomeCurto.localeCompare(y.nomeCurto, 'pt-BR'))
  return (
    <label className="relative flex min-w-0 cursor-pointer items-center gap-3 border-2 border-texto bg-superficie px-3.5 py-2.5 focus-within:shadow-[4px_4px_0_#c6f432]">
      <span className="flex-none font-mono text-[11px] font-extrabold whitespace-nowrap text-texto-2">{rotulo}</span>
      {time && <Escudo time={time} tamanho={28} />}
      <span className="min-w-0 truncate text-base font-extrabold">{time?.nomeCurto ?? 'Escolha um time'}</span>
      <span aria-hidden className="ml-auto text-xs">
        ▼
      </span>
      <select
        aria-label={rotulo === 'TIME A' ? 'Time A' : 'Time B'}
        value={time?.id ?? ''}
        onChange={(evento) => aoMudar(evento.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {!time && <option value="">Escolha um time</option>}
        {opcoes.map((opcao) => (
          <option key={opcao.id} value={opcao.id} disabled={opcao.id === bloqueado}>
            {opcao.nomeCurto}
          </option>
        ))}
      </select>
    </label>
  )
}
