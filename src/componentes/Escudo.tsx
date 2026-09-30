import type { Time } from '../api/tipos'
import { coresDoTime } from '../util/cores'

type Props = {
  time: Time
  /** Lado em pixels. */
  tamanho?: number
  /**
   * Desenha o escudo dentro de um círculo nas cores do time (cabeçalhos e cards grandes).
   * Sem escudo na API, o círculo sempre aparece, com a sigla.
   */
  circulo?: boolean
  /** Contorno do círculo, ex.: '0 0 0 3px #f2f1ec'. */
  contorno?: string
  /** Troca as cores do círculo (fundo na cor secundária). */
  invertido?: boolean
}

export function Escudo({ time, tamanho = 20, circulo = false, contorno, invertido = false }: Props) {
  if (time.escudo && !circulo) {
    return (
      <img
        src={time.escudo}
        alt=""
        loading="lazy"
        className="shrink-0 object-contain"
        style={{ width: tamanho, height: tamanho }}
      />
    )
  }

  const cores = coresDoTime(time)
  const [fundo, frente] = invertido ? [cores.secundaria, cores.principal] : [cores.principal, cores.secundaria]

  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full font-black"
      style={{
        width: tamanho,
        height: tamanho,
        background: time.escudo ? '#ffffff' : fundo,
        color: frente,
        fontSize: Math.max(7, Math.round(tamanho * 0.3)),
        boxShadow: contorno ?? 'inset 0 0 0 1px rgb(0 0 0 / 0.15)',
      }}
    >
      {time.escudo ? (
        <img src={time.escudo} alt="" loading="lazy" className="object-contain" style={{ width: '64%', height: '64%' }} />
      ) : (
        time.sigla.slice(0, 3)
      )}
    </span>
  )
}
