import type { Resultado } from '../api/tipos'
import { NOME_RESULTADO, SIGLA_RESULTADO } from '../util/formato'

const COR: Record<Resultado, string> = {
  vitoria: 'bg-lima text-grafite',
  empate: 'bg-[#d9d7cf] text-grafite',
  derrota: 'bg-vermelho text-white',
}

const TAMANHO = {
  p: 'size-[17px] text-[9px]',
  m: 'size-5 text-[10px]',
  g: 'size-[22px] text-[11px]',
}

/** Sequência de resultados, do mais antigo ao mais recente. Cada quadradinho traz a letra, não só a cor. */
export function FormaRecente({ resultados, tamanho = 'g' }: { resultados: Resultado[]; tamanho?: keyof typeof TAMANHO }) {
  if (resultados.length === 0) return <span className="text-texto-3">—</span>

  return (
    <ol
      className={`flex ${tamanho === 'p' ? 'gap-[3px]' : 'gap-1'}`}
      aria-label={`Últimos jogos: ${resultados.map((r) => NOME_RESULTADO[r]).join(', ')}`}
    >
      {resultados.map((resultado, indice) => (
        <li
          key={indice}
          title={NOME_RESULTADO[resultado]}
          className={`${COR[resultado]} ${TAMANHO[tamanho]} grid place-items-center font-black`}
        >
          {SIGLA_RESULTADO[resultado]}
        </li>
      ))}
    </ol>
  )
}

/** Cores do placar de um jogo do ponto de vista de um time. */
export const COR_PLACAR = COR
