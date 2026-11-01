import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import type { Sala } from '../api/salas'
import { criarConta, entrarComEmail, entrarComGoogle, esqueciSenha, TAMANHO_MINIMO_SENHA } from '../conta/acoes'
import { destinoSeguro, mensagemDeErro, useConta } from '../conta/conta'
import { classeCampo } from '../conta/estilos'
import { Aviso, BotaoEnviar, Campo, CampoSenha } from '../conta/Formulario'
import { Carregando } from '../componentes/Estado'
import { Logo } from '../componentes/Logo'
import { Pagina } from '../componentes/Pagina'
import { corDoParticipante, iniciais, lerCodigo } from '../util/salas'

type Modo = 'entrar' | 'criar' | 'esqueci'

const TEXTOS: Record<Modo, { titulo: string; sub: string }> = {
  entrar: { titulo: 'Boas-vindas de volta', sub: 'Entre para ver os seus palpites e as suas salas.' },
  criar: { titulo: 'Crie sua conta', sub: 'Leva menos de um minuto.' },
  esqueci: { titulo: 'Esqueceu a senha?', sub: 'Mandamos um link para você criar uma senha nova.' },
}

const VANTAGENS = [
  'Dê seu palpite em todos os jogos que faltam',
  'Veja a tabela final que os seus palpites geram',
  'Crie uma sala e compare com até 4 amigos',
]

const emailValido = (email: string) => /^\S+@\S+\.\S+$/.test(email.trim())

/** /entrar, /criar-conta e /esqueci-senha. Depois de entrar, volta para onde a pessoa estava (?voltar=). */
export function PaginaEntrar({ modo }: { modo: Modo }) {
  const { carregando, usuario } = useConta()
  const [busca] = useSearchParams()
  const voltar = destinoSeguro(busca.get('voltar'))
  const comVoltar = (caminho: string) => (voltar === '/' ? caminho : `${caminho}?voltar=${encodeURIComponent(voltar)}`)

  if (carregando) {
    return (
      <Pagina className="pt-9 pb-12">
        <Carregando />
      </Pagina>
    )
  }
  // Já logado (ou acabou de entrar): segue para onde ia. Quem acabou de criar a conta vai para /conta pelo formulário.
  if (usuario && modo !== 'esqueci') return <Navigate to={voltar} replace />

  return (
    <Pagina className="pt-6 pb-12 md:pt-9">
      <div className="grid overflow-hidden border-2 border-texto bg-fundo lg:grid-cols-[minmax(0,500px)_minmax(0,1fr)]">
        <PainelEscuro voltar={voltar} />

        <div className="flex items-center justify-center px-5 py-8 sm:px-10 md:py-12">
          <div className="flex w-full max-w-[420px] flex-col gap-[22px]">
            {modo !== 'esqueci' && (
              <div role="tablist" aria-label="Entrar ou criar conta" className="flex border-2 border-texto">
                {(['entrar', 'criar'] as const).map((m, i) => (
                  <Link
                    key={m}
                    role="tab"
                    aria-selected={modo === m}
                    to={comVoltar(m === 'entrar' ? '/entrar' : '/criar-conta')}
                    replace
                    className={`flex-1 py-3 text-center text-sm font-extrabold transition-[background-color] duration-200 ${i > 0 ? 'border-l-2 border-texto' : ''} ${
                      modo === m ? 'bg-grafite text-lima hover:text-lima' : 'bg-superficie text-texto hover:text-texto'
                    }`}
                  >
                    {m === 'entrar' ? 'Entrar' : 'Criar conta'}
                  </Link>
                ))}
              </div>
            )}

            <div>
              <h1 className="text-[40px] leading-none font-black tracking-[-1.5px]">{TEXTOS[modo].titulo}</h1>
              <p className="mt-2 text-[15px] text-texto-2">{TEXTOS[modo].sub}</p>
            </div>

            {modo === 'esqueci' ? (
              <FormEsqueci entrar={comVoltar('/entrar')} />
            ) : (
              <>
                <BotaoGoogle voltar={voltar} />
                <div className="flex items-center gap-3 font-mono text-[11px] font-bold tracking-[1px] text-texto-3">
                  <span className="h-px flex-1 bg-borda" />
                  OU COM E-MAIL
                  <span className="h-px flex-1 bg-borda" />
                </div>
                {modo === 'entrar' ? <FormEntrar voltar={voltar} esqueci={comVoltar('/esqueci-senha')} /> : <FormCriar />}
              </>
            )}

            <p className="text-xs leading-normal text-texto-2">
              {modo === 'criar' ? 'Ao criar a conta, você concorda com a ' : 'A conta é opcional: todo o site funciona sem ela. Veja a '}
              <Link to="/privacidade" className="font-bold text-destaque hover:underline">
                Política de Privacidade
              </Link>
              . A sua senha fica só no Firebase, do Google, com criptografia: a BraSúmula nunca vê nem guarda a sua senha.
            </p>
          </div>
        </div>
      </div>
    </Pagina>
  )
}

/** O painel escuro do mockup: chamada, as três vantagens e, quando veio de um convite, a sala que espera. */
function PainelEscuro({ voltar }: { voltar: string }) {
  const codigo = voltar.startsWith('/sala/') ? lerCodigo(voltar.slice(6)) : null
  const convite = useQuery({
    queryKey: ['sala-convite', codigo],
    queryFn: async () => (await fetch(`/api/salas/${codigo}`)).json() as Promise<Sala>,
    enabled: codigo !== null,
    staleTime: 60_000,
  })
  const sala = convite.data?.participantes ? convite.data : null

  return (
    <div className="relative hidden flex-col justify-between gap-10 overflow-hidden bg-grafite p-12 text-creme lg:flex">
      <span className="text-[26px] font-black tracking-[-.5px]">
        <Logo />
      </span>
      <span aria-hidden className="pointer-events-none absolute -right-10 bottom-28 text-[260px] leading-none font-black tracking-[-12px] text-lima opacity-[.08]">
        38
      </span>
      <div className="relative flex flex-col gap-[22px]">
        <p className="text-[48px] leading-[.9] font-black tracking-[-2.5px] uppercase">
          Simule o<br />
          Brasileirão
          <br />
          <span className="text-lima">com a galera.</span>
        </p>
        <ul className="flex flex-col gap-2.5">
          {VANTAGENS.map((texto, i) => (
            <li key={texto} className="flex items-center gap-3 text-[15px] font-semibold">
              <span aria-hidden className="grid size-[26px] flex-none place-items-center bg-lima font-mono text-[11px] font-extrabold text-grafite">
                {String(i + 1).padStart(2, '0')}
              </span>
              {texto}
            </li>
          ))}
        </ul>
      </div>
      <div className="relative flex min-h-[30px] items-center gap-3 text-[13px] text-cinza">
        {sala && (
          <>
            <span className="flex">
              {sala.participantes.slice(0, 4).map((p, i) => {
                const cor = corDoParticipante(p.cor)
                return (
                  <span
                    key={p.id}
                    aria-hidden
                    className={`grid size-[30px] place-items-center rounded-full text-[10px] font-black shadow-[0_0_0_2px_#111] ${i > 0 ? '-ml-2' : ''}`}
                    style={{ background: cor.fundo, color: cor.texto }}
                  >
                    {iniciais(p.nome)}
                  </span>
                )
              })}
            </span>
            <span>
              {sala.participantes.find((p) => p.dono)?.nome ?? 'Um amigo'} te convidou para a sala{' '}
              <b className="text-creme">{sala.nome}</b>
            </span>
          </>
        )}
      </div>
    </div>
  )
}

function BotaoGoogle({ voltar }: { voltar: string }) {
  const navegar = useNavigate()
  const [erro, setErro] = useState<string | null>(null)
  const [indo, setIndo] = useState(false)

  async function entrar() {
    setErro(null)
    setIndo(true)
    try {
      await entrarComGoogle()
      navegar(voltar, { replace: true })
    } catch (e) {
      setErro(mensagemDeErro(e))
      setIndo(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={entrar}
        disabled={indo}
        className="flex h-[50px] cursor-pointer items-center justify-center gap-2.5 border-2 border-texto bg-superficie text-[15px] font-bold text-texto transition-[transform,box-shadow] duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--texto)] active:translate-0 active:shadow-none disabled:cursor-wait disabled:opacity-60"
      >
        <svg aria-hidden viewBox="0 0 48 48" className="size-5">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {indo ? 'Abrindo o Google…' : 'Continuar com Google'}
      </button>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
    </>
  )
}

function FormEntrar({ voltar, esqueci }: { voltar: string; esqueci: string }) {
  const navegar = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [tentou, setTentou] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const erroEmail = tentou && !emailValido(email) ? 'Digite um e-mail válido.' : null
  const erroSenha = tentou && !senha ? 'Digite a senha.' : null

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setTentou(true)
    setErro(null)
    if (!emailValido(email) || !senha) return
    setEnviando(true)
    try {
      await entrarComEmail(email, senha)
      navegar(voltar, { replace: true })
    } catch (e) {
      setErro(mensagemDeErro(e))
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-[22px]">
      <div className="flex flex-col gap-3.5">
        <CampoEmail valor={email} aoMudar={setEmail} erro={erroEmail} />
        <Campo
          rotulo="Senha"
          id="senha"
          erro={erroSenha}
          extra={
            <Link to={esqueci} className="text-[13px] font-bold text-destaque hover:underline">
              Esqueci a senha
            </Link>
          }
        >
          <CampoSenha id="senha" valor={senha} aoMudar={setSenha} autoComplete="current-password" erro={erroSenha} />
        </Campo>
      </div>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <BotaoEnviar enviando={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</BotaoEnviar>
    </form>
  )
}

function FormCriar() {
  const navegar = useNavigate()
  const { atualizar } = useConta()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [tentou, setTentou] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const erroNome = tentou && !nome.trim() ? 'Digite o seu nome.' : null
  const erroEmail = tentou && !emailValido(email) ? 'Digite um e-mail válido.' : null
  const erroSenha =
    tentou && senha.length < TAMANHO_MINIMO_SENHA ? `A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.` : null

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setTentou(true)
    setErro(null)
    if (!nome.trim() || !emailValido(email) || senha.length < TAMANHO_MINIMO_SENHA) return
    setEnviando(true)
    try {
      await criarConta(nome, email, senha)
      // O nome é gravado logo depois de criar a conta: lê de novo para o site já mostrar o nome certo.
      await atualizar()
      navegar('/conta?nova=1', { replace: true })
    } catch (e) {
      setErro(mensagemDeErro(e))
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-[22px]">
      <div className="flex flex-col gap-3.5">
        <Campo rotulo="Nome" id="nome" erro={erroNome}>
          <input
            id="nome"
            maxLength={20}
            autoComplete="given-name"
            placeholder="Como seus amigos te chamam"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            aria-invalid={erroNome ? true : undefined}
            className={classeCampo(Boolean(erroNome))}
          />
        </Campo>
        <CampoEmail valor={email} aoMudar={setEmail} erro={erroEmail} />
        <Campo rotulo="Senha" id="senha" erro={erroSenha}>
          <CampoSenha
            id="senha"
            valor={senha}
            aoMudar={setSenha}
            autoComplete="new-password"
            erro={erroSenha}
            placeholder={`Mínimo ${TAMANHO_MINIMO_SENHA} caracteres`}
          />
        </Campo>
      </div>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <BotaoEnviar enviando={enviando}>{enviando ? 'Criando a conta…' : 'Criar conta'}</BotaoEnviar>
    </form>
  )
}

function FormEsqueci({ entrar }: { entrar: string }) {
  const [email, setEmail] = useState('')
  const [tentou, setTentou] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const erroEmail = tentou && !emailValido(email) ? 'Digite um e-mail válido.' : null

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setTentou(true)
    setErro(null)
    if (!emailValido(email)) return
    setEnviando(true)
    try {
      await esqueciSenha(email)
      setEnviado(true)
    } catch (e) {
      // Por segurança, não contamos se o e-mail tem conta ou não: só erros de formato ou de conexão aparecem.
      if ((e as { code?: string })?.code === 'auth/user-not-found') setEnviado(true)
      else setErro(mensagemDeErro(e))
    }
    setEnviando(false)
  }

  if (enviado) {
    return (
      <>
        <Aviso tipo="ok">Se existir uma conta com {email.trim()}, o link chega em alguns minutos. Confira também o spam.</Aviso>
        <Link to={entrar} className="font-bold text-destaque hover:underline">
          Voltar para Entrar
        </Link>
      </>
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-[22px]">
      <CampoEmail valor={email} aoMudar={setEmail} erro={erroEmail} />
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <BotaoEnviar enviando={enviando}>{enviando ? 'Enviando…' : 'Mandar o link'}</BotaoEnviar>
      <Link to={entrar} className="text-sm font-bold text-destaque hover:underline">
        Lembrei a senha
      </Link>
    </form>
  )
}

function CampoEmail({ valor, aoMudar, erro }: { valor: string; aoMudar: (v: string) => void; erro: string | null }) {
  return (
    <Campo rotulo="E-mail" id="email" erro={erro}>
      <input
        id="email"
        type="email"
        autoComplete="email"
        placeholder="voce@email.com"
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? 'email-erro' : undefined}
        className={classeCampo(Boolean(erro))}
      />
    </Campo>
  )
}
