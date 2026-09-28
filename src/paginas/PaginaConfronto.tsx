import { useSearchParams } from 'react-router'
import { useConfronto, useTimes } from '../api/consultas'
import type { Time } from '../api/tipos'
import { Cartao } from '../componentes/Cartao'
import { Escudo } from '../componentes/Escudo'
import { Carregando, Erro, Vazio } from '../componentes/Estado'
import { ListaPartidas } from '../componentes/ListaPartidas'

function lerId(valor: string | null) {
  const numero = Number(valor)
  return valor && Number.isInteger(numero) ? numero : undefined
}

export function PaginaConfronto() {
  const [busca, setBusca] = useSearchParams()
  const timeA = lerId(busca.get('a'))
  const timeB = lerId(busca.get('b'))
  const times = useTimes()
  const confronto = useConfronto(timeA, timeB)

  function escolher(chave: 'a' | 'b', valor: string) {
    setBusca(
      (atual) => {
        if (valor) atual.set(chave, valor)
        else atual.delete(chave)
        return atual
      },
      { replace: true },
    )
  }

  if (times.isPending) return <Carregando />
  if (times.isError) return <Erro tentarDeNovo={() => times.refetch()} />

  const a = timeA !== undefined ? times.data.porId.get(timeA) : undefined
  const b = timeB !== undefined ? times.data.porId.get(timeB) : undefined

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Confronto direto</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        <SeletorTime rotulo="Time A" times={times.data.lista} valor={timeA} bloqueado={timeB} aoMudar={(v) => escolher('a', v)} />
        <SeletorTime rotulo="Time B" times={times.data.lista} valor={timeB} bloqueado={timeA} aoMudar={(v) => escolher('b', v)} />
      </div>

      {!a || !b ? (
        <Vazio>Escolha dois times para ver o confronto nesta temporada.</Vazio>
      ) : confronto.isPending ? (
        <Carregando />
      ) : confronto.isError ? (
        <Erro tentarDeNovo={() => confronto.refetch()} />
      ) : (
        <>
          <Cartao>
            <div className="grid grid-cols-3 items-center gap-2 px-4 py-6 text-center">
              <Lado time={a} vitorias={confronto.data.vitoriasA} />
              <div>
                <div className="text-3xl font-bold tabular-nums">{confronto.data.empates}</div>
                <div className="text-xs text-texto-3">{confronto.data.empates === 1 ? 'empate' : 'empates'}</div>
              </div>
              <Lado time={b} vitorias={confronto.data.vitoriasB} />
            </div>
            <p className="border-t border-borda px-4 py-3 text-center text-sm text-texto-2 tabular-nums">
              {confronto.data.jogos === 0
                ? 'Ainda não se enfrentaram nesta temporada.'
                : `${confronto.data.jogos} ${confronto.data.jogos === 1 ? 'jogo' : 'jogos'} · gols ${confronto.data.golsA} × ${confronto.data.golsB}`}
            </p>
          </Cartao>

          <Cartao titulo="Jogos">
            <ListaPartidas partidas={confronto.data.partidas} times={times.data.porId} />
          </Cartao>
        </>
      )}
    </div>
  )
}

function Lado({ time, vitorias }: { time: Time; vitorias: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Escudo time={time} tamanho="m" />
      <div className="text-sm font-medium">{time.nomeCurto}</div>
      <div className="text-3xl font-bold tabular-nums">{vitorias}</div>
      <div className="text-xs text-texto-3">{vitorias === 1 ? 'vitória' : 'vitórias'}</div>
    </div>
  )
}

type SeletorProps = {
  rotulo: string
  times: Time[]
  valor: number | undefined
  bloqueado: number | undefined
  aoMudar: (valor: string) => void
}

function SeletorTime({ rotulo, times, valor, bloqueado, aoMudar }: SeletorProps) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-texto-2">{rotulo}</span>
      <select
        value={valor ?? ''}
        onChange={(evento) => aoMudar(evento.target.value)}
        className="w-full rounded-lg border border-borda bg-superficie px-3 py-2 text-texto"
      >
        <option value="">Escolha um time</option>
        {times.map((time) => (
          <option key={time.id} value={time.id} disabled={time.id === bloqueado}>
            {time.nomeCurto}
          </option>
        ))}
      </select>
    </label>
  )
}
