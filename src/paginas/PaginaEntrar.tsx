import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { criarConta, entrarComEmail, entrarComGoogle, esqueciSenha, TAMANHO_MINIMO_SENHA } from '../conta/acoes'
import { destinoSeguro, mensagemDeErro, useConta } from '../conta/conta'
import { CAMPO } from '../conta/estilos'
import { Aviso, BotaoEnviar, Campo, CampoSenha } from '../conta/Formulario'
import { Carregando } from '../componentes/Estado'
import { Pagina } from '../componentes/Pagina'
import { TituloPagina } from '../componentes/TituloPagina'

type Modo = 'entrar' | 'criar' | 'esqueci'

const TITULO: Record<Modo, string> = { entrar: 'Entrar', criar: 'Criar conta', esqueci: 'Nova senha' }

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
    <Pagina className="pt-9 pb-16">
      <TituloPagina>{TITULO[modo]}</TituloPagina>
      <div className="mt-7 max-w-[460px] border-2 border-texto bg-superficie p-6 shadow-[5px_5px_0_var(--texto)]">
        {modo === 'esqueci' ? (
          <FormEsqueci entrar={comVoltar('/entrar')} />
        ) : (
          <>
            <BotaoGoogle voltar={voltar} />
            <div className="my-5 flex items-center gap-3 font-mono text-[11px] font-extrabold tracking-[2px] text-texto-2">
              <span className="h-0.5 flex-1 bg-borda" />
              OU COM E-MAIL
              <span className="h-0.5 flex-1 bg-borda" />
            </div>
            {modo === 'entrar' ? (
              <FormEntrar voltar={voltar} esqueci={comVoltar('/esqueci-senha')} />
            ) : (
              <FormCriar />
            )}
          </>
        )}
      </div>
      <p className="mt-5 max-w-[460px] text-sm text-texto-2">
        {modo === 'entrar' ? (
          <>
            Ainda não tem conta?{' '}
            <Link to={comVoltar('/criar-conta')} className="font-bold text-destaque hover:underline">
              Criar conta
            </Link>
          </>
        ) : (
          <>
            Já tem conta?{' '}
            <Link to={comVoltar('/entrar')} className="font-bold text-destaque hover:underline">
              Entrar
            </Link>
          </>
        )}
      </p>
      <p className="mt-3 max-w-[460px] text-xs leading-relaxed text-texto-2">
        A conta é opcional: todo o site funciona sem ela. A senha fica guardada só no Firebase, do Google, com
        criptografia; a BraSúmula nunca vê nem guarda a sua senha.
      </p>
    </Pagina>
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
        className="flex w-full cursor-pointer items-center justify-center gap-3 border-2 border-texto bg-superficie px-4 py-3 text-[15px] font-extrabold transition-[transform,box-shadow] duration-75 hover:shadow-[3px_3px_0_var(--texto)] active:translate-x-px active:translate-y-px active:shadow-none disabled:cursor-wait disabled:opacity-60"
      >
        <svg aria-hidden viewBox="0 0 48 48" className="size-5">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {indo ? 'Abrindo o Google…' : 'Continuar com o Google'}
      </button>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
    </>
  )
}

function FormEntrar({ voltar, esqueci }: { voltar: string; esqueci: string }) {
  const navegar = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
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
    <form onSubmit={enviar} noValidate={false}>
      <Campo rotulo="E-mail" id="email">
        <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={CAMPO} />
      </Campo>
      <Campo rotulo="Senha" id="senha" extra={<Link to={esqueci} className="text-xs font-bold text-destaque hover:underline">Esqueci a senha</Link>}>
        <CampoSenha id="senha" valor={senha} aoMudar={setSenha} autoComplete="current-password" />
      </Campo>
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
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    if (senha.length < TAMANHO_MINIMO_SENHA) {
      setErro(`A senha precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`)
      return
    }
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
    <form onSubmit={enviar}>
      <Campo rotulo="Seu nome" id="nome" ajuda="É como você aparece nas salas.">
        <input id="nome" required maxLength={20} autoComplete="given-name" value={nome} onChange={(e) => setNome(e.target.value)} className={CAMPO} />
      </Campo>
      <Campo rotulo="E-mail" id="email" ajuda="Vamos mandar um link para confirmar que o e-mail é seu.">
        <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={CAMPO} />
      </Campo>
      <Campo rotulo="Senha" id="senha" ajuda={`Pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`}>
        <CampoSenha id="senha" valor={senha} aoMudar={setSenha} autoComplete="new-password" />
      </Campo>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <BotaoEnviar enviando={enviando}>{enviando ? 'Criando a conta…' : 'Criar conta'}</BotaoEnviar>
    </form>
  )
}

function FormEsqueci({ entrar }: { entrar: string }) {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await esqueciSenha(email)
      setEnviado(true)
    } catch (e) {
      // Por segurança, não contamos se o e-mail tem conta ou não: só erros de formato ou de conexão aparecem.
      const codigo = (e as { code?: string })?.code
      if (codigo === 'auth/user-not-found') setEnviado(true)
      else setErro(mensagemDeErro(e))
    }
    setEnviando(false)
  }

  if (enviado) {
    return (
      <div>
        <Aviso tipo="ok">
          Se existir uma conta com <b>{email.trim()}</b>, um e-mail com o link para criar uma senha nova chega em
          alguns minutos. Confira também a caixa de spam.
        </Aviso>
        <Link to={entrar} className="mt-4 inline-block font-bold text-destaque hover:underline">
          Voltar para Entrar
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={enviar}>
      <p className="text-sm text-texto-2">Digite o e-mail da sua conta. Vamos mandar um link para você criar uma senha nova.</p>
      <Campo rotulo="E-mail" id="email">
        <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={CAMPO} />
      </Campo>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <BotaoEnviar enviando={enviando}>{enviando ? 'Enviando…' : 'Mandar o link'}</BotaoEnviar>
    </form>
  )
}
