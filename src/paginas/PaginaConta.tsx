import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { confirmarIdentidade, excluirConta, mudarNome, reenviarConfirmacao, sair } from '../conta/acoes'
import { mensagemDeErro, useConta, type Usuario } from '../conta/conta'
import { Aviso, BotaoEnviar, Campo, CampoSenha } from '../conta/Formulario'
import { CAMPO } from '../conta/estilos'
import { Carregando } from '../componentes/Estado'
import { Pagina } from '../componentes/Pagina'
import { Rotulo, TituloPagina } from '../componentes/TituloPagina'
import { useConfirmacao } from '../componentes/useConfirmacao'

/** /conta: confirmar o e-mail, mudar o nome, sair e excluir a conta. */
export function PaginaConta() {
  const { carregando, usuario, atualizar } = useConta()
  const [busca] = useSearchParams()
  // Saiu ou excluiu a conta por aqui: vai para o início (e não para "Entrar", como quem chega sem login).
  const [saindo, setSaindo] = useState(false)

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
  if (!usuario) return <Navigate to={saindo ? '/' : '/entrar?voltar=%2Fconta'} replace />

  return (
    <Pagina className="pt-9 pb-16">
      <TituloPagina>Minha conta</TituloPagina>
      <div className="mt-7 grid max-w-[920px] items-start gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-5">
          {precisaConfirmar ? <ConfirmarEmail usuario={usuario} nova={busca.get('nova') === '1'} /> : <Bemvindo usuario={usuario} />}
          <Dados key={usuario.nome} usuario={usuario} />
        </div>
        <Seguranca usuario={usuario} aoSair={() => setSaindo(true)} />
      </div>
    </Pagina>
  )
}

function Bemvindo({ usuario }: { usuario: Usuario }) {
  return (
    <div className="corte-duplo bg-grafite p-6 text-creme">
      <Rotulo className="text-lima">TUDO CERTO</Rotulo>
      <p className="mt-2 text-2xl leading-tight font-black">Olá, {usuario.nome}!</p>
      <p className="mt-2 text-sm text-cinza">
        Sua conta está ativa{usuario.comGoogle ? ' com o Google' : ' e o e-mail está confirmado'}.
      </p>
    </div>
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

  async function jaConfirmei() {
    await atualizar()
    setAviso({ tipo: 'erro', texto: 'Ainda não aparece como confirmado. Clique no link do e-mail e tente de novo.' })
  }

  async function mandarDeNovo() {
    try {
      await reenviarConfirmacao()
      setAviso({ tipo: 'ok', texto: 'Mandamos o e-mail de novo.' })
      setEspera(60)
    } catch (e) {
      setAviso({ tipo: 'erro', texto: mensagemDeErro(e) })
    }
  }

  return (
    <div className="corte-duplo bg-grafite p-6 text-creme">
      <Rotulo className="text-lima">{nova ? 'CONTA CRIADA' : 'FALTA UM PASSO'}</Rotulo>
      <p className="mt-2 text-2xl leading-tight font-black">Confirme o seu e-mail</p>
      <p className="mt-2 text-sm leading-relaxed text-cinza">
        Mandamos um link para <b className="text-creme">{usuario.email}</b>. Clique nele para confirmar que o e-mail é
        seu e volte aqui. Não chegou? Confira a caixa de spam.
      </p>
      {aviso && (
        <p role={aviso.tipo === 'erro' ? 'alert' : 'status'} className={`mt-3 text-sm font-bold ${aviso.tipo === 'erro' ? 'text-[#ff8a8d]' : 'text-lima'}`}>
          {aviso.texto}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={jaConfirmei}
          className="cursor-pointer border-2 border-lima bg-lima px-4 py-2.5 text-sm font-extrabold text-grafite"
        >
          Já confirmei
        </button>
        <button
          type="button"
          onClick={mandarDeNovo}
          disabled={espera > 0}
          className="cursor-pointer border-2 border-creme px-4 py-2.5 text-sm font-extrabold text-creme disabled:cursor-not-allowed disabled:opacity-50"
        >
          {espera > 0 ? `Mandar de novo (${espera}s)` : 'Mandar de novo'}
        </button>
      </div>
    </div>
  )
}

function Dados({ usuario }: { usuario: Usuario }) {
  const { atualizar } = useConta()
  const [nome, setNome] = useState(usuario.nome)
  const [salvando, setSalvando] = useState(false)
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  async function salvar(evento: FormEvent) {
    evento.preventDefault()
    setAviso(null)
    setSalvando(true)
    try {
      await mudarNome(nome)
      await atualizar()
      setAviso({ tipo: 'ok', texto: 'Nome salvo.' })
    } catch (e) {
      setAviso({ tipo: 'erro', texto: mensagemDeErro(e) })
    }
    setSalvando(false)
  }

  return (
    <form onSubmit={salvar} className="border-2 border-texto bg-superficie p-5">
      <Rotulo>SEUS DADOS</Rotulo>
      <div className="mt-4">
        <Campo rotulo="Nome" id="nome" ajuda="É como você aparece nas salas.">
          <input id="nome" required maxLength={20} value={nome} onChange={(e) => setNome(e.target.value)} className={CAMPO} />
        </Campo>
        <div className="mt-4">
          <div className="text-sm font-bold">E-mail</div>
          <div className="mt-1 font-mono text-sm break-all text-texto-2">{usuario.email}</div>
        </div>
        <div className="mt-4">
          <div className="text-sm font-bold">Entra com</div>
          <div className="mt-1 text-sm text-texto-2">
            {[usuario.comGoogle && 'Conta Google', usuario.comSenha && 'E-mail e senha'].filter(Boolean).join(' e ')}
          </div>
        </div>
      </div>
      {aviso && <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>}
      <BotaoEnviar enviando={salvando} desabilitado={nome.trim() === usuario.nome}>{salvando ? 'Salvando…' : 'Salvar nome'}</BotaoEnviar>
    </form>
  )
}

function Seguranca({ usuario, aoSair }: { usuario: Usuario; aoSair: () => void }) {
  const [confirmar, janela] = useConfirmacao()
  const [pedirSenha, setPedirSenha] = useState(false)
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  async function excluirDeVez() {
    setErro(null)
    setExcluindo(true)
    try {
      aoSair()
      await excluirConta()
    } catch (e) {
      if ((e as { code?: string })?.code === 'auth/requires-recent-login') {
        // Faz tempo que entrou: confirma quem é antes de apagar.
        if (usuario.comSenha) setPedirSenha(true)
        else {
          try {
            await confirmarIdentidade()
            aoSair()
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

  async function pedirExclusao() {
    const sim = await confirmar({
      titulo: 'Excluir a sua conta?',
      texto: 'A conta é apagada de vez: você sai de todas as salas, e o seu time do coração e os seus palpites nas salas são apagados. Não dá para desfazer.',
      confirmar: 'Excluir conta',
      perigo: true,
    })
    if (sim) await excluirDeVez()
  }

  async function confirmarComSenha(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setExcluindo(true)
    try {
      await confirmarIdentidade(senha)
      aoSair()
      await excluirConta()
    } catch (e) {
      setErro(mensagemDeErro(e))
      setExcluindo(false)
    }
  }

  return (
    <div className="border-2 border-texto bg-superficie p-5">
      {janela}
      <Rotulo>SESSÃO E SEGURANÇA</Rotulo>
      <p className="mt-3 text-sm leading-relaxed text-texto-2">
        A senha fica guardada só no Firebase, do Google, com criptografia. A BraSúmula guarda apenas o seu nome, o seu
        time do coração e os seus palpites nas salas.
      </p>
      <button
        type="button"
        onClick={async () => {
          aoSair()
          await sair()
        }}
        className="mt-4 w-full cursor-pointer border-2 border-texto bg-superficie px-[18px] py-3 text-sm font-extrabold hover:shadow-[3px_3px_0_var(--texto)]"
      >
        Sair da conta
      </button>

      <div className="mt-6 border-t-2 border-dashed border-borda pt-5">
        <Rotulo className="text-vermelho">ZONA DE PERIGO</Rotulo>
        {pedirSenha ? (
          <form onSubmit={confirmarComSenha} className="mt-3">
            <p className="text-sm text-texto-2">Por segurança, digite a sua senha para confirmar a exclusão.</p>
            <Campo rotulo="Senha" id="senha-excluir">
              <CampoSenha id="senha-excluir" valor={senha} aoMudar={setSenha} autoComplete="current-password" />
            </Campo>
            {erro && <Aviso tipo="erro">{erro}</Aviso>}
            <button
              type="submit"
              disabled={excluindo}
              className="mt-4 w-full cursor-pointer border-2 border-texto bg-vermelho px-[18px] py-3 text-sm font-extrabold text-white disabled:cursor-wait disabled:opacity-60"
            >
              {excluindo ? 'Excluindo…' : 'Confirmar e excluir'}
            </button>
          </form>
        ) : (
          <>
            {erro && <Aviso tipo="erro">{erro}</Aviso>}
            <button
              type="button"
              onClick={pedirExclusao}
              disabled={excluindo}
              className="mt-3 w-full cursor-pointer border-2 border-vermelho bg-superficie px-[18px] py-3 text-sm font-extrabold text-vermelho disabled:cursor-wait disabled:opacity-60"
            >
              {excluindo ? 'Excluindo…' : 'Excluir minha conta'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
