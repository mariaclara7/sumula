import { Link } from 'react-router'
import { useEstatisticas, useMatematica } from '../api/consultas'
import { ROTULO_SEQUENCIA, SEQUENCIA_RUIM, indicadoresDeGols } from '../util/estatisticas'
import { metas, selosMatematicos, type Meta } from '../util/matematica'
import { Cartao } from './Cartao'
import { Carregando } from './Estado'
import { SeloMatematico } from './SeloMatematico'
import { Rotulo } from './TituloPagina'

/** Perfil de gols, sequências e a matemática do time na página dele. */
export function NumerosDoTime({ timeId }: { timeId: number }) {
  const estatisticas = useEstatisticas()
  const matematica = useMatematica()
  const doTime = estatisticas.data?.times.find((t) => t.time.id === timeId)
  const situacao = matematica.data?.find((s) => s.time.id === timeId)

  if (estatisticas.isError && matematica.isError) return null
  if (estatisticas.data && doTime?.gols.jogos === 0) return null

  return (
    <Cartao titulo="Números da temporada">
      {!doTime || !estatisticas.data ? (
        <Carregando />
      ) : (
        <>
          {situacao && (
            <div className="border-b border-borda p-4">
              <Rotulo className="mb-3 text-[11px] tracking-[1.5px] text-texto-2">
                <h3>A MATEMÁTICA</h3>
              </Rotulo>
              {selosMatematicos(situacao).length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selosMatematicos(situacao).map((selo) => (
                    <SeloMatematico key={selo.texto} selo={selo} />
                  ))}
                </div>
              )}
              <dl className="grid gap-3 sm:grid-cols-3">
                {metas(situacao).map((meta) => (
                  <MetaDoTime key={meta.rotulo} meta={meta} />
                ))}
              </dl>
              <p className="mt-3 text-xs text-texto-2">
                {situacao.jogosRestantes} jogos restantes, até {situacao.pontosMaximos} pontos possíveis. A conta considera
                que os adversários podem vencer todos os jogos.
              </p>
            </div>
          )}

          <div className="border-b border-borda p-4">
            <Rotulo className="mb-3 text-[11px] tracking-[1.5px] text-texto-2">
              <h3>GOLS</h3>
            </Rotulo>
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {indicadoresDeGols(doTime.gols, estatisticas.data.liga).map((item) => (
                <div key={item.rotulo}>
                  <dt className="text-xs text-texto-2">{item.rotulo}</dt>
                  <dd className="text-[26px] font-black tabular-nums">{item.valor}</dd>
                  {item.liga && <dd className="text-xs text-texto-2">liga: {item.liga}</dd>}
                </div>
              ))}
            </dl>
          </div>

          <div className="p-4">
            <Rotulo className="mb-3 text-[11px] tracking-[1.5px] text-texto-2">
              <h3>SEQUÊNCIAS</h3>
            </Rotulo>
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {doTime.sequencias.map((sequencia) => (
                <div key={sequencia.tipo}>
                  <dt className="text-xs text-texto-2">{ROTULO_SEQUENCIA[sequencia.tipo]}</dt>
                  <dd
                    className={`text-[26px] font-black tabular-nums ${
                      SEQUENCIA_RUIM[sequencia.tipo] && sequencia.atual >= 3 ? 'text-vermelho' : ''
                    }`}
                  >
                    {sequencia.atual}
                  </dd>
                  <dd className="text-xs text-texto-2">maior na temporada: {sequencia.maior}</dd>
                </div>
              ))}
            </dl>
          </div>
        </>
      )}
      <Link
        to="/estatisticas"
        className="block border-t border-borda px-4 py-3 text-[13px] font-bold text-destaque hover:underline"
      >
        Comparar com os outros times →
      </Link>
    </Cartao>
  )
}

function MetaDoTime({ meta }: { meta: Meta }) {
  const [valor, detalhe] = meta.impossivel
    ? ['Fora de alcance', 'já não dá, nem com tropeços dos outros']
    : meta.faltam === 0
      ? ['Garantido', `com ${meta.pontos} pontos`]
      : meta.dependeSoDele
        ? [`Faltam ${meta.faltam} pts`, `garante com ${meta.pontos} pontos`]
        : ['Depende dos outros', `garantia só com ${meta.pontos} pts; o time chega a no máximo ${meta.maximo}`]

  return (
    <div className="border-2 border-borda px-3 py-2.5">
      <dt className="text-xs text-texto-2">{meta.rotulo}</dt>
      <dd
        className={`text-[22px] font-black tabular-nums ${
          meta.faltam === 0 && !meta.impossivel ? 'text-verde' : meta.impossivel ? 'text-texto-2' : ''
        }`}
      >
        {valor}
      </dd>
      <dd className="text-xs text-texto-2">{detalhe}</dd>
    </div>
  )
}
