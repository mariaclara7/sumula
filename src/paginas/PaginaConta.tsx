import { useQuery } from '@tanstack/react-query'
import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import { useTimes } from '../api/consultas'
import { minhasSalasDaConta } from '../api/salas'
import { confirmarIdentidade, esqueciSenha, excluirConta, mudarNome, reenviarConfirmacao, sair } from '../conta/acoes'
import { mensagemDeErro, useConta, type Usuario } from '../conta/conta'
import { classeCampo } from '../conta/estilos'
import { Aviso, Campo, CampoSenha } from '../conta/Formulario'
import { baixarMeusDados } from '../conta/meusDados'
import { Escudo } from '../componentes/Escudo'
import { Carregando } from '../componentes/Estado'
import { Janela } from '../componentes/Janela'
import { Pagina } from '../componentes/Pagina'
import { TituloPagina } from '../componentes/TituloPagina'
import { useConfirmacao } from '../componentes/useConfirmacao'
import { usePreferencias } from '../preferencias'
import { decodificarPalpites } from '../util/compartilhar'
import { coresDoTime } from '../util/cores'
import { corDoParticipante, formatarCodigo, iniciais } from '../util/salas'

type Saida = 'saiu' | 'excluiu' | null

/** /conta: perfil, time do coração, dados, preferências, salas, sair e excluir a conta. */
export function PaginaConta() {
  const { carregando, usuario, atualizar } = useConta()
  const [busca] = useSearchParams()
  // Saiu ou excluiu por aqui: mostra a confirmação (e não manda para "Entrar", como quem chega sem login).
  const [saida, setSaida] = useState<Saida>(null)
  const [perguntarSair, setPerguntarSair] = useState(false)

  // Quem confirmou o e-mail em outra aba volta para esta: ao voltar, confere de novo.
  const precisaConfirmar = usuario !== null && !usuario.emailConfirmado
  useEffect(() => {
    if (!precisaConfirmar) return
    atualizar()
    const aoVoltar = () => atualizar()
    window.addEventListener('focus', aoVoltar)
    return () => window.removeEventListener('focus', aoVoltar)
  }, [precisaConfirmar, atualizar])

  if (carregando) {
    return (
      <Pagina className="pt-9 pb-12">
        <Carregando />
      </Pagina>
    )
  }
  if (!usuario) return saida ? <Despedida saida={saida} /> : <Navigate to="/entrar?voltar=%2Fconta" replace />

  return (
    <Pagina className="pt-8 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <TituloPagina>Minha conta</TituloPagina>
        <button
          type="button"
          onClick={() => setPerguntarSair(true)}
          className="flex cursor-pointer items-center gap-2 border-2 border-texto bg-superficie px-4 py-[11px] text-sm font-extrabold transition-[background-color,color,border-color,transform] duration-200 hover:border-vermelho hover:bg-vermelho hover:text-white active:scale-[.96]"
        >
          Sair da conta →
        </button>
      </div>

      {precisaConfirmar && <ConfirmarEmail usuario={usuario} nova={busca.get('nova') === '1'} />}

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[400px_minmax(0,1fr)]">
        <div className="flex flex-col gap-3.5">
          <Perfil usuario={usuario} />
          <MeuTime />
        </div>
        <div className="grid content-start gap-3.5 md:grid-cols-2">
          <Dados usuario={usuario} />
          <Preferencias usuario={usuario} />
          <MinhasSalas uid={usuario.uid} />
          <ExcluirConta usuario={usuario} aoExcluir={() => setSaida('excluiu')} />
        </div>
      </div>

      {perguntarSair && (
        <Janela rotulo="Sair da conta" aoFechar={() => setPerguntarSair(false)}>
          <div className="flex items-center gap-3.5">
            <Avatar nome={usuario.nome} tamanho={48} />
            <div className="min-w-0">
              <div className="text-[28px] leading-none font-black tracking-[-1px]">Sair da conta?</div>
              <div className="mt-1 truncate text-[13px] text-texto-2">{usuario.email}</div>
            </div>
          </div>
          <p className="text-[15px] leading-normal text-texto-2">
            Seus palpites e salas continuam salvos. Para voltar, é só entrar com o mesmo e-mail.
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              autoFocus
              onClick={() => setPerguntarSair(false)}
              className="h-[50px] cursor-pointer border-2 border-texto bg-superficie text-[15px] font-extrabold transition-transform active:scale-[.96]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={async () => {
                setSaida('saiu')
                setPerguntarSair(false)
                await sair()
              }}
              className="h-[50px] cursor-pointer border-2 border-texto bg-vermelho text-[15px] font-black text-white shadow-[4px_4px_0_var(--texto)] transition-[transform,box-shadow] duration-75 active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              Sair
            </button>
          </div>
        </Janela>
      )}
    </Pagina>
  )
}

/** Depois de sair (ou de excluir a conta): a confirmação do mockup, no lugar da página. */
function Despedida({ saida }: { saida: Exclude<Saida, null> }) {
  return (
    <Pagina className="pt-16 pb-24">
      <div className="mx-auto flex max-w-[460px] flex-col items-center gap-3.5 border-2 border-texto bg-fundo p-8 text-center shadow-[8px_8px_0_var(--texto)]">
        <span aria-hidden className="corte-canto grid size-16 place-items-center bg-grafite text-[28px] font-black text-lima">
          ✓
        </span>
        <h1 className="text-[30px] leading-none font-black tracking-[-1px]">
          {saida === 'saiu' ? 'Você saiu da conta' : 'Conta excluída'}
        </h1>
        <p className="text-sm text-texto-2">
          {saida === 'saiu'
            ? 'Seus palpites ficam salvos. Até a próxima rodada.'
            : 'A conta foi apagada, você saiu de todas as salas e o seu time do coração foi apagado.'}
        </p>
        <div className="mt-1.5 flex flex-wrap justify-center gap-3">
          {saida === 'saiu' && (
            <Link
              to="/entrar"
              className="flex h-12 items-center border-2 border-texto bg-lima px-[22px] text-[15px] font-black text-grafite shadow-[4px_4px_0_var(--texto)] hover:text-grafite"
            >
              Entrar de novo
            </Link>
          )}
          <Link to="/" className="flex h-12 items-center border-2 border-texto bg-superficie px-[22px] text-[15px] font-extrabold text-texto hover:text-texto">
            Ir para o início
          </Link>
        </div>
      </div>
    </Pagina>
  )
}

function Avatar({ nome, tamanho, estilo }: { nome: string; tamanho: number; estilo?: CSSProperties }) {
  return (
    <span
      aria-hidden
      className="grid flex-none place-items-center rounded-full bg-lima font-black text-grafite"
      style={{ width: tamanho, height: tamanho, fontSize: Math.round(tamanho / 3), ...estilo }}
    >
      {iniciais(nome)}
    </span>
  )
}

function ConfirmarEmail({ usuario, nova }: { usuario: Usuario; nova: boolean }) {
  const { atualizar } = useConta()
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const [espera, setEspera] = useState(nova ? 60 : 0)

  // Contagem para não deixar pedir o e-mail de novo a cada segundo (o Firebase também limita).
  useEffect(() => {
    if (espera <= 0) return
    const timer = setTimeout(() => setEspera((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [espera])

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-2 border-texto bg-lima px-5 py-4 text-grafite">
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[11px] font-extrabold tracking-[2px]">{nova ? 'CONTA CRIADA · FALTA UM PASSO' : 'FALTA UM PASSO'}</div>
        <p className="mt-1 text-[15px] font-semibold">
          Confirme o seu e-mail: mandamos um link para <b>{usuario.email}</b>. Sem isso, não dá para entrar nas salas.
        </p>
        {aviso && (
          <p role={aviso.tipo === 'erro' ? 'alert' : 'status'} className="mt-1 text-sm font-bold">
            {aviso.texto}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={async () => {
            await atualizar()
            setAviso({ tipo: 'erro', texto: 'Ainda não aparece como confirmado. Clique no link do e-mail e tente de novo.' })
          }}
          className="cursor-pointer border-2 border-grafite bg-grafite px-4 py-2.5 text-sm font-extrabold text-lima"
        >
          Já confirmei
        </button>
        <button
          type="button"
          disabled={espera > 0}
          onClick={async () => {
            try {
              await reenviarConfirmacao()
              setAviso({ tipo: 'ok', texto: 'Mandamos o e-mail de novo.' })
              setEspera(60)
            } catch (e) {
              setAviso({ tipo: 'erro', texto: mensagemDeErro(e) })
            }
          }}
          className="cursor-pointer border-2 border-grafite px-4 py-2.5 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {espera > 0 ? `Mandar de novo (${espera}s)` : 'Mandar de novo'}
        </button>
      </div>
    </div>
  )
}

/** O cartão escuro: avatar com o anel na cor do time do coração, nome, e-mail e os números da conta. */
function Perfil({ usuario }: { usuario: Usuario }) {
  const { meuTime } = usePreferencias()
  const times = useTimes()
  const time = meuTime === null ? undefined : times.data?.porId.get(meuTime)
  const cor = time ? coresDoTime(time).principal : '#c6f432'
  const salas = useQuery({ queryKey: ['minhas-salas', usuario.uid], queryFn: minhasSalasDaConta })
  const palpites = (salas.data ?? []).reduce((total, s) => {
    const meus = decodificarPalpites(s.meusPalpites || null) ?? {}
    return total + Object.values(meus).filter((p) => p.mandante != null && p.visitante != null).length
  }, 0)
  const desde = usuario.criadaEm
    ? new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(new Date(usuario.criadaEm)).replace('. de ', '/').replace(' de ', '/')
    : '—'

  return (
    <div className="corte-duplo relative overflow-hidden bg-grafite p-6 text-creme">
      {time && (
        <span aria-hidden className="pointer-events-none absolute -right-3.5 -bottom-8 text-[140px] leading-none font-black tracking-[-6px] opacity-[.1]" style={{ color: cor }}>
          {time.sigla}
        </span>
      )}
      <div className="relative flex items-center gap-4">
        <Avatar nome={usuario.nome} tamanho={72} estilo={{ boxShadow: `0 0 0 3px #111, 0 0 0 5px ${cor}` }} />
        <div className="min-w-0">
          <div className="truncate text-[26px] leading-none font-black tracking-[-.5px]">{usuario.nome}</div>
          <div className="mt-1.5 truncate text-[13px] text-cinza">{usuario.email}</div>
        </div>
      </div>
      <dl className="relative mt-[22px] grid grid-cols-3 gap-2.5">
        {[
          [salas.data ? String(salas.data.length) : '…', salas.data?.length === 1 ? 'sala' : 'salas'],
          [salas.data ? String(palpites) : '…', palpites === 1 ? 'palpite' : 'palpites'],
          [desde, 'desde'],
        ].map(([valor, rotulo]) => (
          <div key={rotulo} className="border-t-2 border-lima pt-2">
            <dd className="text-2xl font-black">{valor}</dd>
            <dt className="text-xs text-cinza">{rotulo}</dt>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** Time do coração em grade: um toque escolhe; tocar no escolhido tira a escolha. Fica salvo na conta. */
function MeuTime() {
  const { meuTime, escolherMeuTime } = usePreferencias()
  const times = useTimes()
  const lista = [...(times.data?.lista ?? [])].sort((a, b) => a.nomeCurto.localeCompare(b.nomeCurto, 'pt-BR'))
  const escolhido = meuTime === null ? undefined : times.data?.porId.get(meuTime)

  return (
    <Cartao titulo="Meu time">
      <div className="grid grid-cols-5 gap-2 px-4 py-3">
        {lista.map((time) => {
          const ativo = time.id === meuTime
          return (
            <button
              key={time.id}
              type="button"
              title={time.nomeCurto}
              aria-label={time.nomeCurto}
              aria-pressed={ativo}
              onClick={() => escolherMeuTime(ativo ? null : time.id)}
              className={`grid h-11 cursor-pointer place-items-center border-2 transition-[transform,border-color,background-color] duration-150 hover:-translate-y-0.5 ${
                ativo ? 'border-texto bg-lima' : 'border-superficie-2 bg-superficie'
              }`}
            >
              <Escudo time={time} tamanho={26} circulo />
            </button>
          )
        })}
      </div>
      <p className="px-4 pb-3 text-xs text-texto-2">
        {escolhido
          ? `${escolhido.nomeCurto} fica destacado nas tabelas. Toque de novo para tirar.`
          : 'Escolha um time para ele ficar destacado nas tabelas.'}
      </p>
    </Cartao>
  )
}

function Cartao({ titulo, extra, children, className = '' }: { titulo: string; extra?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-label={titulo} className={`border-2 border-texto bg-superficie ${className}`}>
      <div className="flex items-baseline justify-between gap-3 border-b border-superficie-2 px-4 py-3">
        <h2 className="text-[17px] font-black">{titulo}</h2>
        {extra}
      </div>
      {children}
    </section>
  )
}

function Linha({ rotulo, valor, acao }: { rotulo: string; valor: ReactNode; acao?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-fundo px-4 py-3 last:border-b-0">
      <div className="min-w-0">
        <div className="font-mono text-[10px] font-extrabold tracking-[1.5px] text-texto-2">{rotulo}</div>
        <div className="mt-0.5 truncate text-[15px] font-bold">{valor}</div>
      </div>
      {acao}
    </div>
  )
}

const ACAO = 'flex-none cursor-pointer text-[13px] font-bold text-destaque hover:underline disabled:cursor-wait disabled:opacity-60'

function Dados({ usuario }: { usuario: Usuario }) {
  const { atualizar } = useConta()
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(usuario.nome)
  const [salvando, setSalvando] = useState(false)
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  async function salvar(evento: FormEvent) {
    evento.preventDefault()
    if (!nome.trim()) return
    setAviso(null)
    setSalvando(true)
    try {
      await mudarNome(nome)
      await atualizar()
      setEditando(false)
      setAviso({ tipo: 'ok', texto: 'Nome salvo, também nas suas salas.' })
    } catch (e) {
      setAviso({ tipo: 'erro', texto: mensagemDeErro(e) })
    }
    setSalvando(false)
  }

  async function trocarSenha() {
    setAviso(null)
    try {
      await esqueciSenha(usuario.email)
      setAviso({ tipo: 'ok', texto: `Mandamos um link para ${usuario.email} para você criar a senha nova.` })
    } catch (e) {
      setAviso({ tipo: 'erro', texto: mensagemDeErro(e) })
    }
  }

  return (
    <Cartao titulo="Dados pessoais">
      {editando ? (
        <form onSubmit={salvar} className="flex flex-col gap-2.5 border-b border-fundo px-4 py-3">
          <Campo rotulo="Nome" id="nome">
            <input id="nome" autoFocus maxLength={20} value={nome} onChange={(e) => setNome(e.target.value)} className={classeCampo()} />
          </Campo>
          <div className="flex gap-4">
            <button type="submit" disabled={salvando || !nome.trim()} className={ACAO}>
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditando(false)
                setNome(usuario.nome)
              }}
              className="cursor-pointer text-[13px] font-bold text-texto-2 hover:text-texto"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <Linha
          rotulo="NOME"
          valor={usuario.nome}
          acao={
            <button type="button" onClick={() => setEditando(true)} className={ACAO}>
              Editar
            </button>
          }
        />
      )}
      <Linha
        rotulo="E-MAIL"
        valor={usuario.email}
        acao={
          <span className={`flex-none text-[13px] font-bold ${usuario.emailConfirmado ? 'text-verde' : 'text-laranja'}`}>
            {usuario.emailConfirmado ? 'Confirmado ✓' : 'Falta confirmar'}
          </span>
        }
      />
      {usuario.comSenha ? (
        <Linha
          rotulo="SENHA"
          valor="••••••••••"
          acao={
            <button type="button" onClick={trocarSenha} className={ACAO}>
              Alterar
            </button>
          }
        />
      ) : (
        <Linha rotulo="ENTRA COM" valor="Conta Google" />
      )}
      {aviso && (
        <div className="px-4 pb-3">
          <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>
        </div>
      )}
    </Cartao>
  )
}

function Preferencias({ usuario }: { usuario: Usuario }) {
  const { tema, alternarTema } = usePreferencias()
  const escuro = tema === 'escuro'
  const [baixando, setBaixando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  return (
    <Cartao titulo="Preferências">
      <button
        type="button"
        role="switch"
        aria-checked={escuro}
        onClick={alternarTema}
        className="flex w-full cursor-pointer items-center justify-between gap-3 border-b border-fundo px-4 py-3 text-left"
      >
        <span>
          <span className="block text-[15px] font-bold">Modo escuro</span>
          <span className="mt-0.5 block text-xs text-texto-2">Tema escuro em todo o site</span>
        </span>
        <span aria-hidden className={`relative h-[26px] w-[46px] flex-none border-2 border-texto transition-colors ${escuro ? 'bg-lima' : 'bg-superficie-2'}`}>
          <span className={`absolute top-0.5 size-[18px] bg-grafite transition-[left] duration-200 ${escuro ? 'left-[22px]' : 'left-0.5'}`} />
        </span>
      </button>
      <Linha
        rotulo="SEUS DADOS"
        valor="Tudo o que guardamos sobre você"
        acao={
          <button
            type="button"
            disabled={baixando}
            onClick={async () => {
              setErro(null)
              setBaixando(true)
              try {
                await baixarMeusDados(usuario)
              } catch {
                setErro('Não foi possível juntar os seus dados agora. Tente de novo.')
              }
              setBaixando(false)
            }}
            className={ACAO}
          >
            {baixando ? 'Juntando…' : 'Baixar'}
          </button>
        }
      />
      <Linha
        rotulo="PRIVACIDADE"
        valor="Como cuidamos dos seus dados"
        acao={
          <Link to="/privacidade" className={ACAO}>
            Ler
          </Link>
        }
      />
      {erro && (
        <div className="px-4 pb-3">
          <Aviso tipo="erro">{erro}</Aviso>
        </div>
      )}
    </Cartao>
  )
}

function MinhasSalas({ uid }: { uid: string }) {
  const salas = useQuery({ queryKey: ['minhas-salas', uid], queryFn: minhasSalasDaConta })

  return (
    <Cartao
      titulo="Minhas salas"
      className="md:col-span-2"
      extra={
        <Link to="/sala" className="text-[13px] font-bold text-destaque hover:underline">
          + Criar sala
        </Link>
      }
    >
      {salas.isPending ? (
        <p className="px-4 py-4 text-sm text-texto-2">Carregando…</p>
      ) : !salas.data?.length ? (
        <p className="px-4 py-4 text-sm text-texto-2">Você ainda não está em nenhuma sala.</p>
      ) : (
        <ul>
          {salas.data.map((sala) => (
            <li key={sala.codigo} className="border-b border-fundo last:border-b-0">
              <Link
                to={`/sala/${formatarCodigo(sala.codigo)}`}
                className="grid grid-cols-[minmax(0,1fr)_auto_24px] items-center gap-4 px-4 py-3 text-texto transition-colors hover:bg-fundo hover:text-texto"
              >
                <span className="min-w-0">
                  <span className="block truncate text-base font-extrabold">{sala.nome}</span>
                  <span className="mt-0.5 block font-mono text-xs text-texto-2">
                    {formatarCodigo(sala.codigo)} · {sala.pessoas.length}/5 pessoas
                  </span>
                </span>
                <span className="flex pl-1.5">
                  {sala.pessoas.map((p) => {
                    const cor = corDoParticipante(p.cor)
                    return (
                      <span
                        key={`${p.cor}-${p.nome}`}
                        title={p.nome}
                        className="-ml-1.5 grid size-[26px] place-items-center rounded-full text-[9px] font-black shadow-[0_0_0_2px_var(--superficie)]"
                        style={{ background: cor.fundo, color: cor.texto }}
                      >
                        {iniciais(p.nome)}
                      </span>
                    )
                  })}
                </span>
                <span aria-hidden className="font-black">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Cartao>
  )
}

function ExcluirConta({ usuario, aoExcluir }: { usuario: Usuario; aoExcluir: () => void }) {
  const [confirmar, janela] = useConfirmacao()
  const [pedirSenha, setPedirSenha] = useState(false)
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  async function excluir() {
    setErro(null)
    setExcluindo(true)
    try {
      aoExcluir()
      await excluirConta()
    } catch (e) {
      if ((e as { code?: string })?.code === 'auth/requires-recent-login') {
        // Faz tempo que entrou: confirma quem é antes de apagar.
        if (usuario.comSenha) setPedirSenha(true)
        else {
          try {
            await confirmarIdentidade()
            await excluirConta()
            return
          } catch (e2) {
            setErro(mensagemDeErro(e2))
          }
        }
      } else setErro(mensagemDeErro(e))
    }
    setExcluindo(false)
  }

  async function confirmarComSenha(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setExcluindo(true)
    try {
      await confirmarIdentidade(senha)
      await excluirConta()
    } catch (e) {
      setErro(mensagemDeErro(e))
      setExcluindo(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2 md:col-span-2">
      {janela}
      {erro && !pedirSenha && <Aviso tipo="erro">{erro}</Aviso>}
      <button
        type="button"
        disabled={excluindo}
        onClick={async () => {
          const sim = await confirmar({
            titulo: 'Excluir a sua conta?',
            texto:
              'A conta é apagada de vez: você sai de todas as salas, e o seu time do coração e os seus palpites nas salas são apagados. Não dá para desfazer.',
            confirmar: 'Excluir conta',
            perigo: true,
          })
          if (sim) await excluir()
        }}
        className="cursor-pointer text-[13px] font-bold text-vermelho hover:underline disabled:cursor-wait disabled:opacity-60"
      >
        {excluindo ? 'Excluindo…' : 'Excluir minha conta'}
      </button>
      {pedirSenha && (
        <Janela rotulo="Confirmar a senha" aoFechar={() => setPedirSenha(false)}>
          <form onSubmit={confirmarComSenha} className="flex flex-col gap-[18px]">
            <div className="text-[28px] leading-none font-black tracking-[-1px]">Confirme a sua senha</div>
            <p className="text-[15px] text-texto-2">Por segurança, digite a senha para excluir a conta.</p>
            <Campo rotulo="Senha" id="senha-excluir">
              <CampoSenha id="senha-excluir" valor={senha} aoMudar={setSenha} autoComplete="current-password" />
            </Campo>
            {erro && <Aviso tipo="erro">{erro}</Aviso>}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPedirSenha(false)}
                className="h-[50px] cursor-pointer border-2 border-texto bg-superficie text-[15px] font-extrabold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={excluindo}
                className="h-[50px] cursor-pointer border-2 border-texto bg-vermelho text-[15px] font-black text-white shadow-[4px_4px_0_var(--texto)] disabled:cursor-wait disabled:opacity-60"
              >
                {excluindo ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </form>
        </Janela>
      )}
    </div>
  )
}
