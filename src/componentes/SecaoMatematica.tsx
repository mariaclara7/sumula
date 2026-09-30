import { Link } from 'react-router'
import { useMatematica } from '../api/consultas'
import type { SituacaoMatematica } from '../api/tipos'
import { usePreferencias } from '../preferencias'
import { ULTIMA_POSICAO_SEGURA, metas, selosMatematicos } from '../util/matematica'
import { Escudo } from './Escudo'
import { Carregando } from './Estado'
import { SeloMatematico } from './SeloMatematico'

const COLUNAS = 'grid grid-cols-[minmax(150px,1fr)_52px_52px_96px_minmax(200px,1.4fr)]'

/** O que já está decidido na tabela e quantos pontos garantem título, vaga e permanência. */
export function SecaoMatematica() {
  const { data, isPending, isError } = useMatematica()
  const { meuTime } = usePreferencias()

  if (isError) return null

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-black tracking-[-1px] uppercase">A matemática</h2>
      <p className="mt-2 max-w-[720px] text-[15px] leading-[1.55] text-pretty text-texto-2">
        Sem sorteio: o que cada time ainda pode alcançar somando todos os pontos que disputa. A conta é conservadora,
        considera que qualquer adversário pode vencer todos os jogos que faltam.
      </p>

      {isPending ? (
        <Carregando />
      ) : (
        <>
          <Resumo situacoes={data} />
          <div className="mt-5 overflow-x-auto">
            <div role="table" aria-label="Matemática de cada time" className="min-w-[640px]">
              <div
                role="row"
                className={`${COLUNAS} h-9 items-center border-b-2 border-texto text-center font-mono text-[11px] font-extrabold tracking-[1px] text-texto-2`}
              >
                <span role="columnheader" className="text-left">TIME</span>
                <span role="columnheader">
                  <abbr title="Pontos atuais" className="no-underline">PTS</abbr>
                </span>
                <span role="columnheader">
                  <abbr title="Pontos máximos possíveis" className="no-underline">MÁX</abbr>
                </span>
                <span role="columnheader">
                  <abbr title="Melhor e pior posição que ainda pode alcançar" className="no-underline">PODE TERMINAR</abbr>
                </span>
                <span role="columnheader" className="text-left">SITUAÇÃO</span>
              </div>
              {data.map((s) => (
                <div
                  key={s.time.id}
                  role="row"
                  className={`${COLUNAS} min-h-[52px] items-center border-b border-borda text-center ${
                    meuTime === s.time.id ? 'bg-realce' : ''
                  }`}
                >
                  <div role="cell" className="flex min-w-0 items-center gap-2.5 text-left">
                    <span className="w-6 text-right text-base font-black">{s.posicao}</span>
                    <Escudo time={s.time} tamanho={24} />
                    <Link to={`/times/${s.time.id}`} className="truncate text-[15px] font-bold hover:text-destaque">
                      {s.time.nomeCurto}
                    </Link>
                  </div>
                  <span role="cell" className="text-lg font-black tabular-nums">{s.pontos}</span>
                  <span role="cell" className="font-mono text-sm text-texto-2 tabular-nums">{s.pontosMaximos}</span>
                  <span role="cell" className="font-mono text-sm font-bold tabular-nums">
                    {s.melhorPosicaoPossivel === s.piorPosicaoPossivel
                      ? `${s.melhorPosicaoPossivel}º`
                      : `${s.melhorPosicaoPossivel}º a ${s.piorPosicaoPossivel}º`}
                  </span>
                  <div role="cell" className="flex flex-wrap gap-1.5 py-2 text-left">
                    {selosMatematicos(s).length === 0 ? (
                      <span className="text-sm text-texto-2">Tudo em aberto</span>
                    ) : (
                      selosMatematicos(s).map((selo) => <SeloMatematico key={selo.texto} selo={selo} />)
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  )
}

/** As três perguntas que o torcedor faz, respondidas para o time que está no limite de cada faixa. */
function Resumo({ situacoes }: { situacoes: SituacaoMatematica[] }) {
  const lider = situacoes[0]
  const primeiroFora = situacoes[ULTIMA_POSICAO_SEGURA - 1]
  if (!lider) return null

  const [titulo] = metas(lider)
  const fuga = primeiroFora ? metas(primeiroFora)[2] : undefined

  const frase = (nome: string, meta: ReturnType<typeof metas>[number], objetivo: string) =>
    meta.faltam === 0
      ? `${nome} já garantiu: ${objetivo}.`
      : meta.dependeSoDele
        ? `${nome} garante ${objetivo} com ${meta.pontos} pontos: faltam ${meta.faltam}.`
        : `${nome} ainda não garante ${objetivo} sozinho: precisa de tropeços dos outros.`

  return (
    <div className="mt-5 grid gap-3 md:grid-cols-2">
      <p className="border-2 border-texto bg-superficie px-4 py-3 text-[15px] font-bold">
        <span className="font-mono text-[11px] font-extrabold tracking-[1.5px] text-texto-2 block">TÍTULO</span>
        {frase(lider.time.nomeCurto, titulo, 'o título')}
      </p>
      {fuga && (
        <p className="border-2 border-texto bg-superficie px-4 py-3 text-[15px] font-bold">
          <span className="font-mono text-[11px] font-extrabold tracking-[1.5px] text-texto-2 block">
            REBAIXAMENTO · {ULTIMA_POSICAO_SEGURA}º COLOCADO
          </span>
          {frase(primeiroFora.time.nomeCurto, fuga, 'a permanência')}
        </p>
      )}
    </div>
  )
}
