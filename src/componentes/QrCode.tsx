import { useEffect, useState } from 'react'

/**
 * QR Code desenhado em SVG (quadradinhos pretos sobre branco, nos dois temas, para qualquer câmera ler).
 * A biblioteca é baixada só quando o QR aparece.
 */
export function QrCode({
  texto,
  rotulo,
  tamanho = 240,
  className = '',
}: {
  texto: string
  rotulo: string
  tamanho?: number
  /** Para mudar o tamanho por tela (ex.: max-md:size-[132px]). */
  className?: string
}) {
  const [desenho, setDesenho] = useState<{ texto: string; lado: number; caminho: string } | null>(null)

  useEffect(() => {
    let cancelado = false
    import('qrcode-generator').then(({ default: qrcode }) => {
      if (cancelado) return
      const qr = qrcode(0, 'M')
      qr.addData(texto)
      qr.make()
      const lado = qr.getModuleCount()
      let caminho = ''
      for (let linha = 0; linha < lado; linha++)
        for (let coluna = 0; coluna < lado; coluna++) if (qr.isDark(linha, coluna)) caminho += `M${coluna} ${linha}h1v1h-1z`
      setDesenho({ texto, lado, caminho })
    })
    return () => {
      cancelado = true
    }
  }, [texto])

  const pronto = desenho?.texto === texto
  return (
    <div
      className={`grid size-(--lado) place-items-center bg-white p-2 ${className}`}
      style={{ '--lado': `${tamanho}px` } as React.CSSProperties}
    >
      {pronto ? (
        <svg role="img" aria-label={rotulo} viewBox={`-2 -2 ${desenho.lado + 4} ${desenho.lado + 4}`} className="size-full" shapeRendering="crispEdges">
          <path d={desenho.caminho} fill="#111111" />
        </svg>
      ) : (
        <span className="size-7 animate-spin border-[3px] border-[#d9d7cf] border-t-[#111]" aria-label="Gerando o QR Code" />
      )}
    </div>
  )
}
