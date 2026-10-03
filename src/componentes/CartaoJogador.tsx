import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { Artilheiro, Time } from '../api/tipos'
import { atributosDoJogador, notaDoJogador } from '../util/notas'
import { Escudo } from './Escudo'
import { CreditoFoto, FotoJogador } from './FotoJogador'

type Props = {
  artilheiro: Artilheiro
  /** Posição na artilharia (1 = artilheiro). */
  posicao: number
  time: Time | undefined
  /** Gols do time na temporada, para a participação do jogador. */
  golsDoTime: number | undefined
  aoFechar: () => void
}

const DURACAO_SAIDA = 300

/** Painel lateral com o "card" do jogador: nota, atributos e números. Fecha com Esc ou clicando fora. */
export function CartaoJogador({ artilheiro, posicao, time, golsDoTime, aoFechar }: Props) {
  const [aberto, setAberto] = useState(false)
  const botaoFechar = useRef<HTMLButtonElement>(null)
  const fechando = useRef(false)

  function fechar() {
    if (fechando.current) return
    fechando.current = true
    setAberto(false)
    setTimeout(aoFechar, DURACAO_SAIDA)
  }

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null
    const quadro = requestAnimationFrame(() => setAberto(true))
    botaoFechar.current?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(quadro)
      document.body.style.overflow = overflow
      anterior?.focus()
    }
  }, [])

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') fechar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  })

  const { gols, jogos, assistencias, foto } = artilheiro
  const participacao =
    golsDoTime && golsDoTime > 0 ? `${Math.round(((gols + (assistencias ?? 0)) / golsDoTime) * 100)}%` : '—'
  const numeros = [
    { rotulo: 'Gols', valor: String(gols) },
    { rotulo: 'Assistências', valor: assistencias === null ? '—' : String(assistencias) },
    { rotulo: 'Gols por jogo', valor: jogos ? (gols / jogos).toFixed(2).replace('.', ',') : '—' },
    { rotulo: 'Participação nos gols do time', valor: participacao },
  ]

  return (
    <div
      onClick={fechar}
      className={`fixed inset-0 z-30 flex justify-end bg-[rgb(10_10_10/0.55)] transition-opacity duration-300 ${aberto ? 'opacity-100' : 'opacity-0'}`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cartao-jogador-nome"
        onClick={(evento) => evento.stopPropagation()}
        className={`flex h-full w-[min(420px,100%)] flex-col gap-[18px] overflow-y-auto bg-fundo p-6 text-texto transition-transform duration-[450ms] ease-[cubic-bezier(.2,.8,.2,1)] ${
          aberto ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-extrabold tracking-[2px] text-texto-2">CARD DO JOGADOR</span>
          <button
            ref={botaoFechar}
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="size-9 cursor-pointer border-2 border-texto text-base font-black hover:bg-lima hover:text-grafite"
          >
            ×
          </button>
        </div>

        <div>
          <div className="corte-duplo-p relative overflow-hidden bg-grafite p-6 text-creme">
            {/* A foto ocupa a direita do card e some em degradê por trás do texto. */}
            <FotoJogador
              foto={foto}
              nome={artilheiro.nome}
              className="absolute inset-y-0 right-0 h-full w-[58%] [mask-image:linear-gradient(to_left,black_55%,transparent)]"
            />
            <div className="relative flex items-start justify-between">
              <div className="flex flex-col leading-[.9]">
                <span className="text-[64px] font-black tracking-[-2px] text-lima">{notaDoJogador(artilheiro)}</span>
                <span className="font-mono text-xs font-extrabold tracking-[2px]">ATA · {posicao}º</span>
              </div>
              {time && !foto && <Escudo time={time} tamanho={56} circulo contorno="0 0 0 2px #f2f1ec" />}
            </div>
            <div
              id="cartao-jogador-nome"
              className={`relative mt-[18px] text-[30px] leading-[1.05] font-black ${foto ? 'max-w-[65%] [text-shadow:0_1px_8px_#111]' : ''}`}
            >
              {artilheiro.nome}
            </div>
            {time && (
              <div className="relative mt-1 flex items-center gap-2 text-sm text-cinza">
                {foto && <Escudo time={time} tamanho={20} circulo contorno="0 0 0 1.5px #f2f1ec" />}
                {time.nomeCurto}
              </div>
            )}
          </div>
          {foto && <CreditoFoto foto={foto} className="mt-1.5 block text-right text-[11px] text-texto-2" />}
        </div>

        <ul className="flex flex-col gap-3">
          {atributosDoJogador(artilheiro).map((atributo) => (
            <li key={atributo.rotulo} className="grid grid-cols-[110px_minmax(0,1fr)_40px] items-center gap-3">
              <span className="font-mono text-xs font-extrabold tracking-[1px]">{atributo.rotulo}</span>
              <div className="h-2.5 bg-superficie-2">
                <div
                  className={`h-full transition-[width] duration-[600ms] ease-[cubic-bezier(.2,.8,.2,1)] ${atributo.cor}`}
                  style={{ width: `${aberto && atributo.nota !== null ? atributo.nota : 0}%` }}
                />
              </div>
              <span className="text-right text-lg font-black">{atributo.nota ?? '—'}</span>
            </li>
          ))}
        </ul>

        <dl className="grid grid-cols-2 gap-2.5">
          {numeros.map((n) => (
            <div key={n.rotulo} className="border-2 border-texto bg-superficie px-3.5 py-3">
              <dt className="text-xs text-texto-2">{n.rotulo}</dt>
              <dd className="text-[28px] font-black">{n.valor}</dd>
            </div>
          ))}
        </dl>

        {time && (
          <Link
            to={`/times/${time.id}`}
            className="border-2 border-texto bg-lima px-4 py-3 text-center text-sm font-extrabold text-grafite shadow-[4px_4px_0_var(--texto)] transition-[translate,box-shadow] duration-75 hover:text-grafite active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            Ver {time.nomeCurto} →
          </Link>
        )}
      </div>
    </div>
  )
}
