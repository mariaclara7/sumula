import { Link, useSearchParams } from 'react-router'
import { useArtilharia, useClassificacao, useProbabilidades, useTempos, useTimes } from '../api/consultas'
import type { LinhaClassificacao, Mando, Recorte, Tempo } from '../api/tipos'
import { Abas } from '../componentes/Abas'
import { Confete } from '../componentes/Confete'
import { Carregando, Erro, Vazio } from '../componentes/Estado'
import { Pagina } from '../componentes/Pagina'
import { TabelaClassificacao } from '../componentes/TabelaClassificacao'
import { Rotulo, TituloPagina } from '../componentes/TituloPagina'
import { usePreferencias } from '../preferencias'
import { contar, useAnimacao } from '../util/animacao'
import { formatarAtualizacao } from '../util/formato'
import { gerarNoticias, type TipoNoticia } from '../util/noticias'
import { mediaDeGols, notaDeAtaque, notaDeDefesa, notaDoTime } from '../util/notas'

const RECORTES: { valor: Recorte; rotulo: string }[] = [
  { valor: 'geral', rotulo: 'Geral' },
  { valor: 'primeiroTurno', rotulo: '1º turno' },
  { valor: 'segundoTurno', rotulo: '2º turno' },
]

const MANDOS: { valor: Mando; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'casa', rotulo: 'Em casa' },
  { valor: 'fora', rotulo: 'Fora' },
]

const TEMPOS: { valor: Tempo; rotulo: string }[] = [
  { valor: 'jogoTodo', rotulo: 'Jogo todo' },
  { valor: 'primeiroTempo', rotulo: 'Se acabasse no intervalo' },
  { valor: 'segundoTempo', rotulo: 'Só o 2º tempo' },
]

const EXPLICACAO_TEMPO: Partial<Record<Tempo, string>> = {
  primeiroTempo: 'Como estaria a tabela se todos os jogos terminassem no intervalo. As setas mostram quanto cada time subiria ou cairia.',
  segundoTempo: 'Como estaria a tabela se só valessem os gols do 2º tempo. As setas mostram quanto cada time subiria ou cairia.',
}

function lerOpcao<T extends string>(valor: string | null, opcoes: { valor: T }[]): T {
  return opcoes.find((opcao) => opcao.valor === valor)?.valor ?? opcoes[0].valor
}

export function PaginaClassificacao() {
  // Os filtros ficam na URL, então dá para compartilhar o link de "2º turno em casa".
  const [busca, setBusca] = useSearchParams()
  const recorte = lerOpcao(busca.get('recorte'), RECORTES)
  const mando = lerOpcao(busca.get('mando'), MANDOS)
  const tempo = lerOpcao(busca.get('tempo'), TEMPOS)
  const filtrada = useClassificacao(recorte, mando, tempo)
  // A tabela normal alimenta o card do líder, as notícias e as setas ▲▼ dos filtros.
  const normal = useClassificacao('geral', 'todos', 'jogoTodo')
  const { meuTime } = usePreferencias()
  const { progresso, repetir, rodada } = useAnimacao(normal.data !== undefined)

  const semFiltro = recorte === 'geral' && mando === 'todos' && tempo === 'jogoTodo'
  const posicaoNormal =
    semFiltro || !normal.data ? undefined : new Map(normal.data.linhas.map((l) => [l.time.id, l.posicao]))

  function alterar(chave: string, valor: string, padrao: string) {
    setBusca(
      (atual) => {
        if (valor === padrao) atual.delete(chave)
        else atual.set(chave, valor)
        return atual
      },
      { replace: true },
    )
  }

  const linhasNormais = normal.data?.linhas ?? []
  const rodadaAtual = Math.max(0, ...linhasNormais.map((l) => l.jogos))

  return (
    <Pagina>
      <div className="flex flex-wrap items-end justify-between gap-4 pt-9">
        <TituloPagina>Classificação</TituloPagina>
        {normal.data && (
          <div className="flex flex-col items-start gap-1.5">
            <span className="bg-grafite px-3 py-1.5 font-mono text-[13px] font-extrabold text-lima">
              RODADA {contar(rodadaAtual, progresso)}
            </span>
            {normal.data.atualizadoEm && (
              <span className="text-[13px] text-texto-2">atualizado em {formatarAtualizacao(normal.data.atualizadoEm)}</span>
            )}
          </div>
        )}
      </div>

      {linhasNormais.length > 1 && (
        <div className="grid gap-5 py-7 md:grid-cols-[400px_minmax(0,1fr)]">
          <CartaoLider linhas={linhasNormais} progresso={progresso} disparo={rodada + 1} aoClicar={repetir} />
          <CaixaDeEntrada linhas={linhasNormais} />
        </div>
      )}

      <section className="pt-2 pb-12">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black tracking-[-.5px]">TABELA</h2>
          <Abas rotulo="Tempo de jogo" opcoes={TEMPOS} valor={tempo} aoMudar={(v) => alterar('tempo', v, 'jogoTodo')} />
        </div>
        <div className="mb-3.5 flex flex-wrap gap-2">
          <Abas rotulo="Turno" opcoes={RECORTES} valor={recorte} aoMudar={(v) => alterar('recorte', v, 'geral')} />
          <Abas rotulo="Mando de campo" opcoes={MANDOS} valor={mando} aoMudar={(v) => alterar('mando', v, 'todos')} />
        </div>
        {EXPLICACAO_TEMPO[tempo] && <p className="mb-3.5 text-sm text-texto-2">{EXPLICACAO_TEMPO[tempo]}</p>}

        {filtrada.isPending ? (
          <Carregando />
        ) : filtrada.isError ? (
          <Erro tentarDeNovo={() => filtrada.refetch()} />
        ) : filtrada.data.linhas.length === 0 ? (
          <Vazio>Ainda não há dados desta temporada.</Vazio>
        ) : (
          <TabelaClassificacao
            linhas={filtrada.data.linhas}
            mostrarZonas={recorte === 'geral' && mando === 'todos'}
            posicaoNormal={posicaoNormal}
            destaque={meuTime}
            progresso={progresso}
          />
        )}
      </section>
    </Pagina>
  )
}

type PropsLider = {
  linhas: LinhaClassificacao[]
  progresso: number
  disparo: number
  aoClicar: () => void
}

/** Card do líder: clicar solta confete e faz os números contarem de novo. */
function CartaoLider({ linhas, progresso, disparo, aoClicar }: PropsLider) {
  const probabilidades = useProbabilidades()
  const [lider, segundo] = linhas
  const media = mediaDeGols(linhas)
  const titulo = probabilidades.data?.times.find((t) => t.time.id === lider.time.id)?.posicoes[0]
  const vantagem = lider.pontos - segundo.pontos

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${lider.time.nomeCurto} lidera com ${lider.pontos} pontos. Clique para comemorar.`}
      onClick={aoClicar}
      onKeyDown={(evento) => {
        if (evento.key === 'Enter' || evento.key === ' ') {
          evento.preventDefault()
          aoClicar()
        }
      }}
      className="corte-duplo relative cursor-pointer overflow-hidden bg-grafite p-6 text-creme transition-transform duration-[250ms] outline-offset-4 hover:scale-[1.015]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Rotulo className="text-lima">LÍDER · OVR {contar(notaDoTime(lider.aproveitamento), progresso)}</Rotulo>
          <div
            className="mt-2.5 leading-none font-black tracking-[-1px] uppercase"
            style={{ fontSize: tamanhoDoNome(lider.time.nomeCurto) }}
          >
            {lider.time.nomeCurto}
          </div>
          <div className="mt-2.5 text-[68px] leading-none font-black tracking-[-3px] tabular-nums">
            {contar(lider.pontos, progresso)}
            <span className="text-lg tracking-normal text-cinza"> pts</span>
          </div>
        </div>
        <div
          className="grid size-28 flex-none place-items-center rounded-full"
          style={{ background: `conic-gradient(#c6f432 ${(titulo ?? 0) * 360 * progresso}deg, #2b2b2b 0)` }}
        >
          <div className="flex size-[88px] flex-col items-center justify-center rounded-full bg-grafite">
            <span className="text-[26px] font-black tabular-nums">
              {titulo === undefined ? '—' : `${contar(titulo * 100, progresso)}%`}
            </span>
            <span className="text-[11px] text-cinza">título</span>
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2.5">
        <NumeroLider valor={contar(notaDeAtaque(lider, media), progresso)} rotulo="ataque" />
        <NumeroLider valor={contar(notaDeDefesa(lider, media), progresso)} rotulo="defesa" />
        <NumeroLider valor={`+${contar(vantagem, progresso)}`} rotulo={vantagem === 1 ? 'ponto de vantagem' : 'de vantagem'} />
      </div>
      <Confete disparo={disparo} />
    </div>
  )
}

/** Diminui a fonte do nome para a palavra mais longa caber inteira ao lado do anel (até 38px). */
function tamanhoDoNome(nome: string) {
  const maiorPalavra = Math.max(...nome.split(/\s+/).map((palavra) => palavra.length))
  return Math.max(22, Math.min(38, Math.floor(190 / (maiorPalavra * 0.78))))
}

function NumeroLider({ valor, rotulo }: { valor: React.ReactNode; rotulo: string }) {
  return (
    <div className="border-t-2 border-lima pt-2">
      <div className="text-2xl font-black tabular-nums">{valor}</div>
      <div className="text-xs text-cinza">{rotulo}</div>
    </div>
  )
}

const ESTILO_NOTICIA: Record<TipoNoticia, { rotulo: string; etiqueta: string; sombra: string }> = {
  embalado: { rotulo: 'EMBALADO', etiqueta: 'bg-lima text-grafite', sombra: 'hover:shadow-[5px_5px_0_#c6f432]' },
  alerta: { rotulo: 'ALERTA', etiqueta: 'bg-vermelho text-white', sombra: 'hover:shadow-[5px_5px_0_#e5484d]' },
  artilharia: {
    rotulo: 'ARTILHARIA',
    etiqueta: 'bg-grafite text-lima shadow-[inset_0_0_0_1px_#c6f432]',
    sombra: 'hover:shadow-[5px_5px_0_#c6f432]',
  },
  virada: { rotulo: 'VIRADA', etiqueta: 'bg-azul text-white', sombra: 'hover:shadow-[5px_5px_0_#2f6bff]' },
}

/** Manchetes geradas a partir dos dados da rodada; cada uma leva à página do assunto. */
function CaixaDeEntrada({ linhas }: { linhas: LinhaClassificacao[] }) {
  const artilharia = useArtilharia()
  const tempos = useTempos()
  const times = useTimes()
  const noticias = gerarNoticias({
    linhas,
    artilharia: artilharia.data,
    tempos: tempos.data?.times,
    times: times.data?.porId,
  })

  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <Rotulo>
        CAIXA DE ENTRADA · {noticias.length} {noticias.length === 1 ? 'NOVA' : 'NOVAS'}
      </Rotulo>
      {noticias.length === 0 && (
        <p className="border-2 border-texto bg-superficie px-4 py-[13px] text-[15px] text-texto-2">
          Nenhuma novidade nesta rodada.
        </p>
      )}
      {noticias.map((noticia) => {
        const estilo = ESTILO_NOTICIA[noticia.tipo]
        return (
          <Link
            key={noticia.tipo}
            to={noticia.link}
            className={`flex flex-wrap items-center gap-x-3.5 gap-y-2 border-2 border-texto bg-superficie px-4 py-[13px] transition-[translate,box-shadow] duration-200 hover:-translate-x-[3px] hover:-translate-y-[3px] ${estilo.sombra}`}
          >
            <span className={`px-2 py-1 font-mono text-[11px] font-extrabold ${estilo.etiqueta}`}>{estilo.rotulo}</span>
            <span className="text-[15px] font-bold">{noticia.texto}</span>
          </Link>
        )
      })}
    </div>
  )
}
