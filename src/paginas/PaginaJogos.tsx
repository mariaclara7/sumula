import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { usePalpites, usePartidas, useTimes } from '../api/consultas'
import type { Palpite, Partida, Time } from '../api/tipos'
import { Abas } from '../componentes/Abas'
import { BarraPalpite } from '../componentes/BarraPalpite'
import { Escudo } from '../componentes/Escudo'
import { Carregando, Erro, Vazio } from '../componentes/Estado'
import { COR_PLACAR } from '../componentes/FormaRecente'
import { Pagina } from '../componentes/Pagina'
import { Seletor } from '../componentes/Seletor'
import { TituloPagina } from '../componentes/TituloPagina'
import { usePreferencias } from '../preferencias'
import { diaRelativo, horaDoJogo, nomeDoDia, periodo, proximosJogos, resultados, type DiaDeJogos } from '../util/calendario'
import { resultadoPara } from '../util/formato'

type Visao = 'proximos' | 'resultados'

/** Quantas rodadas aparecem de cara (o resto vem no "Mostrar mais rodadas"). */
const RODADAS_DE_INICIO = 3

/** /jogos: os próximos jogos (ou os resultados) de todos os times, por rodada e por dia. */
export function PaginaJogos() {
  const partidas = usePartidas()
  const times = useTimes()
  const palpites = usePalpites()
  const { meuTime } = usePreferencias()
  const [busca, setBusca] = useSearchParams()
  const [agora] = useState(() => new Date())

  const visao: Visao = busca.get('visao') === 'resultados' ? 'resultados' : 'proximos'
  const timeDaUrl = Number(busca.get('time'))
  const time = times.data?.porId.get(timeDaUrl)
  const [quantas, setQuantas] = useState(RODADAS_DE_INICIO)

  function mudar(chave: 'visao' | 'time', valor: string | null) {
    setQuantas(RODADAS_DE_INICIO)
    setBusca(
      (atual) => {
        if (valor === null) atual.delete(chave)
        else atual.set(chave, valor)
        return atual
      },
      { replace: true },
    )
  }

  const doTime = useMemo(
    () => (partidas.data ?? []).filter((p) => !time || p.mandanteId === time.id || p.visitanteId === time.id),
    [partidas.data, time],
  )
  const calendario = useMemo(() => proximosJogos(doTime, partidas.data ?? []), [doTime, partidas.data])
  const passados = useMemo(() => resultados(doTime), [doTime])

  if (partidas.isPending || times.isPending) {
    return (
      <Pagina className="pt-9 pb-12">
        <Carregando />
      </Pagina>
    )
  }
  if (partidas.isError || times.isError) {
    return (
      <Pagina className="pt-9 pb-12">
        <Erro tentarDeNovo={() => partidas.refetch()} />
      </Pagina>
    )
  }

  const opcoesTimes = [...times.data.lista].sort((a, b) => a.nomeCurto.localeCompare(b.nomeCurto, 'pt-BR'))
  // Quem pinta o placar dos resultados: o time escolhido no filtro ou, sem filtro, o "meu time".
  const perspectiva = time?.id ?? meuTime ?? undefined
  const grupos = visao === 'proximos' ? calendario.rodadas : passados
  const visiveis = grupos.slice(0, quantas)
  const atrasados = new Set(calendario.atrasados.flatMap((d) => d.partidas.map((p) => p.id)))
  const listaDoTime =
    visao === 'proximos'
      ? [...calendario.atrasados.flatMap((d) => d.partidas), ...calendario.rodadas.flatMap((r) => r.partidas)].sort((a, b) =>
          a.data.localeCompare(b.data),
        )
      : passados.flatMap((r) => r.partidas).sort((a, b) => b.data.localeCompare(a.data))
  const nada =
    visao === 'proximos'
      ? calendario.rodadas.length === 0 && calendario.atrasados.length === 0 && calendario.semData.length === 0
      : passados.length === 0

  const props = { times: times.data.porId, palpites: palpites.data, meuTime, perspectiva, agora }

  return (
    <Pagina className="pt-9 pb-12">
      <TituloPagina>Jogos</TituloPagina>
      <p className="mt-[18px] max-w-[720px] text-[15px] leading-[1.55] text-pretty text-texto-2">
        Os jogos de todos os times, rodada por rodada. Escolha um time para ver só os jogos dele.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Abas
          rotulo="Mostrar"
          valor={visao}
          aoMudar={(v) => mudar('visao', v === 'proximos' ? null : v)}
          opcoes={[
            { valor: 'proximos', rotulo: 'Próximos' },
            { valor: 'resultados', rotulo: 'Resultados' },
          ]}
        />
        <Seletor
          rotulo="Escolher o time"
          valor={time?.id ?? null}
          aoMudar={(id) => mudar('time', id === null ? null : String(id))}
          opcoes={[
            { valor: null, rotulo: 'Todos os times' },
            ...opcoesTimes.map((t) => ({ valor: t.id, rotulo: t.nomeCurto, icone: <Escudo time={t} tamanho={20} circulo /> })),
          ]}
          className="flex items-center gap-2 border-2 border-texto bg-superficie px-3 py-[7px] text-[13px] font-extrabold hover:text-destaque focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lima"
        >
          <span className="font-semibold text-texto-2">Time:</span>
          {time && <Escudo time={time} tamanho={20} circulo />}
          {time?.nomeCurto ?? 'Todos'}
          <span aria-hidden className="text-[10px]">
            ▼
          </span>
        </Seletor>
        <span className="font-mono text-xs text-texto-2 sm:ml-auto">Horários de Brasília</span>
      </div>

      {nada && (
        <Vazio>
          {visao === 'proximos'
            ? time
              ? `${time.nomeCurto} não tem mais jogos no campeonato.`
              : 'Não há mais jogos no campeonato.'
            : 'Ainda não há resultados.'}
        </Vazio>
      )}

      {/* Com um time escolhido é um jogo por rodada: lista corrida, com a rodada e o dia dentro de cada card. */}
      {time && !nada && (
        <ul className="mt-8 grid gap-2.5 lg:grid-cols-2">
          {listaDoTime.map((p) => (
            <CardJogo key={p.id} partida={p} comDia remarcado={atrasados.has(p.id)} {...props} />
          ))}
        </ul>
      )}

      {!time && visao === 'proximos' && calendario.atrasados.length > 0 && (
        <section aria-labelledby="atrasados" className="mt-8">
          <CabecalhoBloco id="atrasados" titulo="Jogos atrasados" detalhe="de rodadas que já passaram" cor="text-vermelho" />
          <Dias dias={calendario.atrasados} remarcado {...props} />
        </section>
      )}

      {!time &&
        visiveis.map((grupo) => (
        <section key={grupo.rodada} aria-labelledby={`rodada-${grupo.rodada}`} className="mt-8">
          <CabecalhoBloco
            id={`rodada-${grupo.rodada}`}
            titulo={`Rodada ${grupo.rodada}`}
            detalhe={`${periodo(grupo.partidas)} · ${grupo.partidas.length} ${grupo.partidas.length === 1 ? 'jogo' : 'jogos'}`}
          />
          <Dias dias={grupo.dias} {...props} />
        </section>
      ))}

      {!time && visiveis.length < grupos.length && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setQuantas((q) => q + RODADAS_DE_INICIO)}
            className="cursor-pointer border-2 border-texto bg-superficie px-[18px] py-3 text-sm font-extrabold hover:shadow-[3px_3px_0_var(--texto)]"
          >
            Mostrar mais rodadas
          </button>
        </div>
      )}

      {visao === 'proximos' && calendario.semData.length > 0 && (
        <section aria-labelledby="sem-data" className="mt-10">
          <CabecalhoBloco id="sem-data" titulo="Adiados, sem data definida" />
          <ul className="mt-3 grid gap-2.5 lg:grid-cols-2">
            {calendario.semData.map((p) => (
              <CardJogo key={p.id} partida={p} {...props} semData />
            ))}
          </ul>
        </section>
      )}
    </Pagina>
  )
}

function CabecalhoBloco({ id, titulo, detalhe, cor = '' }: { id: string; titulo: string; detalhe?: string; cor?: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 border-b-2 border-texto pb-2">
      <h2 id={id} className={`text-[26px] leading-none font-black tracking-[-1px] uppercase md:text-3xl ${cor}`}>
        {titulo}
      </h2>
      {detalhe && <span className="font-mono text-xs font-bold text-texto-2">{detalhe}</span>}
    </div>
  )
}

type PropsJogos = {
  times: Map<number, Time>
  palpites: Map<number, Palpite> | undefined
  meuTime: number | null
  perspectiva: number | undefined
  agora: Date
}

function Dias({ dias, remarcado = false, ...props }: PropsJogos & { dias: DiaDeJogos[]; remarcado?: boolean }) {
  return dias.map(({ dia, partidas }) => {
    const relativo = diaRelativo(partidas[0].data, props.agora)
    return (
      <div key={dia}>
        <h3 className="mt-4 mb-2 flex items-center gap-2 font-mono text-xs font-extrabold tracking-[2px] text-texto-2 uppercase">
          {relativo && <span className="bg-lima px-1.5 py-0.5 text-grafite">{relativo}</span>}
          {nomeDoDia(partidas[0].data)}
        </h3>
        <ul className="grid gap-2.5 lg:grid-cols-2">
          {partidas.map((p) => (
            <CardJogo key={p.id} partida={p} remarcado={remarcado} {...props} />
          ))}
        </ul>
      </div>
    )
  })
}

function CardJogo({
  partida,
  times,
  palpites,
  meuTime,
  perspectiva,
  agora,
  remarcado = false,
  semData = false,
  comDia = false,
}: PropsJogos & { partida: Partida; remarcado?: boolean; semData?: boolean; comDia?: boolean }) {
  const mandante = times.get(partida.mandanteId)
  const visitante = times.get(partida.visitanteId)
  if (!mandante || !visitante) return null

  const ehMeu = meuTime !== null && (partida.mandanteId === meuTime || partida.visitanteId === meuTime)
  const aoVivo = partida.status === 'emAndamento'
  // Só pinta (vitória/empate/derrota) o placar de um jogo do time de referência; os outros ficam neutros.
  const jogaNele = perspectiva !== undefined && (partida.mandanteId === perspectiva || partida.visitanteId === perspectiva)
  const resultado = jogaNele ? resultadoPara(partida, perspectiva) : undefined
  const palpite = !partida.temResultado && !aoVivo && !semData ? palpites?.get(partida.id) : undefined

  let meio
  if (partida.temResultado) {
    meio = (
      <span
        className={`min-w-[68px] px-2 py-1.5 text-center font-mono text-[15px] font-extrabold tabular-nums ${
          resultado ? COR_PLACAR[resultado] : 'bg-texto text-texto-invertido'
        }`}
      >
        {partida.golsMandante} × {partida.golsVisitante}
      </span>
    )
  } else if (aoVivo) {
    meio = (
      <span className="min-w-[68px] bg-vermelho px-2 py-1.5 text-center font-mono text-[15px] font-extrabold text-white tabular-nums">
        {partida.golsMandante !== null && partida.golsVisitante !== null ? `${partida.golsMandante} × ${partida.golsVisitante}` : '– × –'}
      </span>
    )
  } else if (semData) {
    meio = (
      <span className="min-w-[68px] border-2 border-dashed border-texto-3 px-2 py-1 text-center font-mono text-xs font-extrabold text-texto-2">
        A DEFINIR
      </span>
    )
  } else {
    meio = (
      <time
        dateTime={partida.data}
        className="min-w-[68px] bg-texto px-2 py-1.5 text-center font-mono text-[15px] font-extrabold text-texto-invertido tabular-nums"
      >
        {horaDoJogo(partida.data)}
      </time>
    )
  }

  const relativo = comDia && !semData ? diaRelativo(partida.data, agora) : null
  const rotulo = [
    `Rodada ${partida.rodada}`,
    remarcado && 'remarcado',
    semData && 'adiado',
    comDia && !semData && (relativo ? `${relativo.toLowerCase()}, ${nomeDoDia(partida.data)}` : nomeDoDia(partida.data)),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <li
      className={`relative border-2 px-3 py-2.5 ${semData ? 'border-dashed border-texto-3' : 'border-texto bg-superficie'} ${
        ehMeu ? 'bg-realce shadow-[inset_5px_0_0_#c6f432]' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 font-mono text-[11px] font-bold text-texto-2">
        {aoVivo ? (
          <span className="flex items-center gap-1.5 text-vermelho">
            <span aria-hidden className="size-[7px] rounded-full bg-vermelho motion-safe:animate-[pulsar_1.2s_ease-in-out_infinite]" />
            AO VIVO · {rotulo}
          </span>
        ) : (
          <span>{rotulo}</span>
        )}
        {ehMeu && <span className="bg-lima px-1.5 text-grafite">MEU TIME</span>}
      </div>
      <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2.5 text-sm font-bold">
        <Link to={`/times/${mandante.id}`} className="flex min-w-0 items-center justify-end gap-2 text-right hover:text-destaque">
          <NomeTime time={mandante} />
          <Escudo time={mandante} tamanho={24} />
        </Link>
        {meio}
        <Link to={`/times/${visitante.id}`} className="flex min-w-0 items-center gap-2 hover:text-destaque">
          <Escudo time={visitante} tamanho={24} />
          <NomeTime time={visitante} />
        </Link>
      </div>
      {palpite && <BarraPalpite palpite={palpite} mandante={mandante} visitante={visitante} comPlacar={false} />}
    </li>
  )
}

/** No celular fica a sigla, com o nome completo para leitores de tela. */
function NomeTime({ time }: { time: Time }) {
  return (
    <span className="truncate" title={time.nomeCurto}>
      <span aria-hidden className="sm:hidden">
        {time.sigla}
      </span>
      <span className="sr-only sm:not-sr-only">{time.nomeCurto}</span>
    </span>
  )
}
