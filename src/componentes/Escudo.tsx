import type { Time } from '../api/tipos'

type Props = { time: Time; tamanho?: 'p' | 'm' | 'g' }

const TAMANHOS = { p: 'size-5', m: 'size-8', g: 'size-16' }

export function Escudo({ time, tamanho = 'p' }: Props) {
  if (!time.escudo) {
    return (
      <span
        aria-hidden
        className={`${TAMANHOS[tamanho]} inline-flex shrink-0 items-center justify-center rounded-full bg-superficie-2 text-[10px] font-semibold text-texto-2`}
      >
        {time.sigla.slice(0, 3)}
      </span>
    )
  }

  return <img src={time.escudo} alt="" loading="lazy" className={`${TAMANHOS[tamanho]} shrink-0 object-contain`} />
}
