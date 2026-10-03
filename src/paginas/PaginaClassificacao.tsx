import { useSearchParams } from 'react-router'
import {
  useArtilharia,
  useClassificacao,
  useEstatisticas,
  useMatematica,
  usePartidas,
  useProbabilidades,
  useTempos,
  useTimes,
} from '../api/consultas'
import type { LinhaClassificacao, Mando, Recorte, Tempo } from '../api/tipos'
import { Abas } from '../componentes/Abas'
import { CarrosselDestaques } from '../componentes/CarrosselDestaques'
import { CarrosselNoticias } from '../componentes/CarrosselNoticias'
import { Carregando, Erro, Vazio } from '../componentes/Estado'
import { Pagina } from '../componentes/Pagina'
import { TabelaClassificacao } from '../componentes/TabelaClassificacao'
import { TituloPagina } from '../componentes/TituloPagina'
import { usePreferencias } from '../preferencias'
import { contar, useAnimacao } from '../util/animacao'
import { formatarAtualizacao } from '../util/formato'
import { gerarDestaques } from '../util/destaques'
import { gerarNoticias } from '../util/noticias'

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
  const { progresso } = useAnimacao(normal.data !== undefined)

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

      {linhasNormais.length > 2 && <Destaques linhas={linhasNormais} />}

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

/** Topo da classificação: o card de destaques (à esquerda) e as últimas notícias (à direita). */
function Destaques({ linhas }: { linhas: LinhaClassificacao[] }) {
  const estatisticas = useEstatisticas()
  const probabilidades = useProbabilidades()
  const artilharia = useArtilharia()
  const tempos = useTempos()
  const matematica = useMatematica()
  const partidas = usePartidas()
  const times = useTimes()
  const segundoTurno = useClassificacao('segundoTurno', 'todos', 'jogoTodo')
  const intervalo = useClassificacao('geral', 'todos', 'primeiroTempo')

  const cards = gerarDestaques({
    linhas,
    estatisticas: estatisticas.data?.times,
    probabilidades: probabilidades.data?.times,
    artilharia: artilharia.data,
  })
  const noticias = gerarNoticias({
    linhas,
    estatisticas: estatisticas.data?.times,
    artilharia: artilharia.data,
    tempos: tempos.data?.times,
    probabilidades: probabilidades.data?.times,
    matematica: matematica.data,
    segundoTurno: segundoTurno.data?.linhas,
    intervalo: intervalo.data?.linhas,
    partidas: partidas.data,
    times: times.data?.porId,
  })

  return (
    <div className="grid gap-5 py-7 md:grid-cols-[400px_minmax(0,1fr)]">
      <CarrosselDestaques cards={cards} />
      <CarrosselNoticias noticias={noticias} />
    </div>
  )
}
