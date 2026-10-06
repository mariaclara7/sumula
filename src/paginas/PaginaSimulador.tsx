import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { usePalpites, usePartidas, useTimes } from '../api/consultas'
import type { Palpite, Partida, Time } from '../api/tipos'
import { BotaoPrincipal, Carregando, Erro, Vazio } from '../componentes/Estado'
import { Pagina } from '../componentes/Pagina'
import { JogoDoSimulador, NavegacaoRodadas, TabelaSimulada } from '../componentes/Simulacao'
import { TituloPagina } from '../componentes/TituloPagina'
import { useConfirmacao } from '../componentes/useConfirmacao'
import { ZONAS } from '../config'
import { gravarArmazenado, lerArmazenado } from '../preferencias'
import { calcularClassificacao } from '../util/classificacao'
import { codificarPalpites, decodificarPalpites, resumoDaSimulacao } from '../util/compartilhar'
import {
  CHAVE_PALPITES,
  jogosDaSimulacao,
  lerGols,
  lerPalpitesSalvos,
  podePalpitar,
  preencherComPalpitesDaSumula,
  rodadaInicial,
  type PalpitesUsuario,
  type PlacarDigitado,
} from '../util/simulador'

const zonaRebaixamento = ZONAS.find((z) => z.nome === 'Rebaixamento')!
const QUANTIDADE_REBAIXADOS = zonaRebaixamento.ate - zonaRebaixamento.de + 1

export function PaginaSimulador() {
  const partidas = usePartidas()
  const times = useTimes()
  const palpitesSumula = usePalpites()

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
  if (partidas.data.length === 0) {
    return (
      <Pagina className="pt-9 pb-12">
        <Vazio>Ainda não há jogos desta temporada.</Vazio>
      </Pagina>
    )
  }

  return <Simulador partidas={partidas.data} times={times.data} palpitesSumula={palpitesSumula.data} />
}

type PropsSimulador = {
  partidas: Partida[]
  times: { lista: Time[]; porId: Map<number, Time> }
  palpitesSumula: Map<number, Palpite> | undefined
}

function Simulador({ partidas, times, palpitesSumula }: PropsSimulador) {
  const [busca, setBusca] = useSearchParams()
  const [meusPalpites, setPalpites] = useState<PalpitesUsuario>(() => lerPalpitesSalvos(lerArmazenado(CHAVE_PALPITES)))
  const [aviso, setAviso] = useState<string | null>(null)
  const [confirmar, janelaConfirmacao] = useConfirmacao()

  useEffect(() => {
    gravarArmazenado(CHAVE_PALPITES, Object.keys(meusPalpites).length === 0 ? null : JSON.stringify(meusPalpites))
  }, [meusPalpites])

  // Link compartilhado (?p=...): mostra a simulação de outra pessoa sem mexer nos palpites salvos aqui.
  const codigoCompartilhado = busca.get('p')
  const compartilhados = useMemo(() => decodificarPalpites(codigoCompartilhado), [codigoCompartilhado])
  const modoCompartilhado = codigoCompartilhado !== null
  const palpites = useMemo(
    () => compartilhados ?? (modoCompartilhado ? {} : meusPalpites),
    [compartilhados, modoCompartilhado, meusPalpites],
  )

  const rodadas = useMemo(() => [...new Set(partidas.map((p) => p.rodada))].sort((a, b) => a - b), [partidas])
  const rodadaDaUrl = Number(busca.get('rodada'))
  const rodada = rodadas.includes(rodadaDaUrl) ? rodadaDaUrl : rodadaInicial(partidas)

  function irPara(nova: number) {
    setBusca(
      (atual) => {
        atual.set('rodada', String(nova))
        return atual
      },
      { replace: true },
    )
  }

  function sairDoCompartilhado() {
    setBusca(
      (atual) => {
        atual.delete('p')
        return atual
      },
      { replace: true },
    )
  }

  async function usarCompartilhados() {
    if (!compartilhados) return
    const temMeus = Object.keys(meusPalpites).length > 0
    if (
      temMeus &&
      !(await confirmar({
        titulo: 'Trocar seus palpites?',
        texto: 'Os palpites que você já fez aqui vão ser substituídos pelos desta simulação.',
        confirmar: 'Usar estes palpites',
        perigo: true,
      }))
    )
      return
    setPalpites(compartilhados)
    sairDoCompartilhado()
  }

  const restantes = partidas.filter(podePalpitar)
  const palpitados = restantes.filter((p) => palpites[p.id]?.mandante != null && palpites[p.id]?.visitante != null)

  // Tabela só com os jogos disputados (para o ▲▼) e tabela com os palpites.
  const real = useMemo(
    () => calcularClassificacao(times.lista, jogosDaSimulacao(partidas, {})),
    [partidas, times.lista],
  )
  const simulada = useMemo(
    () => calcularClassificacao(times.lista, jogosDaSimulacao(partidas, palpites)),
    [partidas, times.lista, palpites],
  )
  const posicaoReal = new Map(real.map((l) => [l.time.id, l.posicao]))

  async function compartilhar() {
    const codigo = codificarPalpites(meusPalpites)
    if (!codigo) return
    const url = `${window.location.origin}/simulador?p=${codigo}`
    const texto = resumoDaSimulacao(simulada, QUANTIDADE_REBAIXADOS)

    // No celular abre o menu de compartilhar do sistema (WhatsApp, Instagram...); no computador, copia o link.
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Minha simulação na Súmula', text: texto, url })
        return
      } catch (erro) {
        if ((erro as Error).name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(`${texto} ${url}`)
      setAviso('Link copiado! É só colar onde quiser.')
    } catch {
      setAviso(url)
    }
  }

  function alterar(partidaId: number, lado: keyof PlacarDigitado, texto: string) {
    setPalpites((atuais) => {
      const atual = atuais[partidaId] ?? { mandante: null, visitante: null }
      const novo = { ...atual, [lado]: lerGols(texto) }
      const copia = { ...atuais }
      if (novo.mandante === null && novo.visitante === null) delete copia[partidaId]
      else copia[partidaId] = novo
      return copia
    })
  }

  async function limpar() {
    const total = Object.keys(meusPalpites).length
    const apagar = await confirmar({
      titulo: 'Apagar seus palpites?',
      texto: `${total === 1 ? 'O palpite que você fez vai' : `Os ${total} palpites que você fez vão`} ser apagados deste navegador. Não dá para desfazer.`,
      confirmar: 'Apagar palpites',
      perigo: true,
    })
    if (apagar) setPalpites({})
  }

  useEffect(() => {
    if (!aviso) return
    const timer = setTimeout(() => setAviso(null), 6000)
    return () => clearTimeout(timer)
  }, [aviso])

  const daRodada = partidas
    .filter((p) => p.rodada === rodada)
    .sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id)
  const pendentesPorRodada = new Map<number, number>()
  for (const p of restantes) {
    const palpitado = palpites[p.id]?.mandante != null && palpites[p.id]?.visitante != null
    if (!palpitado) pendentesPorRodada.set(p.rodada, (pendentesPorRodada.get(p.rodada) ?? 0) + 1)
  }

  return (
    <Pagina className="pt-9 pb-12">
      {janelaConfirmacao}
      <TituloPagina>Simulador</TituloPagina>
      <p className="mt-[18px] max-w-[720px] text-[15px] leading-[1.55] text-pretty text-texto-2">
        Os jogos que já aconteceram estão travados. Dê seu palpite nos que faltam e veja a tabela mudar na hora. Os
        palpites ficam salvos neste navegador.
      </p>

      {modoCompartilhado ? (
        <div role="status" className="mt-5 border-2 border-texto bg-lima p-4 text-grafite">
          <p className="font-black">
            {compartilhados
              ? 'Você está vendo a simulação que alguém compartilhou.'
              : 'Este link de simulação está incompleto ou quebrado.'}
          </p>
          <p className="mt-1 text-sm">
            {compartilhados
              ? 'Os placares estão travados. Os jogos que já aconteceram mostram o resultado real.'
              : 'Peça para a pessoa enviar o link de novo.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {compartilhados && (
              <button
                type="button"
                onClick={usarCompartilhados}
                className="cursor-pointer border-2 border-grafite bg-grafite px-4 py-2.5 text-sm font-extrabold text-lima"
              >
                Usar como meus palpites
              </button>
            )}
            <button
              type="button"
              onClick={sairDoCompartilhado}
              className="cursor-pointer border-2 border-grafite bg-transparent px-4 py-2.5 text-sm font-extrabold"
            >
              Ver os meus palpites
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-3.5">
          <BotaoPrincipal
            onClick={() =>
              palpitesSumula && setPalpites((atuais) => preencherComPalpitesDaSumula(partidas, atuais, palpitesSumula))
            }
            className={palpitesSumula ? '' : 'pointer-events-none opacity-50'}
          >
            Preencher com o palpite da Súmula
          </BotaoPrincipal>
          <button
            type="button"
            onClick={limpar}
            disabled={Object.keys(palpites).length === 0}
            className="cursor-pointer border-2 border-texto bg-superficie px-[18px] py-3 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-40"
          >
            Limpar meus palpites
          </button>
          <button
            type="button"
            onClick={compartilhar}
            disabled={palpitados.length === 0}
            className="cursor-pointer border-2 border-texto bg-texto px-[18px] py-3 text-sm font-extrabold text-texto-invertido disabled:cursor-not-allowed disabled:opacity-40"
          >
            Compartilhar simulação
          </button>
          <Link
            to="/sala"
            className="border-2 border-texto bg-superficie px-[18px] py-3 text-sm font-extrabold text-texto hover:text-texto"
          >
            Simular com amigos
          </Link>
          <span className="font-mono text-sm font-bold tabular-nums" aria-live="polite">
            {palpitados.length} de {restantes.length} jogos palpitados
          </span>
        </div>
      )}
      {aviso && (
        <p role="status" className="mt-3 font-mono text-sm font-bold break-all">
          {aviso.startsWith('http') ? `Copie o link: ${aviso}` : aviso}
        </p>
      )}

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <section aria-label="Jogos da rodada">
          <NavegacaoRodadas
            rodadas={rodadas}
            rodada={rodada}
            aoMudar={irPara}
            detalhe={(r) => (pendentesPorRodada.get(r) ? `${pendentesPorRodada.get(r)} sem palpite` : undefined)}
          />
          <div className="mt-2 flex items-center justify-between gap-3 text-[13px]">
            <span className="font-mono font-bold text-texto-2">
              {pendentesPorRodada.get(rodada)
                ? `${pendentesPorRodada.get(rodada)} sem palpite nesta rodada`
                : daRodada.some(podePalpitar)
                  ? 'Rodada toda palpitada ✓'
                  : 'Rodada encerrada'}
            </span>
            <a href="#tabela-simulada" className="font-bold text-destaque lg:hidden">
              Ver a tabela ↓
            </a>
          </div>

          <ul className="mt-3 flex flex-col gap-2.5">
            {daRodada.map((partida) => {
              const mandante = times.porId.get(partida.mandanteId)
              const visitante = times.porId.get(partida.visitanteId)
              if (!mandante || !visitante) return null
              return (
                <JogoDoSimulador
                  key={partida.id}
                  partida={partida}
                  mandante={mandante}
                  visitante={visitante}
                  palpite={palpites[partida.id]}
                  sugestao={palpitesSumula?.get(partida.id)}
                  somenteLeitura={modoCompartilhado}
                  aoAlterar={(lado, texto) => alterar(partida.id, lado, texto)}
                />
              )
            })}
          </ul>
        </section>

        <section id="tabela-simulada" aria-label="Tabela simulada" className="scroll-mt-4 lg:sticky lg:top-4">
          <TabelaSimulada linhas={simulada} posicaoReal={posicaoReal} />
          <p className="mt-2 text-xs text-texto-2">
            ▲▼ comparam com a{' '}
            <Link to="/" className="font-bold text-destaque hover:underline">
              tabela de verdade
            </Link>
            . Desempate: pontos, vitórias, saldo, gols pró e confronto direto.
          </p>
        </section>
      </div>
    </Pagina>
  )
}

