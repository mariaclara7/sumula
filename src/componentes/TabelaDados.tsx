import type { ReactNode } from 'react'

type Props = {
  /** Linha do cabeçalho (<th>s). */
  cabecalho: ReactNode
  /** Linhas do corpo (<tr>s). */
  children: ReactNode
  className?: string
}

/**
 * "Ver dados em tabela": os números por trás de um gráfico, escondidos até a pessoa abrir.
 * Também é a forma de ler o gráfico para quem usa leitor de tela.
 */
export function TabelaDados({ cabecalho, children, className = '' }: Props) {
  return (
    <details className={`group border-t border-borda ${className}`}>
      <summary className="flex cursor-pointer list-none items-center gap-2 py-3 font-mono text-[11px] font-extrabold tracking-[1.5px] text-texto-2 select-none hover:text-texto [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="inline-block transition-transform duration-200 group-open:rotate-90">
          ▶
        </span>
        <span className="group-open:hidden">VER DADOS EM TABELA</span>
        <span className="hidden group-open:inline">ESCONDER TABELA</span>
      </summary>
      <div className="rolagem-sutil mb-3 max-h-80 overflow-auto border-2 border-texto bg-superficie">
        <table className="w-full text-center font-mono text-[13px] font-medium tabular-nums">
          <thead className="sticky top-0 z-[1] bg-superficie text-[11px] font-extrabold tracking-[1px] text-texto-2">
            <tr className="h-9 shadow-[inset_0_-2px_0_var(--texto)]">{cabecalho}</tr>
          </thead>
          <tbody className="[&_tr]:h-9 [&_tr]:border-t [&_tr]:border-borda [&_tr:first-child]:border-t-0 [&_tr:hover]:bg-realce">
            {children}
          </tbody>
        </table>
      </div>
    </details>
  )
}

/** Variação de posição em relação à rodada anterior (▲ subiu, ▼ caiu). */
export function Variacao({ valor }: { valor: number | null }) {
  if (valor === null || valor === 0) return <span className="text-texto-2">—</span>
  return valor > 0 ? <span className="text-verde">▲{valor}</span> : <span className="text-vermelho">▼{-valor}</span>
}
