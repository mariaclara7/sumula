import type { Resultado } from '../api/tipos'
import { NOME_RESULTADO, SIGLA_RESULTADO } from '../util/formato'

const COR: Record<Resultado, string> = {
  vitoria: 'bg-vitoria',
  empate: 'bg-empate',
  derrota: 'bg-derrota',
}

/** Sequência de resultados, do mais antigo ao mais recente. Cada bolinha traz a letra, não só a cor. */
export function FormaRecente({ resultados }: { resultados: Resultado[] }) {
  if (resultados.length === 0) return <span className="text-texto-3">—</span>

  return (
    <ol className="flex gap-1" aria-label={`Últimos jogos: ${resultados.map((r) => NOME_RESULTADO[r]).join(', ')}`}>
      {resultados.map((resultado, indice) => (
        <li
          key={indice}
          title={NOME_RESULTADO[resultado]}
          className={`${COR[resultado]} flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white`}
        >
          {SIGLA_RESULTADO[resultado]}
        </li>
      ))}
    </ol>
  )
}
