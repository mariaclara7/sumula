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
    <div role="radiogroup" aria-label={rotulo} className="inline-flex max-w-full overflow-x-auto border-2 border-texto">
      {opcoes.map((opcao, indice) => {
        const ativa = opcao.valor === valor
        return (
          <button
            key={opcao.valor}
            type="button"
            role="radio"
            aria-checked={ativa}
            onClick={() => aoMudar(opcao.valor)}
            className={`cursor-pointer px-3.5 py-[9px] text-[13px] font-extrabold whitespace-nowrap transition-[background-color,transform] duration-200 active:scale-[.96] ${
              indice > 0 ? 'border-l-2 border-texto' : ''
            } ${ativa ? 'bg-texto text-texto-invertido' : 'bg-superficie text-texto'}`}
          >
            {opcao.rotulo}
          </button>
        )
      })}
    </div>
  )
}
