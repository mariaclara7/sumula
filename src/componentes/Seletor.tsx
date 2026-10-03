import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

export type OpcaoSeletor<T> = {
  valor: T
  rotulo: string
  /** Ex.: escudo do time, à esquerda do nome. */
  icone?: ReactNode
  /** Texto menor à direita (ex.: "3 sem palpite"). */
  detalhe?: string
  desabilitada?: boolean
}

type Props<T> = {
  /** Nome do campo para leitores de tela. */
  rotulo: string
  opcoes: OpcaoSeletor<T>[]
  valor: T
  aoMudar: (valor: T) => void
  /** Conteúdo do botão (cada lugar tem o seu visual). */
  children: ReactNode
  className?: string
  /** Lado em que a lista abre. No canto direito da tela, "direita" evita que ela saia da tela. */
  alinhar?: 'esquerda' | 'direita'
}

/**
 * Caixa de seleção com o visual do site, no lugar do <select> nativo (cuja lista aberta segue o sistema e, no
 * cabeçalho escuro, ficava com texto claro em fundo claro). Segue o padrão "combobox só de seleção" da WAI-ARIA:
 * o foco fica no botão, as setas andam pela lista, Enter/Espaço escolhe, Esc fecha e digitar letras pula para a
 * opção que começa com elas.
 */
export function Seletor<T>({ rotulo, opcoes, valor, aoMudar, children, className = '', alinhar = 'esquerda' }: Props<T>) {
  const id = useId()
  const [aberto, setAberto] = useState(false)
  const [ativa, setAtiva] = useState(0)
  const raiz = useRef<HTMLDivElement>(null)
  const lista = useRef<HTMLUListElement>(null)
  const busca = useRef({ texto: '', ate: 0 })

  // -1 quando nada está escolhido ainda (ex.: comparador sem time).
  const selecionada = opcoes.findIndex((o) => o.valor === valor)

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!aberto) return
    const aoClicar = (evento: PointerEvent) => {
      if (!raiz.current?.contains(evento.target as Node)) setAberto(false)
    }
    document.addEventListener('pointerdown', aoClicar)
    return () => document.removeEventListener('pointerdown', aoClicar)
  }, [aberto])

  // Mantém a opção ativa visível ao andar com as setas.
  useEffect(() => {
    if (!aberto) return
    lista.current?.querySelector(`[data-indice="${ativa}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [aberto, ativa])

  function abrir() {
    setAtiva(selecionada >= 0 ? selecionada : andar(0, 1))
    setAberto(true)
  }

  function escolher(indice: number) {
    const opcao = opcoes[indice]
    if (!opcao || opcao.desabilitada) return
    setAberto(false)
    if (opcao.valor !== valor) aoMudar(opcao.valor)
  }

  /** Próxima opção habilitada a partir de "inicio", andando "passo" (1 ou -1). */
  function andar(inicio: number, passo: number) {
    for (let i = inicio; i >= 0 && i < opcoes.length; i += passo) {
      if (!opcoes[i].desabilitada) return i
    }
    return ativa
  }

  function procurar(letra: string) {
    const agora = Date.now()
    busca.current = { texto: (agora < busca.current.ate ? busca.current.texto : '') + letra.toLowerCase(), ate: agora + 700 }
    const normalizar = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    const alvo = normalizar(busca.current.texto)
    const indice = opcoes.findIndex((o) => !o.desabilitada && normalizar(o.rotulo).startsWith(alvo))
    if (indice >= 0) setAtiva(indice)
    return indice
  }

  function aoTeclar(evento: KeyboardEvent) {
    const tecla = evento.key
    if (!aberto) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(tecla)) {
        evento.preventDefault()
        abrir()
      } else if (tecla.length === 1 && /\S/.test(tecla)) {
        abrir()
        procurar(tecla)
      }
      return
    }

    const acoes: Record<string, () => void> = {
      ArrowDown: () => setAtiva(andar(ativa + 1, 1)),
      ArrowUp: () => setAtiva(andar(ativa - 1, -1)),
      Home: () => setAtiva(andar(0, 1)),
      End: () => setAtiva(andar(opcoes.length - 1, -1)),
      PageDown: () => setAtiva(andar(Math.min(ativa + 8, opcoes.length - 1), -1)),
      PageUp: () => setAtiva(andar(Math.max(ativa - 8, 0), 1)),
      Enter: () => escolher(ativa),
      ' ': () => (busca.current.ate > Date.now() ? procurar(' ') : escolher(ativa)),
      Escape: () => setAberto(false),
    }
    if (acoes[tecla]) {
      evento.preventDefault()
      acoes[tecla]()
    } else if (tecla === 'Tab') {
      escolher(ativa)
    } else if (tecla.length === 1 && /\S/.test(tecla)) {
      procurar(tecla)
    }
  }

  return (
    <div ref={raiz} className="relative min-w-0">
      <button
        type="button"
        role="combobox"
        aria-label={rotulo}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={`${id}-lista`}
        aria-activedescendant={aberto ? `${id}-${ativa}` : undefined}
        onClick={() => (aberto ? setAberto(false) : abrir())}
        onKeyDown={aoTeclar}
        className={`cursor-pointer text-left ${className}`}
      >
        {children}
      </button>

      {aberto && (
        <ul
          ref={lista}
          id={`${id}-lista`}
          role="listbox"
          aria-label={rotulo}
          tabIndex={-1}
          className={`absolute top-[calc(100%+6px)] z-50 max-h-[min(360px,60dvh)] w-max min-w-full max-w-[min(320px,calc(100vw-32px))] overflow-y-auto border-2 border-texto bg-superficie py-1 text-texto shadow-[5px_5px_0_var(--texto)] ${
            alinhar === 'direita' ? 'right-0' : 'left-0'
          }`}
        >
          {opcoes.map((opcao, indice) => {
            const escolhida = indice === selecionada
            const destacada = indice === ativa
            return (
              <li
                key={String(opcao.valor)}
                id={`${id}-${indice}`}
                data-indice={indice}
                role="option"
                aria-selected={escolhida}
                aria-disabled={opcao.desabilitada || undefined}
                onPointerDown={(evento) => evento.preventDefault()}
                onPointerMove={() => !opcao.desabilitada && setAtiva(indice)}
                onClick={() => escolher(indice)}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm whitespace-nowrap ${
                  opcao.desabilitada
                    ? 'cursor-not-allowed text-texto-2 opacity-50'
                    : destacada
                      ? 'cursor-pointer bg-lima text-grafite'
                      : 'cursor-pointer'
                } ${escolhida ? 'font-black' : 'font-semibold'}`}
              >
                {opcao.icone}
                <span className="min-w-0 flex-1 truncate">{opcao.rotulo}</span>
                {opcao.detalhe && (
                  <span className={`font-mono text-[11px] ${destacada ? 'text-grafite' : 'text-texto-2'}`}>{opcao.detalhe}</span>
                )}
                <span aria-hidden className="w-3 text-center">
                  {escolhida ? '✓' : ''}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
