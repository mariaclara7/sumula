import type { Resultado, TransicaoIntervalo } from '../api/tipos'

const ORDEM: Resultado[] = ['vitoria', 'empate', 'derrota']

const NO_INTERVALO: Record<Resultado, string> = {
  vitoria: 'Vencendo',
  empate: 'Empatando',
  derrota: 'Perdendo',
}

const NO_FINAL: Record<Resultado, string> = {
  vitoria: 'Venceu',
  empate: 'Empatou',
  derrota: 'Perdeu',
}

/**
 * Como estava no intervalo (linhas) x como terminou (colunas). A intensidade do fundo
 * acompanha a quantidade de jogos, e o número está sempre escrito na célula.
 */
export function MatrizIntervalo({ transicoes }: { transicoes: TransicaoIntervalo[] }) {
  const jogos = (intervalo: Resultado, final: Resultado) =>
    transicoes.find((t) => t.noIntervalo === intervalo && t.noFinal === final)?.jogos ?? 0
  const maior = Math.max(...transicoes.map((t) => t.jogos), 1)

  return (
    <table className="w-full text-center text-sm tabular-nums">
      <caption className="sr-only">Resultado no intervalo e resultado final</caption>
      <thead className="text-xs text-texto-3">
        <tr>
          <th scope="col" className="px-2 py-2 text-left font-medium">
            No intervalo ↓ · No fim →
          </th>
          {ORDEM.map((final) => (
            <th key={final} scope="col" className="px-2 py-2 font-medium">
              {NO_FINAL[final]}
            </th>
          ))}
          <th scope="col" className="px-2 py-2 font-medium">
            Total
          </th>
        </tr>
      </thead>
      <tbody>
        {ORDEM.map((intervalo) => (
          <tr key={intervalo}>
            <th scope="row" className="px-2 py-1 text-left font-medium">
              {NO_INTERVALO[intervalo]}
            </th>
            {ORDEM.map((final) => {
              const quantidade = jogos(intervalo, final)
              const intensidade = Math.round((quantidade / maior) * 70)
              return (
                <td key={final} className="p-1">
                  <div
                    className={`py-2 ${intensidade > 40 ? 'font-semibold text-white' : 'text-texto'}`}
                    style={{
                      background: `color-mix(in oklab, #2f6bff ${intensidade}%, var(--superficie-2))`,
                    }}
                  >
                    {quantidade}
                  </div>
                </td>
              )
            })}
            <td className="px-2 py-1 text-texto-2">{ORDEM.reduce((soma, final) => soma + jogos(intervalo, final), 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
