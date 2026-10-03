import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import type { CorNoticia, Noticia } from '../util/noticias'
import { BarraTempo } from './CarrosselDestaques'
import { useRotacao } from './useRotacao'

const DURACAO = 6000

const ETIQUETA: Record<CorNoticia, string> = {
  lima: 'bg-lima text-grafite',
  vermelho: 'bg-vermelho text-white',
  grafite: 'bg-grafite text-lima shadow-[inset_0_0_0_1px_#c6f432]',
  azul: 'bg-azul text-white',
}

/** Uma manchete por vez, como a tarja de notícias da TV, com setas, contador e "a seguir". */
export function CarrosselNoticias({ noticias }: { noticias: Noticia[] }) {
  const rotacao = useRotacao(noticias.length, DURACAO)
  const noticia = noticias[rotacao.indice]
  const seguinte = noticias[(rotacao.indice + 1) % noticias.length]

  const movimento: CSSProperties =
    rotacao.fase === 'saindo'
      ? { transform: 'translateY(-18px)', opacity: 0, transition: 'transform .3s cubic-bezier(.5,0,.75,0), opacity .3s' }
      : rotacao.fase === 'entrando'
        ? { transform: 'translateY(18px)', opacity: 0, transition: 'none' }
        : { transform: 'none', opacity: 1, transition: 'transform .45s cubic-bezier(.2,.8,.2,1), opacity .35s' }

  const contador = (n: number) => String(n).padStart(2, '0')

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Últimas notícias"
      className="flex min-w-0 flex-col gap-2.5"
      onMouseEnter={rotacao.pausar}
      onMouseLeave={rotacao.retomar}
      onFocus={rotacao.pausar}
      onBlur={(evento) => {
        if (!evento.currentTarget.contains(evento.relatedTarget)) rotacao.retomar()
      }}
    >
      <div className="flex items-center gap-2.5 font-mono text-xs font-extrabold tracking-[2px] text-texto-2">
        <span aria-hidden className="size-2 flex-none rounded-full bg-vermelho motion-safe:animate-[pulsar_1.2s_ease-in-out_infinite]" />
        <h2 className="text-texto">ÚLTIMAS NOTÍCIAS</h2>
        {noticias.length > 1 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="tracking-[1px] tabular-nums">
              {contador(rotacao.indice + 1)} / {contador(noticias.length)}
            </span>
            <BotaoSeta rotulo="Notícia anterior" onClick={rotacao.anterior}>
              ←
            </BotaoSeta>
            <BotaoSeta rotulo="Próxima notícia" onClick={rotacao.seguinte}>
              →
            </BotaoSeta>
          </div>
        )}
      </div>

      {noticia ? (
        <Link
          to={noticia.link}
          className="relative block min-h-[198px] overflow-hidden border-2 border-texto bg-superficie p-6 text-texto transition-shadow hover:text-texto hover:shadow-[5px_5px_0_var(--texto)] focus-visible:shadow-[5px_5px_0_#c6f432] focus-visible:outline-none"
        >
          {/* Lido por leitor de tela quando a pessoa troca a notícia; na troca automática, fica quieto. */}
          <div aria-live={rotacao.automatico && !rotacao.pausado ? 'off' : 'polite'} className="flex flex-col items-start gap-3.5" style={movimento}>
            <span className={`px-2.5 py-[5px] font-mono text-xs font-extrabold ${ETIQUETA[noticia.cor]}`}>{noticia.etiqueta}</span>
            <span className="text-[clamp(22px,2.6vw,34px)] leading-[1.1] font-black tracking-[-1px] text-balance">{noticia.texto}</span>
          </div>
          {noticias.length > 1 && (
            <span className="absolute inset-x-0 bottom-0 block h-1 bg-superficie-2">
              <BarraTempo volta={rotacao.volta} duracao={DURACAO} pausado={rotacao.pausado} cheia={!rotacao.automatico} />
            </span>
          )}
        </Link>
      ) : (
        <p className="border-2 border-texto bg-superficie p-6 text-[15px] text-texto-2">Nenhuma notícia por enquanto.</p>
      )}

      {seguinte && noticias.length > 1 && (
        <button
          type="button"
          onClick={rotacao.seguinte}
          className="flex min-w-0 cursor-pointer items-center gap-3 border-2 border-dashed border-borda px-4 py-3 text-left hover:border-texto-2 focus-visible:border-texto focus-visible:outline-none"
        >
          <span className="flex-none font-mono text-[11px] font-extrabold tracking-[1px] text-texto-2">A SEGUIR</span>
          <span className="min-w-0 truncate text-sm font-bold text-texto">{seguinte.texto}</span>
        </button>
      )}
    </section>
  )
}

function BotaoSeta({ rotulo, onClick, children }: { rotulo: string; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      onClick={onClick}
      className="size-[30px] cursor-pointer border-2 border-texto bg-superficie font-sans text-sm font-black text-texto transition-transform hover:bg-lima hover:text-grafite focus-visible:bg-lima focus-visible:text-grafite focus-visible:outline-none active:scale-90"
    >
      {children}
    </button>
  )
}
