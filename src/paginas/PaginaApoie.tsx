import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { BotaoPrincipal } from '../componentes/Estado'
import { Pagina } from '../componentes/Pagina'
import { QrCode } from '../componentes/QrCode'
import { Rotulo, TituloPagina } from '../componentes/TituloPagina'
import { PIX } from '../config'
import { codigoPix } from '../util/pix'

const VALORES = [5, 10, 20, 50]

/** /apoie: Pix estático (QR Code e copia e cola). O dinheiro vai direto para a conta; o site não fica sabendo. */
export function PaginaApoie() {
  if (!PIX) {
    return (
      <Pagina className="pt-9 pb-16">
        <TituloPagina>Apoie</TituloPagina>
        <p className="mt-[18px] max-w-[720px] text-[15px] text-texto-2">O apoio por Pix ainda não está disponível. Volte em breve!</p>
      </Pagina>
    )
  }
  return <Apoio dados={PIX} />
}

function Apoio({ dados }: { dados: NonNullable<typeof PIX> }) {
  // null: sem valor (a pessoa digita no app do banco).
  const [valor, setValor] = useState<number | null>(10)
  const [outro, setOutro] = useState('')
  const [copiado, setCopiado] = useState(false)
  const codigo = codigoPix(dados, valor ?? undefined)

  useEffect(() => {
    if (!copiado) return
    const timer = setTimeout(() => setCopiado(false), 3000)
    return () => clearTimeout(timer)
  }, [copiado])

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
    } catch {
      // Sem acesso à área de transferência: a pessoa copia do campo, que fica selecionável.
    }
  }

  const botaoValor = (ativo: boolean) =>
    `h-12 cursor-pointer border-2 px-4 text-[15px] font-black transition-[transform,background-color] duration-150 hover:-translate-y-0.5 ${
      ativo ? 'border-lima bg-lima text-grafite' : 'border-creme/40 bg-transparent text-creme hover:border-creme'
    }`

  return (
    <Pagina className="pt-9 pb-16">
      <TituloPagina>Apoie</TituloPagina>
      <p className="mt-[18px] max-w-[720px] text-[15px] leading-[1.55] text-pretty text-texto-2">
        A BraSúmula é um projeto independente, sem anúncios. Se o site te ajuda a acompanhar o Brasileirão, você pode apoiar
        com um Pix de qualquer valor.
      </p>

      <div className="mt-8 grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="corte-duplo bg-grafite p-6 text-creme sm:p-8">
          <Rotulo className="text-lima">ESCOLHA UM VALOR</Rotulo>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {VALORES.map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={valor === v && !outro}
                onClick={() => {
                  setValor(v)
                  setOutro('')
                }}
                className={botaoValor(valor === v && !outro)}
              >
                R$ {v}
              </button>
            ))}
          </div>
          <label htmlFor="outro-valor" className="mt-5 block font-mono text-[11px] font-extrabold tracking-[1.5px]">
            OUTRO VALOR
          </label>
          <div className="mt-1.5 flex items-center border-2 border-creme/40 focus-within:border-lima">
            <span className="pl-3.5 text-[15px] font-black text-cinza">R$</span>
            <input
              id="outro-valor"
              inputMode="decimal"
              placeholder="0,00"
              value={outro}
              onChange={(e) => {
                const texto = e.target.value.replace(/[^\d,]/g, '').slice(0, 8)
                setOutro(texto)
                const numero = Number(texto.replace(',', '.'))
                setValor(numero > 0 ? Math.round(numero * 100) / 100 : null)
              }}
              className="h-12 min-w-0 flex-1 bg-transparent px-2 text-[15px] font-black text-creme placeholder:text-cinza/60 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setValor(null)
              setOutro('')
            }}
            aria-pressed={valor === null && !outro}
            className={`mt-3 cursor-pointer text-sm font-bold ${valor === null && !outro ? 'text-lima' : 'text-cinza hover:text-creme'}`}
          >
            {valor === null && !outro ? '✓ ' : ''}Prefiro digitar o valor no app do banco
          </button>

          <div className="mt-7 border-t-2 border-lima pt-5">
            <Rotulo className="text-lima">PARA ONDE VAI O APOIO</Rotulo>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-cinza">
              <li>
                <b className="text-creme">Domínio</b> brasumula.com.br, renovado todo ano
              </li>
              <li>
                <b className="text-creme">Dados</b> dos jogos, para o site seguir atualizado
              </li>
              <li>
                <b className="text-creme">Tempo</b> para criar coisas novas, como o bolão nas salas
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center gap-5 border-2 border-texto bg-superficie p-6 text-center sm:p-8">
          <QrCode texto={codigo} rotulo={`QR Code do Pix${valor ? ` de R$ ${valor.toFixed(2).replace('.', ',')}` : ''} para a BraSúmula`} />
          <div>
            <div className="text-[28px] leading-none font-black tracking-[-1px]">
              {valor ? `R$ ${valor.toFixed(2).replace('.', ',')}` : 'Valor livre'}
            </div>
            <div className="mt-1.5 text-[13px] text-texto-2">
              O Pix vai para <b className="text-texto">{dados.nome}</b>
            </div>
          </div>
          <BotaoPrincipal onClick={copiar} className="w-full">
            {copiado ? 'Código copiado ✓' : 'Copiar código Pix'}
          </BotaoPrincipal>
          <span role="status" className="sr-only">
            {copiado ? 'Código Pix copiado' : ''}
          </span>
          <ol className="flex w-full flex-col gap-2 text-left text-sm text-texto-2">
            {['Abra o app do seu banco e vá em Pix.', 'Escolha "Ler QR Code" ou "Pix Copia e Cola".', 'Confira o nome e o valor e confirme.'].map(
              (passo, i) => (
                <li key={passo} className="flex items-start gap-2.5">
                  <span aria-hidden className="grid size-[22px] flex-none place-items-center bg-lima font-mono text-[11px] font-extrabold text-grafite">
                    {i + 1}
                  </span>
                  {passo}
                </li>
              ),
            )}
          </ol>
          <details className="w-full text-left text-sm">
            <summary className="cursor-pointer font-bold text-texto-2">Ver o código Pix</summary>
            <textarea
              readOnly
              value={codigo}
              aria-label="Código Pix copia e cola"
              onFocus={(e) => e.target.select()}
              rows={4}
              className="mt-2 w-full resize-none border-2 border-texto bg-fundo p-2 font-mono text-xs break-all"
            />
          </details>
        </div>
      </div>

      <p className="mt-6 max-w-[720px] text-xs leading-relaxed text-texto-2">
        O pagamento acontece só no app do seu banco: a BraSúmula não recebe nem guarda nenhum dado de quem apoia. Apoiar é
        opcional e não muda nada no site. Veja a{' '}
        <Link to="/privacidade" className="font-bold text-destaque hover:underline">
          Política de Privacidade
        </Link>
        .
      </p>
    </Pagina>
  )
}
