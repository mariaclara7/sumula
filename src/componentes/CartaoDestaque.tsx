type Props = {
  rotulo: string
  /** Cor do rótulo, ex.: 'text-azul'. No card escuro é sempre lima. */
  corRotulo?: string
  nome: React.ReactNode
  valor: React.ReactNode
  corValor?: string
  escuro?: boolean
}

/** Card de destaque do topo das páginas (ex.: "FAVORITO AO TÍTULO · Flamengo · 75%"). */
export function CartaoDestaque({ rotulo, corRotulo = 'text-texto-2', nome, valor, corValor = '', escuro = false }: Props) {
  return (
    <div
      className={
        escuro ? 'corte-canto bg-grafite px-5 py-[18px] text-creme' : 'border-2 border-texto bg-superficie px-5 py-4'
      }
    >
      <div className={`font-mono text-[11px] font-extrabold tracking-[2px] ${escuro ? 'text-lima' : corRotulo}`}>
        {rotulo}
      </div>
      <div className="mt-2.5 flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-[22px] font-black">{nome}</span>
        <span className={`text-[44px] leading-none font-black tabular-nums ${escuro ? 'text-lima' : corValor}`}>
          {valor}
        </span>
      </div>
    </div>
  )
}
