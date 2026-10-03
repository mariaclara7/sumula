import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router'
import { contar, movimentoReduzido, useAnimacao } from '../util/animacao'
import { coresDoTime } from '../util/cores'
import { Confete } from './Confete'
import type { CardDestaque } from '../util/destaques'
import { useRotacao } from './useRotacao'

const DURACAO = 6000
const LIMA = '#c6f432'
const VERMELHO = '#e5484d'
const LARANJA = '#ff8a1f'

/** Card que gira entre líder, vice, 3º, em chamas, em choque e lanterna, com abas embaixo. */
export function CarrosselDestaques({ cards }: { cards: CardDestaque[] }) {
  const rotacao = useRotacao(cards.length, DURACAO)
  const { progresso, repetir } = useAnimacao(cards.length > 0)
  const [reduzido] = useState(movimentoReduzido)
  // Confete do líder: uma rajada quando a página abre (o líder é o primeiro card) e outra a cada clique nele.
  const [confete, setConfete] = useState(1)

  // Os números contam de novo a cada card.
  useEffect(() => {
    repetir()
  }, [rotacao.indice, repetir])

  const card = cards[rotacao.indice]
  if (!card) return null

  const fogo = card.efeito === 'fogo' && !reduzido
  const choque = card.efeito === 'choque' && !reduzido
  const destaque = card.efeito === 'fogo' ? LARANJA : card.tom === 'vermelho' ? VERMELHO : LIMA
  const numero = (valor: number | string) => (typeof valor === 'number' ? contar(valor, progresso) : valor)

  const giro: CSSProperties =
    rotacao.fase === 'saindo'
      ? { transform: 'rotateY(90deg)', transition: 'transform .3s cubic-bezier(.5,0,.75,0)' }
      : rotacao.fase === 'entrando'
        ? { transform: 'rotateY(-90deg)', transition: 'none' }
        : { transform: 'none', transition: 'transform .5s cubic-bezier(.2,.8,.2,1)' }

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques da tabela"
      className="flex min-w-0 flex-col gap-3"
      onMouseEnter={rotacao.pausar}
      onMouseLeave={rotacao.retomar}
      onFocus={rotacao.pausar}
      onBlur={(evento) => {
        if (!evento.currentTarget.contains(evento.relatedTarget)) rotacao.retomar()
      }}
    >
      <div className="relative [perspective:1400px]">
        <div style={giro}>
          <Moldura
            card={card}
            choque={choque}
            aoComemorar={() => {
              setConfete((c) => c + 1)
              repetir()
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-[18px] -bottom-[34px] text-[150px] leading-none font-black tracking-[-6px] opacity-[.22]"
              style={{ color: coresDoTime(card.time).principal }}
            >
              {card.time.sigla}
            </span>
            {fogo && <EfeitoFogo />}
            {choque && <EfeitoChoque />}

            <div className="relative flex justify-between gap-3">
              <div className="min-w-0">
                <div className="font-mono text-xs font-extrabold tracking-[2px]" style={{ color: card.efeito === 'fogo' ? '#ff9a2e' : destaque }}>
                  {card.rotulo}
                </div>
                <div
                  className="mt-2.5 leading-none font-black tracking-[-1px] break-words uppercase"
                  style={{ fontSize: tamanhoDoNome(card.time.nomeCurto) }}
                >
                  {card.time.nomeCurto}
                </div>
                <div className="mt-3 text-[64px] leading-none font-black tracking-[-3px] tabular-nums">
                  <span
                    className={card.efeito === 'fogo' ? 'bg-[length:200%_100%] bg-clip-text text-transparent' : ''}
                    style={
                      card.efeito === 'fogo'
                        ? {
                            backgroundImage: 'linear-gradient(90deg,#ffd23f,#ff6a1a,#e5484d,#ff6a1a,#ffd23f)',
                            animation: reduzido ? undefined : 'calor 2.5s linear infinite',
                          }
                        : undefined
                    }
                  >
                    {numero(card.grande)}
                  </span>
                  <span className="text-base tracking-normal text-cinza"> {card.unidade}</span>
                </div>
              </div>
              <Anel valor={card.anel} rotulo={card.rotuloAnel} cor={destaque} progresso={progresso} />
            </div>

            <div className="relative mt-5 grid grid-cols-3 gap-2.5">
              {card.numeros.map((n) => (
                <div key={n.rotulo} className="border-t-2 pt-2" style={{ borderColor: destaque }}>
                  <div className="text-2xl font-black tabular-nums">{numero(n.valor)}</div>
                  <div className="text-xs text-cinza">{n.rotulo}</div>
                </div>
              ))}
            </div>
          </Moldura>
        </div>
        {/* Fora do card que gira, para a rajada não sumir nem girar junto na troca. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <Confete disparo={confete} />
        </div>
      </div>

      <div className="grid auto-cols-fr grid-flow-col gap-1.5" role="group" aria-label="Escolher o destaque">
        {cards.map((c, i) => {
          const ativo = i === rotacao.indice
          return (
            <button
              key={c.chave}
              type="button"
              onClick={() => rotacao.ir(i)}
              aria-label={`${c.rotulo.split(' · ')[0]}: ${c.time.nomeCurto}`}
              aria-current={ativo || undefined}
              className="group flex cursor-pointer flex-col gap-1.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lima"
            >
              <span className="block h-1 overflow-hidden bg-superficie-2">
                {ativo && <BarraTempo volta={rotacao.volta} duracao={DURACAO} pausado={rotacao.pausado} cheia={!rotacao.automatico} />}
              </span>
              <span className={`font-mono text-[11px] font-extrabold ${ativo ? 'text-texto' : 'text-texto-2 group-hover:text-texto'}`}>
                {c.time.sigla}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

/**
 * O card em si. O do líder é um botão que solta confete e faz os números contarem de novo (como era o
 * card do líder); os outros levam à página do time.
 */
function Moldura({
  card,
  choque,
  aoComemorar,
  children,
}: {
  card: CardDestaque
  choque: boolean
  aoComemorar: () => void
  children: ReactNode
}) {
  const classe = 'corte-duplo relative block h-[272px] cursor-pointer overflow-hidden bg-grafite p-6 text-creme hover:text-creme'
  const estilo = choque ? { animation: 'tremor 2.4s linear infinite' } : undefined
  const descricao = `${card.rotulo}: ${card.time.nomeCurto}, ${card.grande} ${card.unidade}.`

  if (card.chave === 'lider')
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`${descricao} Clique para comemorar.`}
        onClick={aoComemorar}
        onKeyDown={(evento) => {
          if (evento.key === 'Enter' || evento.key === ' ') {
            evento.preventDefault()
            aoComemorar()
          }
        }}
        className={`${classe} outline-offset-4`}
        style={estilo}
      >
        {children}
      </div>
    )

  return (
    <Link to={`/times/${card.time.id}`} aria-label={`${descricao} Ver o time.`} className={classe} style={estilo}>
      {children}
    </Link>
  )
}

/** Barra que enche no tempo de cada item. Parada (ou cheia, sem rotação automática) enquanto pausado. */
export function BarraTempo({ volta, duracao, pausado, cheia }: { volta: number; duracao: number; pausado: boolean; cheia: boolean }) {
  return (
    <span
      key={volta}
      className="block h-full w-full origin-left bg-texto"
      style={
        cheia
          ? undefined
          : { animation: `preencher ${duracao}ms linear forwards`, animationPlayState: pausado ? 'paused' : 'running' }
      }
    />
  )
}

function Anel({ valor, rotulo, cor, progresso }: { valor: number | null; rotulo: string; cor: string; progresso: number }) {
  const graus = (valor ?? 0) * 360 * progresso
  return (
    <div
      className="grid size-[104px] flex-none place-items-center rounded-full"
      style={{ background: `conic-gradient(${cor} ${graus}deg, #2b2b2b 0)` }}
    >
      <div className="flex size-[82px] flex-col items-center justify-center rounded-full bg-grafite text-center">
        <span className="text-2xl font-black tabular-nums">
          {textoDaChance(valor, progresso)}
        </span>
        <span className="text-[10px] leading-tight text-cinza">{rotulo}</span>
      </div>
    </div>
  )
}

/** Como na página de chances: nunca "100%" ou "0%" para o que ainda pode mudar. */
function textoDaChance(valor: number | null, progresso: number) {
  if (valor === null) return '—'
  if (valor >= 1) return `${contar(100, progresso)}%`
  if (valor > 0.995) return '>99%'
  if (valor > 0 && valor < 0.005) return '<1%'
  return `${contar(valor * 100, progresso)}%`
}

/** Diminui a fonte para a palavra mais longa do nome caber ao lado do anel (até 30px). */
function tamanhoDoNome(nome: string) {
  const maiorPalavra = Math.max(...nome.split(/[\s-]+/).map((palavra) => palavra.length))
  return Math.max(20, Math.min(30, Math.floor(160 / (maiorPalavra * 0.72))))
}

// Gerador pseudoaleatório com semente fixa: as brasas ficam sempre no mesmo lugar, sem pular a cada render.
function aleatorio(semente: number) {
  let s = semente
  return () => (s = (s * 9301 + 49297) % 233280) / 233280
}

const BRASAS = (() => {
  const r = aleatorio(7919)
  return Array.from({ length: 7 }, (_, i) => ({
    tamanho: 2 + r() * 4,
    cor: ['#ffd23f', '#ff9a2e', '#ff6a1a'][i % 3],
    esquerda: r() * 100,
    dx: (r() - 0.5) * 60,
    duracao: 2.6 + r() * 2.4,
    atraso: r() * 4,
  }))
})()

/** "Em chamas": aura laranja pulsando e brasas subindo. */
function EfeitoFogo() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ animation: 'aura 1.8s ease-in-out infinite alternate' }} />
      {BRASAS.map((b, i) => (
        <span
          key={i}
          className="absolute -bottom-2 rounded-full opacity-0"
          style={
            {
              left: `${b.esquerda}%`,
              width: b.tamanho,
              height: b.tamanho,
              background: b.cor,
              boxShadow: `0 0 ${b.tamanho * 2.5}px ${b.cor}`,
              '--dx': `${b.dx}px`,
              animation: `brasa ${b.duracao}s ${b.atraso}s linear infinite`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

/** "Em choque": clarão azul e raios piscando (o card treme junto). */
function EfeitoChoque() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[rgb(127_212_255/.16)] opacity-0" style={{ animation: 'raio 2.4s steps(1) infinite' }} />
      {[
        [8, 20, 0],
        [62, 120, 0.12],
        [84, 10, 0.06],
      ].map(([x, y, atraso]) => (
        <svg
          key={x}
          viewBox="0 0 40 120"
          className="absolute h-[110px] w-[34px] opacity-0 drop-shadow-[0_0_6px_#7fd4ff]"
          style={{ left: `${x}%`, top: y, animation: `raio 2.4s ${atraso}s steps(1) infinite` }}
        >
          <polyline points="24,0 10,42 26,50 8,120" fill="none" stroke="#d6f3ff" strokeWidth={2.5} strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  )
}
