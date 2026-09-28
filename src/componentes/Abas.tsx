type Opcao<T extends string> = { valor: T; rotulo: string }

type Props<T extends string> = {
  rotulo: string
  opcoes: Opcao<T>[]
  valor: T
  aoMudar: (valor: T) => void
}

/** Controle segmentado (ex.: Geral | 1º turno | 2º turno). */
export function Abas<T extends string>({ rotulo, opcoes, valor, aoMudar }: Props<T>) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="inline-flex rounded-lg border border-borda bg-superficie p-0.5">
      {opcoes.map((opcao) => {
        const ativa = opcao.valor === valor
        return (
          <button
            key={opcao.valor}
            type="button"
            role="radio"
            aria-checked={ativa}
            onClick={() => aoMudar(opcao.valor)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              ativa ? 'bg-superficie-2 text-texto shadow-sm' : 'text-texto-2 hover:text-texto'
            }`}
          >
            {opcao.rotulo}
          </button>
        )
      })}
    </div>
  )
}
