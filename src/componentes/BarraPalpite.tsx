import type { Palpite, Time } from '../api/tipos'

type Props = {
  palpite: Palpite
  mandante: Time
  visitante: Time
  /** Mostra também o placar mais provável. */
  comPlacar?: boolean
}

const porcento = (chance: number) => `${Math.round(chance * 100)}%`

/**
 * Chances de vitória do mandante, empate e vitória do visitante numa barra só,
 * sempre com os números escritos embaixo: a cor nunca é a única pista.
 */
export function BarraPalpite({ palpite, mandante, visitante, comPlacar = true }: Props) {
  const partes = [
    { chave: 'mandante', chance: palpite.vitoriaMandante, cor: 'bg-texto', rotulo: mandante.sigla },
    { chave: 'empate', chance: palpite.empate, cor: 'bg-cinza', rotulo: 'Empate' },
    { chave: 'visitante', chance: palpite.vitoriaVisitante, cor: 'bg-azul', rotulo: visitante.sigla },
  ]

  return (
    <div
      className="mt-2"
      aria-label={`Palpite da Súmula: ${mandante.nomeCurto} ${porcento(palpite.vitoriaMandante)}, empate ${porcento(palpite.empate)}, ${visitante.nomeCurto} ${porcento(palpite.vitoriaVisitante)}`}
    >
      {/* gap-0.5: 2px de fundo separando as partes, em vez de borda. */}
      <div className="flex h-1.5 gap-0.5" aria-hidden>
        {partes.map((parte) => (
          <div key={parte.chave} className={parte.cor} style={{ flexGrow: parte.chance, flexBasis: 0 }} />
        ))}
      </div>
      <div className="mt-1 flex justify-between gap-2 font-mono text-[11px] font-bold text-texto-2" aria-hidden>
        {partes.map((parte) => (
          <span key={parte.chave} className="flex items-center gap-1 whitespace-nowrap">
            <span className={`inline-block size-2 ${parte.cor}`} />
            {parte.rotulo} {porcento(parte.chance)}
          </span>
        ))}
      </div>
      {comPlacar && (
        <div className="mt-0.5 text-center font-mono text-[11px] font-bold text-texto-2">
          palpite da Súmula: {palpite.placarMaisProvavel.mandante} × {palpite.placarMaisProvavel.visitante}
        </div>
      )}
    </div>
  )
}
