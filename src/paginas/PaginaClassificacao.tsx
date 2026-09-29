import { useSearchParams } from 'react-router'
import { useClassificacao } from '../api/consultas'
import type { Mando, Recorte, Tempo } from '../api/tipos'
import { Abas } from '../componentes/Abas'
import { Cartao } from '../componentes/Cartao'
import { Carregando, Erro, Vazio } from '../componentes/Estado'
import { TabelaClassificacao } from '../componentes/TabelaClassificacao'
import { formatarAtualizacao } from '../util/formato'

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
  { valor: 'primeiroTempo', rotulo: '1º tempo' },
  { valor: 'segundoTempo', rotulo: '2º tempo' },
]

const EXPLICACAO_TEMPO: Partial<Record<Tempo, string>> = {
  primeiroTempo: 'Como estaria a tabela se todos os jogos terminassem no intervalo.',
  segundoTempo: 'Como estaria a tabela se só valessem os gols do 2º tempo.',
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
  const { data, isPending, isError, refetch } = useClassificacao(recorte, mando, tempo)

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Classificação</h1>
          {data?.atualizadoEm && (
            <p className="text-xs text-texto-3">Atualizado em {formatarAtualizacao(data.atualizadoEm)}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Abas rotulo="Turno" opcoes={RECORTES} valor={recorte} aoMudar={(v) => alterar('recorte', v, 'geral')} />
          <Abas rotulo="Mando de campo" opcoes={MANDOS} valor={mando} aoMudar={(v) => alterar('mando', v, 'todos')} />
          <Abas rotulo="Tempo de jogo" opcoes={TEMPOS} valor={tempo} aoMudar={(v) => alterar('tempo', v, 'jogoTodo')} />
        </div>
      </div>

      {EXPLICACAO_TEMPO[tempo] && <p className="text-sm text-texto-2">{EXPLICACAO_TEMPO[tempo]}</p>}

      <Cartao>
        {isPending ? (
          <Carregando />
        ) : isError ? (
          <Erro tentarDeNovo={() => refetch()} />
        ) : data.linhas.length === 0 ? (
          <Vazio>Ainda não há dados desta temporada.</Vazio>
        ) : (
          <TabelaClassificacao
            linhas={data.linhas}
            mostrarZonas={recorte === 'geral' && mando === 'todos' && tempo === 'jogoTodo'}
          />
        )}
      </Cartao>
    </div>
  )
}
