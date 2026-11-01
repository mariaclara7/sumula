import type { ParticipanteSala } from '../api/salas'
import { corDoParticipante, iniciais } from '../util/salas'

/** Bolinha com as iniciais e a cor da pessoa na sala. */
export function AvatarParticipante({ participante, tamanho }: { participante: Pick<ParticipanteSala, 'nome' | 'cor'>; tamanho: number }) {
  const cor = corDoParticipante(participante.cor)
  return (
    <span
      aria-hidden
      className="grid flex-none place-items-center rounded-full font-black"
      style={{ width: tamanho, height: tamanho, background: cor.fundo, color: cor.texto, fontSize: Math.round(tamanho * 0.36) }}
    >
      {iniciais(participante.nome)}
    </span>
  )
}
