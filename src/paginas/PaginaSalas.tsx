import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { criarSala, ErroSala, gravarPalpitesNaSala } from '../api/salas'
import { Pagina } from '../componentes/Pagina'
import { Rotulo, TituloPagina } from '../componentes/TituloPagina'
import { COMPETICAO, TEMPORADA } from '../config'
import { formatarCodigo, guardarParticipacao, lerCodigo, lerMinhasSalas } from '../util/salas'
import { codificarPalpites } from '../util/compartilhar'
import { palpitesDoSimulador } from '../util/simulador'

/** /sala: criar uma sala, entrar com um código e voltar para as salas em que a pessoa já está. */
export function PaginaSalas() {
  const navegar = useNavigate()
  const [minhas] = useState(lerMinhasSalas)
  const [codigoDigitado, setCodigoDigitado] = useState('')
  const [erroCodigo, setErroCodigo] = useState<string | null>(null)

  function irParaSala(evento: FormEvent) {
    evento.preventDefault()
    const codigo = lerCodigo(codigoDigitado)
    if (!codigo) {
      setErroCodigo('O código tem 6 letras e números, como K7P-2QX.')
      return
    }
    navegar(`/sala/${formatarCodigo(codigo)}`)
  }

  const salas = Object.entries(minhas).sort(([, a], [, b]) => b.entrouEm.localeCompare(a.entrouEm))

  return (
    <Pagina className="pt-9 pb-12">
      <TituloPagina>Sala</TituloPagina>
      <p className="mt-[18px] max-w-[720px] text-[15px] leading-[1.55] text-pretty text-texto-2">
        Simule o resto do campeonato com até 4 amigos. Cada um faz os próprios palpites, vê os dos outros e no fim vocês
        comparam as tabelas. Sem cadastro: é só mandar o link.
      </p>

      <div className="mt-7 grid items-start gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <FormularioCriar aoCriar={(codigo) => navegar(`/sala/${formatarCodigo(codigo)}`)} />

        <div className="flex flex-col gap-5">
          <form onSubmit={irParaSala} className="border-2 border-texto bg-superficie p-5">
            <Rotulo>RECEBEU UM CÓDIGO?</Rotulo>
            <label className="mt-3 block text-sm font-bold" htmlFor="codigo-sala">
              Código da sala
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="codigo-sala"
                value={codigoDigitado}
                onChange={(evento) => {
                  setCodigoDigitado(evento.target.value)
                  setErroCodigo(null)
                }}
                placeholder="K7P-2QX"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-invalid={erroCodigo !== null}
                aria-describedby={erroCodigo ? 'erro-codigo' : undefined}
                className="min-w-0 flex-1 border-2 border-texto bg-fundo px-3 py-2.5 font-mono text-base font-extrabold tracking-[2px] uppercase placeholder:text-texto-3 placeholder:normal-case focus:bg-superficie focus:outline-2 focus:outline-offset-2 focus:outline-lima"
              />
              <button
                type="submit"
                className="cursor-pointer border-2 border-texto bg-texto px-4 text-sm font-extrabold text-texto-invertido"
              >
                Entrar
              </button>
            </div>
            {erroCodigo && (
              <p id="erro-codigo" role="alert" className="mt-2 text-sm font-bold text-vermelho">
                {erroCodigo}
              </p>
            )}
          </form>

          {salas.length > 0 && (
            <section aria-labelledby="minhas-salas" className="border-2 border-texto bg-superficie p-5">
              <h2 id="minhas-salas">
                <Rotulo>MINHAS SALAS</Rotulo>
              </h2>
              <ul className="mt-2">
                {salas.map(([codigo, sala]) => (
                  <li key={codigo} className="border-b border-borda last:border-b-0">
                    <Link
                      to={`/sala/${formatarCodigo(codigo)}`}
                      className="flex items-center justify-between gap-3 py-2.5 font-bold hover:text-destaque"
                    >
                      <span className="truncate">{sala.nomeSala}</span>
                      <span className="flex-none font-mono text-xs text-texto-2">{formatarCodigo(codigo)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </Pagina>
  )
}

function FormularioCriar({ aoCriar }: { aoCriar: (codigo: string) => void }) {
  const [nomeSala, setNomeSala] = useState('')
  const [seuNome, setSeuNome] = useState('')
  const [doSimulador] = useState(palpitesDoSimulador)
  const [trazer, setTrazer] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const quantosNoSimulador = Object.keys(doSimulador).length

  async function criar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const { codigo, participante } = await criarSala({ nome: nomeSala, seuNome, competicao: COMPETICAO, temporada: TEMPORADA })
      guardarParticipacao(codigo, { ...participante, nomeSala: nomeSala.trim(), entrouEm: new Date().toISOString() })
      const codigoPalpites = trazer ? codificarPalpites(doSimulador) : null
      // Se falhar, a sala já existe e os palpites podem ser trazidos lá dentro.
      if (codigoPalpites) await gravarPalpitesNaSala(codigo, participante.id, participante.chave, codigoPalpites).catch(() => {})
      aoCriar(codigo)
    } catch (e) {
      setErro(e instanceof ErroSala ? e.message : 'Não foi possível criar a sala. Tente de novo.')
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={criar} className="corte-duplo bg-grafite p-6 text-creme">
      <Rotulo className="text-lima">CRIAR UMA SALA</Rotulo>
      <Campo rotulo="Nome da sala" id="nome-sala">
        <input
          id="nome-sala"
          required
          maxLength={30}
          value={nomeSala}
          onChange={(evento) => setNomeSala(evento.target.value)}
          placeholder="Ex.: Os Brothers"
          className={CAMPO_ESCURO}
        />
      </Campo>
      <Campo rotulo="Seu nome" id="seu-nome" ajuda="É como os seus amigos vão ver você na sala.">
        <input
          id="seu-nome"
          required
          maxLength={20}
          autoComplete="given-name"
          value={seuNome}
          onChange={(evento) => setSeuNome(evento.target.value)}
          placeholder="Ex.: Maria"
          className={CAMPO_ESCURO}
        />
      </Campo>
      {quantosNoSimulador > 0 && (
        <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={trazer}
            onChange={(evento) => setTrazer(evento.target.checked)}
            className="mt-0.5 size-4 flex-none accent-lima"
          />
          <span>
            Começar com os {quantosNoSimulador} palpites que já fiz no Simulador
            <span className="block text-xs text-cinza">Depois, mexer na sala não muda o seu Simulador, e vice-versa.</span>
          </span>
        </label>
      )}
      {erro && (
        <p role="alert" className="mt-4 text-sm font-bold text-[#ff8a8d]">
          {erro}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="mt-5 cursor-pointer border-2 border-lima bg-lima px-[18px] py-3 text-sm font-extrabold text-grafite shadow-[4px_4px_0_#f2f1ec] transition-[transform,box-shadow] duration-75 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-wait disabled:opacity-60"
      >
        {enviando ? 'Criando…' : 'Criar sala'}
      </button>
    </form>
  )
}

const CAMPO_ESCURO =
  'mt-1.5 w-full border-2 border-creme bg-transparent px-3 py-2.5 text-base font-bold text-creme placeholder:text-cinza/70 focus:border-lima focus:outline-none'

function Campo({ rotulo, id, ajuda, children }: { rotulo: string; id: string; ajuda?: string; children: ReactNode }) {
  return (
    <div className="mt-4">
      <label htmlFor={id} className="block text-sm font-bold">
        {rotulo}
      </label>
      {children}
      {ajuda && <p className="mt-1 text-xs text-cinza">{ajuda}</p>}
    </div>
  )
}
