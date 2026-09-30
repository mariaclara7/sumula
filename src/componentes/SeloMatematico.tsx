import type { Selo } from '../util/matematica'

const ESTILO: Record<Selo['tom'], string> = {
  bom: 'bg-lima text-grafite',
  ruim: 'bg-vermelho text-white',
  neutro: 'bg-superficie-2 text-texto',
}

/** Etiqueta como "Campeão", "Rebaixado" ou "Sem chance de título". */
export function SeloMatematico({ selo }: { selo: Selo }) {
  return (
    <span className={`inline-block px-2 py-[3px] font-mono text-[11px] font-extrabold tracking-[0.5px] uppercase ${ESTILO[selo.tom]}`}>
      {selo.texto}
    </span>
  )
}
