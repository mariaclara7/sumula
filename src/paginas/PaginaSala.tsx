import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { usePalpites, usePartidas, useTimes } from '../api/consultas'
import {
  entrarNaSala,
  ErroSala,
  gravarPalpitesNaSala,
  quemSou,
  sairOuRemover,
  useSala,
  type ParticipanteSala,
  type Sala,
} from '../api/salas'
import type { LinhaClassificacao, Palpite, Partida, Time } from '../api/tipos'
import { Abas } from '../componentes/Abas'
import { Escudo } from '../componentes/Escudo'
import { BotaoPrincipal, Carregando, Erro, Vazio } from '../componentes/Estado'
import { LegendaZonas } from '../componentes/LegendaZonas'
import { Pagina } from '../componentes/Pagina'
import { JogoDoSimulador, NavegacaoRodadas, TabelaSimulada } from '../componentes/Simulacao'
import { Rotulo, TituloPagina } from '../componentes/TituloPagina'
import { useConfirmacao } from '../componentes/useConfirmacao'
import { ZONAS, zonaDaPosicao } from '../config'
import { calcularClassificacao } from '../util/classificacao'
import { codificarPalpites, decodificarPalpites } from '../util/compartilhar'
import {
  corDoParticipante,
  esquecerParticipacao,
  formatarCodigo,
  guardarParticipacao,
  iniciais,
  lerCodigo,
  lerMinhasSalas,
  type MinhaParticipacao,
} from '../util/salas'
import {
  jogosDaSimulacao,
  lerGols,
  palpitesDoSimulador,
  podePalpitar,
  preencherComPalpitesDaSumula,
  rodadaInicial,
  type PalpitesUsuario,
  type PlacarDigitado,
} from '../util/simulador'
import { Sigla } from '../componentes/Sigla'

const MAXIMO = 5
const libertadores = ZONAS.find((z) => z.nome === 'Libertadores')!
const rebaixamento = ZONAS.find((z) => z.nome === 'Rebaixamento')!

/** /sala/:codigo */
export function PaginaSala() {
  const { codigo: codigoDaUrl = '' } = useParams()
  const codigo = lerCodigo(codigoDaUrl)
  if (!codigo) {
    return (
      <Pagina className="pt-9 pb-12">
        <SalaNaoEncontrada mensagem="Esse código de sala não existe. Confira se copiou o link inteiro." />
      </Pagina>
    )
  }
  return <CarregarSala key={codigo} codigo={codigo} />
}

function CarregarSala({ codigo }: { codigo: string }) {
  const sala = useSala(codigo)
  const partidas = usePartidas()
  const times = useTimes()
  const palpitesSumula = usePalpites()

  if (sala.isPending || partidas.isPending || times.isPending) {
    return (
      <Pagina className="pt-9 pb-12">
        <Carregando />
      </Pagina>
    )
  }
  if (sala.isError) {
    return (
      <Pagina className="pt-9 pb-12">
        {sala.error instanceof ErroSala && sala.error.status === 404 ? (
          <SalaNaoEncontrada mensagem="Confira o código ou peça o link de novo. Salas sem nenhum uso por 60 dias são apagadas." />
        ) : (
          <Erro tentarDeNovo={() => sala.refetch()} />
        )}
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

  return <TelaSala sala={sala.data} partidas={partidas.data} times={times.data} palpitesSumula={palpitesSumula.data} />
}

function SalaNaoEncontrada({ mensagem }: { mensagem: string }) {
  return (
    <div className="py-16 text-center">
      <p className="text-2xl font-black">Sala não encontrada</p>
      <p className="mt-2 text-texto-2">{mensagem}</p>
      <Link to="/sala" className="mt-6 inline-block font-bold text-destaque hover:underline">
        Criar uma sala ou entrar com outro código →
      </Link>
    </div>
  )
}

type PropsTela = {
  sala: Sala
  partidas: Partida[]
  times: { lista: Time[]; porId: Map<number, Time> }
  palpitesSumula: Map<number, Palpite> | undefined
}

type Simulado = {
  participante: ParticipanteSala
  palpites: PalpitesUsuario
  tabela: LinhaClassificacao[]
  palpitados: number
}

function TelaSala({ sala, partidas, times, palpitesSumula }: PropsTela) {
  const navegar = useNavigate()
  const queryClient = useQueryClient()
  const [confirmar, janelaConfirmacao] = useConfirmacao()
  const [minhas, setMinhas] = useState(lerMinhasSalas)
  const minha = minhas[sala.codigo] as MinhaParticipacao | undefined
  const eu = sala.participantes.find((p) => p.id === minha?.id)
  const [soOlhando, setSoOlhando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  // Link pessoal (#chave=...): abre a sala como a mesma pessoa em outro aparelho.
  useEffect(() => {
    const chave = new URLSearchParams(window.location.hash.slice(1)).get('chave')
    if (!chave) return
    history.replaceState(null, '', window.location.pathname + window.location.search)
    quemSou(sala.codigo, chave)
      .then(({ id }) => {
        guardarParticipacao(sala.codigo, { id, chave, nomeSala: sala.nome, entrouEm: new Date().toISOString() })
        setMinhas(lerMinhasSalas())
      })
      .catch(() => setAviso('Esse link pessoal não vale mais: a pessoa saiu ou foi removida da sala.'))
  }, [sala.codigo, sala.nome])

  // ----- os meus palpites: editados aqui na hora e gravados na sala logo depois -----
  // O rascunho é o que está nos campos, inclusive placar pela metade (um lado só). Para a sala vão só os jogos com
  // os dois lados (o formato do link de compartilhar), então o rascunho continua valendo na tela depois de gravar:
  // se a tela passasse a mostrar o que voltou da sala, o número digitado sumiria.
  const [rascunho, setRascunho] = useState<PalpitesUsuario | null>(null)
  // O que esta aba gravou por último (null: ainda nada; vale o que está na sala).
  const [gravado, setGravado] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)
  const [erroAoSalvar, setErroAoSalvar] = useState<string | null>(null)

  const naSala = eu?.palpites ?? ''
  const codigoRascunho = rascunho ? (codificarPalpites(rascunho) ?? '') : null
  const pendente = codigoRascunho !== null && codigoRascunho !== (gravado ?? naSala)
  // Se a sala mudou por outro aparelho (link pessoal) e aqui não há nada para gravar, vale o que está na sala.
  const usarRascunho = rascunho !== null && (pendente || gravado === null || gravado === naSala)
  const pelaMetade = usarRascunho
    ? Object.values(rascunho).filter((p) => (p.mandante === null) !== (p.visitante === null)).length
    : 0

  useEffect(() => {
    if (!pendente || codigoRascunho === null || !minha || !eu) return
    const timer = setTimeout(
      async () => {
        try {
          await gravarPalpitesNaSala(sala.codigo, minha.id, minha.chave, codigoRascunho)
          queryClient.setQueryData<{ sala: Sala; etag: string | null }>(['sala', sala.codigo], (atual) =>
            atual
              ? {
                  ...atual,
                  sala: {
                    ...atual.sala,
                    participantes: atual.sala.participantes.map((p) => (p.id === minha.id ? { ...p, palpites: codigoRascunho } : p)),
                  },
                }
              : atual,
          )
          setGravado(codigoRascunho)
          setErroAoSalvar(null)
        } catch (erro) {
          if (erro instanceof ErroSala && erro.status === 401) {
            esquecerParticipacao(sala.codigo)
            setMinhas(lerMinhasSalas())
            setRascunho(null)
            setGravado(null)
            setAviso('Você não está mais nesta sala.')
            return
          }
          setErroAoSalvar(erro instanceof ErroSala ? erro.message : 'Não foi possível salvar.')
          setTentativa((t) => t + 1)
        }
      },
      erroAoSalvar ? 5000 : 1200,
    )
    return () => clearTimeout(timer)
    // erroAoSalvar fica de fora: só define a espera da próxima tentativa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendente, codigoRascunho, tentativa, minha, eu?.id, sala.codigo, queryClient])

  // Não deixa fechar a aba com palpite ainda não gravado.
  useEffect(() => {
    if (!pendente) return
    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [pendente])

  // ----- tabela de cada pessoa -----
  const restantes = useMemo(() => partidas.filter(podePalpitar), [partidas])
  const real = useMemo(() => calcularClassificacao(times.lista, jogosDaSimulacao(partidas, {})), [partidas, times.lista])
  const posicaoReal = useMemo(() => new Map(real.map((l) => [l.time.id, l.posicao])), [real])

  const simulados: Simulado[] = useMemo(
    () =>
      sala.participantes.map((participante) => {
        const palpites =
          participante.id === eu?.id && usarRascunho ? rascunho : (decodificarPalpites(participante.palpites) ?? {})
        return {
          participante,
          palpites,
          tabela: calcularClassificacao(times.lista, jogosDaSimulacao(partidas, palpites)),
          palpitados: restantes.filter((p) => palpites[p.id]?.mandante != null && palpites[p.id]?.visitante != null).length,
        }
      }),
    [sala.participantes, eu?.id, usarRascunho, rascunho, times.lista, partidas, restantes],
  )

  const [escolhido, setEscolhido] = useState<number | null>(null)
  const selecionado =
    simulados.find((s) => s.participante.id === escolhido) ?? simulados.find((s) => s.participante.id === eu?.id) ?? simulados[0]
  const ehEu = selecionado?.participante.id === eu?.id
  const [visao, setVisao] = useState<'palpites' | 'comparar'>('palpites')

  const rodadas = useMemo(() => [...new Set(partidas.map((p) => p.rodada))].sort((a, b) => a - b), [partidas])
  const [rodada, setRodada] = useState(() => rodadaInicial(partidas))

  const meusPalpites = simulados.find((s) => s.participante.id === eu?.id)?.palpites ?? {}

  // Parte do que está na tela (que pode ser a versão da sala, se ela mudou por outro aparelho).
  function mudarMeus(novos: (atuais: PalpitesUsuario) => PalpitesUsuario) {
    setRascunho(novos(meusPalpites))
  }

  function alterar(partidaId: number, lado: keyof PlacarDigitado, texto: string) {
    mudarMeus((atuais) => {
      const atual = atuais[partidaId] ?? { mandante: null, visitante: null }
      const novo = { ...atual, [lado]: lerGols(texto) }
      const copia = { ...atuais }
      if (novo.mandante === null && novo.visitante === null) delete copia[partidaId]
      else copia[partidaId] = novo
      return copia
    })
  }

  async function trazerDoSimulador() {
    const doSimulador = palpitesDoSimulador()
    if (Object.keys(doSimulador).length === 0) {
      setAviso('Você ainda não tem palpites no Simulador deste navegador.')
      return
    }
    if (
      Object.keys(meusPalpites).length > 0 &&
      !(await confirmar({
        titulo: 'Trazer do Simulador?',
        texto: 'Os seus palpites nesta sala vão ser trocados pelos que você fez no Simulador.',
        confirmar: 'Trazer palpites',
        perigo: true,
      }))
    )
      return
    mudarMeus(() => doSimulador)
  }

  async function limpar() {
    const apagar = await confirmar({
      titulo: 'Apagar seus palpites da sala?',
      texto: 'Os seus amigos também vão deixar de ver esses palpites. Não dá para desfazer.',
      confirmar: 'Apagar palpites',
      perigo: true,
    })
    if (apagar) mudarMeus(() => ({}))
  }

  async function sair() {
    if (!minha || !eu) return
    const sairMesmo = await confirmar({
      titulo: 'Sair da sala?',
      texto: `Os seus palpites vão sair da sala "${sala.nome}". Para voltar, alguém precisa mandar o link de novo.`,
      confirmar: 'Sair da sala',
      perigo: true,
    })
    if (!sairMesmo) return
    try {
      await sairOuRemover(sala.codigo, minha.id, minha.chave)
    } catch (erro) {
      if (!(erro instanceof ErroSala && erro.status === 401)) {
        setAviso(erro instanceof ErroSala ? erro.message : 'Não foi possível sair agora.')
        return
      }
    }
    esquecerParticipacao(sala.codigo)
    queryClient.removeQueries({ queryKey: ['sala', sala.codigo] })
    navegar('/sala')
  }

  async function remover(alvo: ParticipanteSala) {
    if (!minha) return
    const removerMesmo = await confirmar({
      titulo: `Remover ${alvo.nome}?`,
      texto: `${alvo.nome} sai da sala e os palpites somem. Se tiver o link, pode entrar de novo enquanto houver vaga.`,
      confirmar: 'Remover',
      perigo: true,
    })
    if (!removerMesmo) return
    try {
      await sairOuRemover(sala.codigo, alvo.id, minha.chave)
      setEscolhido(null)
      await queryClient.invalidateQueries({ queryKey: ['sala', sala.codigo] })
    } catch (erro) {
      setAviso(erro instanceof ErroSala ? erro.message : 'Não foi possível remover agora.')
    }
  }

  async function copiar(texto: string, url: string, mensagem: string) {
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title: 'Sala na BraSúmula', text: texto, url })
        return
      } catch (erro) {
        if ((erro as Error).name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setAviso(mensagem)
    } catch {
      setAviso(`Copie o link: ${url}`)
    }
  }

  const linkConvite = `${window.location.origin}/sala/${formatarCodigo(sala.codigo)}`
  const cheia = sala.participantes.length >= MAXIMO

  useEffect(() => {
    if (!aviso) return
    const timer = setTimeout(() => setAviso(null), 7000)
    return () => clearTimeout(timer)
  }, [aviso])

  const precisaEntrar = !eu && !soOlhando

  return (
    <Pagina className="pt-9 pb-12">
      {janelaConfirmacao}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <Rotulo>SALA · CÓDIGO {formatarCodigo(sala.codigo)}</Rotulo>
          <TituloPagina className="mt-2">{sala.nome}</TituloPagina>
        </div>
        <div className="grid w-full grid-cols-2 gap-2.5 sm:flex sm:w-auto sm:flex-wrap">
          {!cheia && (
            <BotaoPrincipal
              className="col-span-2"
              onClick={() =>
                copiar(`Entra na minha sala "${sala.nome}" no simulador da BraSúmula:`, linkConvite, 'Convite copiado! É só colar no grupo.')
              }
            >
              Copiar convite · {sala.participantes.length}/{MAXIMO}
            </BotaoPrincipal>
          )}
          {eu && minha && (
            <>
              <button
                type="button"
                title="Copia um link só seu, para usar a sala como você no celular ou em outro computador"
                className={BOTAO_SECUNDARIO}
                onClick={() =>
                  copiar(
                    'Meu link pessoal da sala',
                    `${linkConvite}#chave=${minha.chave}`,
                    'Link pessoal copiado. Abra no seu outro aparelho e não mande para ninguém: quem tiver esse link mexe nos seus palpites.',
                  )
                }
              >
                <span className="sm:hidden">Outro aparelho</span>
                <span className="hidden sm:inline">Abrir em outro aparelho</span>
              </button>
              <button type="button" className={`${BOTAO_SECUNDARIO} text-vermelho`} onClick={sair}>
                Sair da sala
              </button>
            </>
          )}
        </div>
      </div>
      {aviso && (
        <p role="status" className="mt-3 font-mono text-sm font-bold break-all">
          {aviso}
        </p>
      )}

      {precisaEntrar ? (
        <Entrar sala={sala} cheia={cheia} aoEntrar={() => setMinhas(lerMinhasSalas())} aoSoOlhar={() => setSoOlhando(true)} />
      ) : (
        <>
          <div role="tablist" aria-label="Pessoas na sala" className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
            {simulados.map((s) => (
              <AbaParticipante
                key={s.participante.id}
                simulado={s}
                total={restantes.length}
                ativo={s === selecionado && visao === 'palpites'}
                souEu={s.participante.id === eu?.id}
                aoEscolher={() => {
                  setEscolhido(s.participante.id)
                  setVisao('palpites')
                }}
              />
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <Abas
              rotulo="O que ver"
              valor={visao}
              aoMudar={setVisao}
              opcoes={[
                { valor: 'palpites', rotulo: 'Palpites e tabela' },
                { valor: 'comparar', rotulo: 'Comparar tabelas' },
              ]}
            />
            {!eu && (
              <p className="text-sm text-texto-2">
                Você está só olhando.{' '}
                {!cheia && (
                  <button type="button" className="cursor-pointer font-bold text-destaque hover:underline" onClick={() => setSoOlhando(false)}>
                    Entrar na sala
                  </button>
                )}
              </p>
            )}
          </div>

          {visao === 'comparar' ? (
            <Comparar simulados={simulados} posicaoReal={posicaoReal} times={times.lista} euId={eu?.id} />
          ) : (
            selecionado && (
              <>
                <Resumo simulado={selecionado} souEu={ehEu} />

                {ehEu && (
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <BotaoPrincipal
                      onClick={() => palpitesSumula && mudarMeus((atuais) => preencherComPalpitesDaSumula(partidas, atuais, palpitesSumula))}
                      className={palpitesSumula ? '' : 'pointer-events-none opacity-50'}
                    >
                      Preencher com o palpite da Súmula
                    </BotaoPrincipal>
                    <button
                      type="button"
                      onClick={trazerDoSimulador}
                      className="cursor-pointer border-2 border-texto bg-superficie px-[18px] py-3 text-sm font-extrabold"
                    >
                      Trazer do meu Simulador
                    </button>
                    <button
                      type="button"
                      onClick={limpar}
                      disabled={Object.keys(meusPalpites).length === 0}
                      className="cursor-pointer border-2 border-texto bg-superficie px-[18px] py-3 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Limpar
                    </button>
                    <EstadoGravacao estado={erroAoSalvar ? 'erro' : pendente ? 'salvando' : 'salvo'} erro={erroAoSalvar} />
                  </div>
                )}
                {ehEu && pelaMetade > 0 && (
                  <p className="mt-2.5 text-[13px] text-texto-2">
                    {pelaMetade === 1 ? '1 placar está' : `${pelaMetade} placares estão`} com um lado só. Ele só conta (e só vai
                    para a sala) quando os dois lados estiverem preenchidos.
                  </p>
                )}

                <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
                  <section aria-label="Jogos da rodada">
                    <NavegacaoRodadas
                      rodadas={rodadas}
                      rodada={rodada}
                      aoMudar={setRodada}
                      detalhe={(r) => {
                        const faltam = restantes.filter(
                          (p) => p.rodada === r && (selecionado.palpites[p.id]?.mandante == null || selecionado.palpites[p.id]?.visitante == null),
                        ).length
                        return faltam ? `${faltam} sem palpite` : undefined
                      }}
                    />
                    <a href="#tabela-da-sala" className="mt-2 block text-right text-[13px] font-bold text-destaque lg:hidden">
                      Ver a tabela ↓
                    </a>
                    <ul className="mt-3 flex flex-col gap-2.5">
                      {partidas
                        .filter((p) => p.rodada === rodada)
                        .sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id)
                        .map((partida) => {
                          const mandante = times.porId.get(partida.mandanteId)
                          const visitante = times.porId.get(partida.visitanteId)
                          if (!mandante || !visitante) return null
                          const outros = simulados.filter((s) => s !== selecionado)
                          return (
                            <JogoDoSimulador
                              key={partida.id}
                              partida={partida}
                              mandante={mandante}
                              visitante={visitante}
                              palpite={selecionado.palpites[partida.id]}
                              sugestao={ehEu ? palpitesSumula?.get(partida.id) : undefined}
                              somenteLeitura={!ehEu}
                              aoAlterar={ehEu ? (lado, texto) => alterar(partida.id, lado, texto) : undefined}
                              rotulo={ehEu ? 'Seu palpite' : `Palpite de ${selecionado.participante.nome}`}
                              corPlacar={ehEu ? undefined : corDoParticipante(selecionado.participante.cor)}
                            >
                              {podePalpitar(partida) && outros.length > 0 && (
                                <PalpitesDosOutros partidaId={partida.id} outros={outros} euId={eu?.id} />
                              )}
                            </JogoDoSimulador>
                          )
                        })}
                    </ul>
                  </section>

                  <section id="tabela-da-sala" aria-label="Tabela final" className="scroll-mt-4 lg:sticky lg:top-4">
                    <TabelaSimulada
                      linhas={selecionado.tabela}
                      posicaoReal={posicaoReal}
                      titulo={
                        <div className="flex items-center gap-2.5">
                          <Avatar participante={selecionado.participante} tamanho={26} />
                          <h2 className="min-w-0 truncate text-xl font-black">
                            Tabela final {ehEu ? 'de você' : `de ${selecionado.participante.nome}`}
                          </h2>
                          {eu?.dono && !ehEu && (
                            <button
                              type="button"
                              onClick={() => remover(selecionado.participante)}
                              className="ml-auto flex-none cursor-pointer text-xs font-bold text-vermelho hover:underline"
                            >
                              Remover da sala
                            </button>
                          )}
                        </div>
                      }
                    />
                    <p className="mt-2 text-xs text-texto-2">
                      ▲▼ comparam com a{' '}
                      <Link to="/" className="font-bold text-destaque hover:underline">
                        tabela de verdade
                      </Link>
                      . Os jogos que já aconteceram valem o resultado real.
                    </p>
                  </section>
                </div>
              </>
            )
          )}
        </>
      )}
    </Pagina>
  )
}

const BOTAO_SECUNDARIO =
  'cursor-pointer border-2 border-texto bg-superficie px-[18px] py-3 text-sm font-extrabold transition-[transform,box-shadow] duration-75 hover:shadow-[3px_3px_0_var(--texto)] active:translate-x-px active:translate-y-px active:shadow-none'

/** Se os meus palpites já estão na sala: girando enquanto grava, verde quando gravou, vermelho se falhou. */
function EstadoGravacao({ estado, erro }: { estado: 'salvando' | 'salvo' | 'erro'; erro: string | null }) {
  return (
    <span
      role="status"
      className={`inline-flex items-center gap-2 border-2 px-3.5 py-[11px] font-mono text-xs font-extrabold tracking-[1px] uppercase sm:ml-auto ${
        estado === 'erro' ? 'border-vermelho text-vermelho' : estado === 'salvo' ? 'border-verde text-verde' : 'border-borda text-texto-2'
      }`}
    >
      {estado === 'salvando' && <span aria-hidden className="size-3.5 flex-none animate-spin border-2 border-borda border-t-lima" />}
      {estado === 'salvo' && (
        <span aria-hidden className="grid size-4 flex-none place-items-center bg-verde">
          <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="square">
            <path d="M2 6.5 5 9l5-6" />
          </svg>
        </span>
      )}
      {estado === 'erro' && (
        <span aria-hidden className="grid size-4 flex-none place-items-center bg-vermelho text-[11px] text-white">
          !
        </span>
      )}
      {estado === 'salvando' ? 'Salvando…' : estado === 'salvo' ? 'Salvo na sala' : 'Não salvou, tentando de novo'}
      {estado === 'erro' && erro && <span className="sr-only">: {erro}</span>}
    </span>
  )
}

function Entrar({
  sala,
  cheia,
  aoEntrar,
  aoSoOlhar,
}: {
  sala: Sala
  cheia: boolean
  aoEntrar: () => void
  aoSoOlhar: () => void
}) {
  const queryClient = useQueryClient()
  const [nome, setNome] = useState('')
  const [doSimulador] = useState(palpitesDoSimulador)
  const [trazer, setTrazer] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const quantosNoSimulador = Object.keys(doSimulador).length

  async function entrar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const { id, chave } = await entrarNaSala(sala.codigo, nome)
      guardarParticipacao(sala.codigo, { id, chave, nomeSala: sala.nome, entrouEm: new Date().toISOString() })
      const codigoPalpites = trazer ? codificarPalpites(doSimulador) : null
      if (codigoPalpites) await gravarPalpitesNaSala(sala.codigo, id, chave, codigoPalpites).catch(() => {})
      await queryClient.invalidateQueries({ queryKey: ['sala', sala.codigo] })
      aoEntrar()
    } catch (e) {
      setErro(e instanceof ErroSala ? e.message : 'Não foi possível entrar. Tente de novo.')
      setEnviando(false)
    }
  }

  return (
    <div className="mt-7 grid items-start gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      {cheia ? (
        <div className="corte-duplo bg-grafite p-6 text-creme">
          <Rotulo className="text-lima">SALA CHEIA</Rotulo>
          <p className="mt-3 text-2xl font-black">Já tem {MAXIMO} pessoas nesta sala.</p>
          <p className="mt-2 text-sm text-cinza">Você pode olhar os palpites delas, ou criar a sua própria sala.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={aoSoOlhar} className="cursor-pointer border-2 border-lima bg-lima px-[18px] py-3 text-sm font-extrabold text-grafite">
              Só olhar
            </button>
            <Link to="/sala" className="border-2 border-creme px-[18px] py-3 text-sm font-extrabold text-creme hover:text-lima">
              Criar minha sala
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={entrar} className="corte-duplo bg-grafite p-6 text-creme">
          <Rotulo className="text-lima">VOCÊ FOI CONVIDADO</Rotulo>
          <p className="mt-3 text-2xl leading-tight font-black">Entre na sala para fazer os seus palpites.</p>
          <label htmlFor="nome-entrar" className="mt-5 block text-sm font-bold">
            Qual é o seu nome?
          </label>
          <input
            id="nome-entrar"
            required
            autoFocus
            maxLength={20}
            autoComplete="given-name"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            placeholder="Ex.: Lucas"
            className="mt-1.5 w-full border-2 border-creme bg-transparent px-3 py-2.5 text-base font-bold text-creme placeholder:text-cinza/70 focus:border-lima focus:outline-none"
          />
          <p className="mt-1 text-xs text-cinza">É como os outros vão ver você na sala.</p>
          {quantosNoSimulador > 0 && (
            <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={trazer}
                onChange={(evento) => setTrazer(evento.target.checked)}
                className="mt-0.5 size-4 flex-none accent-lima"
              />
              <span>Começar com os {quantosNoSimulador} palpites que já fiz no Simulador</span>
            </label>
          )}
          {erro && (
            <p role="alert" className="mt-4 text-sm font-bold text-[#ff8a8d]">
              {erro}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={enviando}
              className="cursor-pointer border-2 border-lima bg-lima px-[18px] py-3 text-sm font-extrabold text-grafite shadow-[4px_4px_0_#f2f1ec] transition-[transform,box-shadow] duration-75 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-wait disabled:opacity-60"
            >
              {enviando ? 'Entrando…' : 'Entrar na sala'}
            </button>
            <button type="button" onClick={aoSoOlhar} className="cursor-pointer text-sm font-bold text-cinza hover:text-creme">
              Só olhar
            </button>
          </div>
        </form>
      )}

      <div className="border-2 border-texto bg-superficie p-5">
        <Rotulo>QUEM JÁ ESTÁ NA SALA · {sala.participantes.length}/{MAXIMO}</Rotulo>
        <ul className="mt-3 flex flex-col gap-2.5">
          {sala.participantes.map((p) => (
            <li key={p.id} className="flex items-center gap-2.5 font-bold">
              <Avatar participante={p} tamanho={30} />
              {p.nome}
              {p.dono && <span className="font-mono text-[11px] text-texto-2">criou a sala</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Avatar({ participante, tamanho }: { participante: ParticipanteSala; tamanho: number }) {
  const cor = corDoParticipante(participante.cor)
  return (
    <span
      aria-hidden
      className="grid flex-none place-items-center rounded-full font-black"
      style={{ width: tamanho, height: tamanho, background: cor.fundo, color: cor.texto, fontSize: Math.round(tamanho * 0.36) }}
    >
      {iniciais(participante.nome)}
    </span>
  )
}

function AbaParticipante({
  simulado,
  total,
  ativo,
  souEu,
  aoEscolher,
}: {
  simulado: Simulado
  total: number
  ativo: boolean
  souEu: boolean
  aoEscolher: () => void
}) {
  const { participante, palpitados } = simulado
  const cor = corDoParticipante(participante.cor)
  return (
    <button
      type="button"
      role="tab"
      aria-selected={ativo}
      onClick={aoEscolher}
      className={`flex min-w-0 cursor-pointer items-center gap-3 border-2 border-texto px-3 py-2.5 text-left transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 ${
        ativo ? '-translate-y-0.5 bg-grafite text-creme' : 'bg-superficie text-texto'
      }`}
      style={ativo ? ({ boxShadow: `4px 4px 0 ${cor.fundo}` } as CSSProperties) : undefined}
    >
      <Avatar participante={participante} tamanho={36} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[15px] font-extrabold">
          {participante.nome}
          {souEu && <span className="font-medium opacity-70"> (você)</span>}
        </span>
        <span className={`block h-[5px] ${ativo ? 'bg-[#333]' : 'bg-superficie-2'}`}>
          <span
            className="block h-full transition-[width] duration-500"
            style={{ width: `${total ? (palpitados / total) * 100 : 0}%`, background: cor.fundo }}
          />
        </span>
        <span className="font-mono text-[11px] font-bold opacity-75">
          {palpitados}/{total} palpites
        </span>
      </span>
    </button>
  )
}

function Resumo({ simulado, souEu }: { simulado: Simulado; souEu: boolean }) {
  const { tabela, participante } = simulado
  const campeao = tabela[0]
  const quem = souEu ? 'VOCÊ' : participante.nome.toUpperCase()
  const naFaixa = (de: number, ate: number) => tabela.filter((l) => l.posicao >= de && l.posicao <= ate)

  return (
    <div className="mt-5 grid gap-3 md:grid-cols-3">
      <div className="corte-canto flex items-center gap-3.5 bg-grafite px-[18px] py-4 text-creme">
        {campeao && <Escudo time={campeao.time} tamanho={44} />}
        <div className="min-w-0">
          <Rotulo className="text-lima">CAMPEÃO {souEu ? 'PARA' : 'DE'} {quem}</Rotulo>
          <div className="mt-1 truncate text-2xl font-black">{campeao?.time.nomeCurto ?? '—'}</div>
        </div>
      </div>
      <ListaTimes rotulo="LIBERTADORES" cor="text-azul" linhas={naFaixa(libertadores.de, libertadores.ate)} />
      <ListaTimes rotulo="REBAIXADOS" cor="text-vermelho" linhas={naFaixa(rebaixamento.de, rebaixamento.ate)} />
    </div>
  )
}

function ListaTimes({ rotulo, cor, linhas }: { rotulo: string; cor: string; linhas: LinhaClassificacao[] }) {
  return (
    <div className="border-2 border-texto bg-superficie px-[18px] py-3.5">
      <Rotulo className={cor}>{rotulo}</Rotulo>
      <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-2">
        {linhas.map((l) => (
          <li key={l.time.id} className="flex items-center gap-1.5 text-[13px] font-bold" title={l.time.nomeCurto}>
            <Escudo time={l.time} tamanho={22} />
            {l.time.sigla}
          </li>
        ))}
      </ul>
    </div>
  )
}

function PalpitesDosOutros({ partidaId, outros, euId }: { partidaId: number; outros: Simulado[]; euId: number | undefined }) {
  return (
    <ul aria-label="Palpites dos outros" className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1.5 border-t border-dashed border-borda pt-2">
      {outros.map((o) => {
        const p = o.palpites[partidaId]
        const texto = p?.mandante != null && p.visitante != null ? `${p.mandante}×${p.visitante}` : '—'
        const nome = o.participante.id === euId ? 'Você' : o.participante.nome
        return (
          <li key={o.participante.id} className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-texto-2">
            <Avatar participante={o.participante} tamanho={16} />
            <span className="sr-only">{nome}:</span>
            {texto}
          </li>
        )
      })}
    </ul>
  )
}

/** Uma linha por time, uma coluna por pessoa: a posição final que cada um previu. */
function Comparar({
  simulados,
  posicaoReal,
  times,
  euId,
}: {
  simulados: Simulado[]
  posicaoReal: Map<number, number>
  times: Time[]
  euId: number | undefined
}) {
  const posicoes = simulados.map((s) => new Map(s.tabela.map((l) => [l.time.id, l.posicao])))
  // Ordem: média das posições previstas (empate: a posição de hoje).
  const linhas = times
    .map((time) => {
      const previstas = posicoes.map((m) => m.get(time.id) ?? 0)
      return { time, previstas, media: previstas.reduce((a, b) => a + b, 0) / previstas.length, hoje: posicaoReal.get(time.id) ?? 0 }
    })
    .sort((a, b) => a.media - b.media || a.hoje - b.hoje)

  const colunas: CSSProperties = { gridTemplateColumns: `minmax(0,1fr) repeat(${simulados.length}, 44px) 44px` }

  return (
    <section aria-label="Comparação das tabelas" className="mt-5">
      <p className="mb-3 max-w-[720px] text-sm text-texto-2">
        A posição final de cada time na tabela de cada um. Os times estão na ordem da média de vocês; a última coluna é a
        posição de hoje.
      </p>
      <div className="overflow-x-auto border-2 border-texto bg-superficie">
        <div role="table" aria-label="Posição final prevista por cada pessoa" className="min-w-[340px]">
          <div role="row" style={colunas} className="grid h-12 items-center gap-1 border-b-2 border-texto px-3">
            <span role="columnheader" className="font-mono text-[11px] font-extrabold tracking-[1px] text-texto-2">
              TIME
            </span>
            {simulados.map((s) => (
              <span key={s.participante.id} role="columnheader" className="grid place-items-center" title={s.participante.nome}>
                <Avatar participante={s.participante} tamanho={28} />
                <span className="sr-only">{s.participante.id === euId ? 'Você' : s.participante.nome}</span>
              </span>
            ))}
            <span role="columnheader" className="text-center font-mono text-[11px] font-extrabold tracking-[1px] text-texto-2">
              <Sigla dica="Posição do time hoje, na tabela de verdade">HOJE</Sigla>
            </span>
          </div>
          {linhas.map(({ time, previstas, hoje }) => (
            <div key={time.id} role="row" style={colunas} className="grid h-10 items-center gap-1 border-b border-borda px-3 last:border-b-0">
              <div role="cell" className="flex min-w-0 items-center gap-2">
                <Escudo time={time} tamanho={22} />
                <span className="truncate text-sm font-bold">
                  <span className="sm:hidden">{time.sigla}</span>
                  <span className="hidden sm:inline">{time.nomeCurto}</span>
                </span>
              </div>
              {previstas.map((posicao, i) => (
                <CelulaPosicao key={simulados[i].participante.id} posicao={posicao} />
              ))}
              <span role="cell" className="text-center font-mono text-[13px] text-texto-2 tabular-nums">
                {hoje}º
              </span>
            </div>
          ))}
        </div>
      </div>
      <LegendaZonas className="mt-3" />
    </section>
  )
}

function CelulaPosicao({ posicao }: { posicao: number }) {
  const zona = zonaDaPosicao(posicao)
  return (
    <span role="cell" className="flex h-7 items-stretch justify-center">
      <span className={`flex w-full items-center justify-center gap-1 text-[15px] font-black tabular-nums ${posicao === 1 ? 'bg-lima text-grafite' : ''}`}>
        <span aria-hidden className={`h-4 w-1 ${zona?.cor ?? 'bg-transparent'}`} />
        {posicao}º
      </span>
    </span>
  )
}

