import { Link } from 'react-router'
import { useProbabilidades } from '../api/consultas'
import { BarraChance } from '../componentes/BarraChance'
import { Cartao } from '../componentes/Cartao'
import { Escudo } from '../componentes/Escudo'
import { Carregando, Erro, Vazio } from '../componentes/Estado'
import { FAIXAS_CHANCES, chanceNaFaixa } from '../config'

// No celular ficam só título, Libertadores e rebaixamento.
const VISIBILIDADE: Record<string, string> = {
  'Pré-Libertadores': 'hidden md:table-cell',
  'Sul-Americana': 'hidden sm:table-cell',
}

// Rótulos curtos para caber no celular; o nome completo aparece ao passar o mouse.
const ROTULO_CURTO: Record<string, string> = {
  Libertadores: 'Lib.',
  Rebaixamento: 'Queda',
}

const cabecalho = 'px-1.5 py-2 text-xs font-medium text-texto-3 sm:px-2'

export function PaginaChances() {
  const { data, isPending, isError, refetch } = useProbabilidades()

  const conteudo = () => {
    if (isPending) return <Carregando />
    if (isError) return <Erro tentarDeNovo={() => refetch()} />
    if (data.times.length === 0) return <Vazio>Ainda não há dados desta temporada.</Vazio>

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-borda">
            <tr>
              <th scope="col" className={`${cabecalho} hidden w-8 text-center sm:table-cell`}>
                <abbr title="Posição atual" className="no-underline">
                  Pos.
                </abbr>
              </th>
              <th scope="col" className={`${cabecalho} text-left`}>
                Time
              </th>
              <th scope="col" className={`${cabecalho} text-right`}>
                <abbr title="Pontos atuais" className="no-underline">
                  Pts
                </abbr>
              </th>
              <th scope="col" className={`${cabecalho} hidden text-right md:table-cell`}>
                Pts esperados
              </th>
              {FAIXAS_CHANCES.map((faixa) => (
                <th key={faixa.nome} scope="col" className={`${cabecalho} text-right ${VISIBILIDADE[faixa.nome] ?? ''}`}>
                  {ROTULO_CURTO[faixa.nome] ? (
                    <>
                      <abbr title={faixa.nome} className="no-underline sm:hidden">
                        {ROTULO_CURTO[faixa.nome]}
                      </abbr>
                      <span className="hidden sm:inline">{faixa.nome}</span>
                    </>
                  ) : (
                    faixa.nome
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-borda">
            {data.times.map((linha) => (
              <tr key={linha.time.id} className="hover:bg-superficie-2">
                <td className="hidden px-2 py-2 text-center tabular-nums text-texto-2 sm:table-cell">{linha.posicaoAtual}</td>
                <td className="px-1.5 py-2 sm:px-2">
                  <Link to={`/times/${linha.time.id}`} className="flex items-center gap-2 font-medium hover:underline">
                    <Escudo time={linha.time} />
                    <span className="max-w-[5.5rem] truncate sm:max-w-none">{linha.time.nomeCurto}</span>
                  </Link>
                </td>
                <td className="px-1.5 py-2 text-right font-bold tabular-nums sm:px-2">{linha.pontosAtuais}</td>
                <td className="hidden px-2 py-2 text-right tabular-nums text-texto-2 md:table-cell">
                  {Math.round(linha.pontosEsperados)}
                </td>
                {FAIXAS_CHANCES.map((faixa) => (
                  <td key={faixa.nome} className={`px-1.5 py-2 sm:px-2 ${VISIBILIDADE[faixa.nome] ?? ''}`}>
                    <BarraChance chance={chanceNaFaixa(linha.posicoes, faixa)} cor={faixa.cor} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Chances</h1>
        <p className="mt-1 max-w-2xl text-sm text-texto-2">
          {data && data.partidasRestantes > 0
            ? `Simulamos os ${data.partidasRestantes} jogos que faltam ${data.simulacoes.toLocaleString('pt-BR')} vezes. `
            : 'Simulamos os jogos que faltam milhares de vezes. '}
          O placar de cada jogo é sorteado a partir dos gols marcados e sofridos por cada time na temporada, com
          vantagem para o mandante. A chance é a fração das simulações em que o time termina na faixa.
        </p>
      </div>
      <Cartao>{conteudo()}</Cartao>
    </div>
  )
}
