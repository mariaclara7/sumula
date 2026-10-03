import { useState } from 'react'
import type { FotoJogador as Foto } from '../api/tipos'

type Props = {
  foto: Foto | null | undefined
  nome: string
  className?: string
}

/** Foto do jogador; se não houver ou não carregar, não ocupa espaço (o card fica como era). */
export function FotoJogador({ foto, nome, className = '' }: Props) {
  const [falhou, setFalhou] = useState(false)
  if (!foto || falhou) return null

  return (
    <img
      src={foto.url}
      alt={`Foto de ${nome}`}
      loading="lazy"
      decoding="async"
      onError={() => setFalhou(true)}
      className={`pointer-events-none object-cover object-top ${className}`}
    />
  )
}

/** "Foto: Fulano · CC BY-SA 4.0". Com link para a página do arquivo quando dá para ter link ali. */
export function CreditoFoto({ foto, link = true, className = '' }: { foto: Foto; link?: boolean; className?: string }) {
  const texto = ['Foto', foto.autor && `: ${foto.autor}`, foto.licenca && ` · ${foto.licenca}`].filter(Boolean).join('')
  return link ? (
    <a href={foto.pagina} target="_blank" rel="noreferrer" className={`hover:underline ${className}`}>
      {texto} · Wikimedia Commons
    </a>
  ) : (
    <span className={className}>{texto}</span>
  )
}
