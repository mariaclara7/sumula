import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Confete } from '../componentes/Confete'
import { Pagina } from '../componentes/Pagina'
import { QrCode } from '../componentes/QrCode'
import { Rotulo, TituloPagina } from '../componentes/TituloPagina'
import { AUTORIA, PIX } from '../config'
import { codigoPix } from '../util/pix'

const VALORES = [5, 10, 20, 50]

const USOS = [
  { titulo: 'Domínio', texto: 'brasumula.com.br, renovado todo ano' },
  { titulo: 'Dados', texto: 'dos jogos, para o site seguir atualizado' },
  { titulo: 'Tempo', texto: 'para manter o site e criar novidades' },
]

const PASSOS = ['Abra o app do seu banco e vá em Pix.', 'Escolha "Ler QR Code" ou "Pix Copia e Cola".', 'Confira o nome e o valor e confirme.']

const reais = (valor: number) => `R$ ${valor.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`

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

/** O número na tela vai "correndo" até o valor novo (sem animação para quem pediu menos movimento). */
function useValorAnimado(alvo: number | null) {
  const [mostrado, setMostrado] = useState(alvo)
  const atual = useRef(alvo)

  useEffect(() => {
    const parar = () => {
      atual.current = alvo
      setMostrado(alvo)
    }
    if (alvo === null || atual.current === null || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      parar()
      return
    }
    const de = atual.current
    const inicio = performance.now()
    let quadro = 0
    const passo = (agora: number) => {
      const k = Math.min(1, (agora - inicio) / 450)
      const valor = de + (alvo - de) * (1 - (1 - k) ** 3)
      atual.current = valor
      setMostrado(valor)
      if (k < 1) quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [alvo])

  return mostrado
}

function Apoio({ dados }: { dados: NonNullable<typeof PIX> }) {
  // null: sem valor (a pessoa digita no app do banco).
  const [valor, setValor] = useState<number | null>(10)
  const [outro, setOutro] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [disparo, setDisparo] = useState(0)
  const [verCodigo, setVerCodigo] = useState(false)
  const [mostrarQr, setMostrarQr] = useState(false)
  const codigo = codigoPix(dados, valor ?? undefined)
  const mostrado = useValorAnimado(valor)
  const textoValor = mostrado === null ? 'Valor livre' : reais(mostrado)
  const livre = valor === null && !outro
  const fecharAgradecimento = useCallback(() => setDisparo(0), [])

  function escolher(novo: number | null, textoOutro = '') {
    setValor(novo)
    setOutro(textoOutro)
    setCopiado(false)
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
      setDisparo((d) => d + 1)
    } catch {
      // Sem acesso à área de transferência: abre o código para a pessoa copiar na mão.
      setVerCodigo(true)
    }
  }

  return (
    <Pagina className="pt-9 pb-16">
      <TituloPagina>Apoie</TituloPagina>
      <p className="mt-[18px] max-w-[720px] text-[15px] leading-[1.55] text-pretty text-texto-2 md:text-[17px]">
        A BraSúmula é um projeto independente, sem anúncios. Se o site te ajuda a acompanhar o Brasileirão, você pode apoiar
        com um Pix de qualquer valor.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* 01: valor */}
        <div className="corte-duplo flex flex-col gap-[22px] bg-grafite p-[22px] text-creme md:p-8">
          <Cabecalho rotulo="ESCOLHA UM VALOR" passo="01 / 02" claro />
          <div className="grid grid-cols-4 gap-2.5">
            {VALORES.map((v) => {
              const ativo = valor === v && !outro
              return (
                <button
                  key={v}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => escolher(v)}
                  className={`h-[52px] cursor-pointer border-2 text-base font-black tracking-[-.5px] transition-[background-color,color,transform,box-shadow,border-color] duration-150 hover:border-lima active:scale-95 md:h-[60px] md:text-[19px] ${
                    ativo
                      ? '-translate-y-[3px] border-lima bg-lima text-grafite shadow-[0_4px_0_#6f8a1c]'
                      : 'border-linha-escura bg-transparent text-creme'
                  }`}
                >
                  R$ {v}
                </button>
              )
            })}
          </div>
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[11px] font-extrabold tracking-[2px] text-cinza">OUTRO VALOR</span>
            <span
              className={`flex h-[60px] items-center gap-2.5 border-2 px-4 transition-colors focus-within:border-lima ${
                outro ? 'border-lima bg-[#1c1c1a]' : 'border-linha-escura'
              }`}
            >
              <span className={`text-lg font-black ${outro ? 'text-lima' : 'text-texto-2'}`}>R$</span>
              <input
                inputMode="decimal"
                placeholder="0,00"
                value={outro}
                onChange={(e) => {
                  const texto = e.target.value.replace(/[^\d,]/g, '').slice(0, 8)
                  const numero = Number(texto.replace(',', '.'))
                  escolher(numero > 0 ? Math.round(numero * 100) / 100 : null, texto)
                }}
                className="min-w-0 flex-1 border-0 bg-transparent text-[22px] font-black text-creme outline-none placeholder:text-[#6b6960]"
              />
            </span>
          </label>
          <button
            type="button"
            aria-pressed={livre}
            onClick={() => escolher(null)}
            className={`cursor-pointer self-start text-sm font-bold underline underline-offset-4 transition-colors hover:text-lima ${
              livre ? 'text-lima decoration-lima' : 'text-prata decoration-[#555]'
            }`}
          >
            Prefiro digitar o valor no app do banco
          </button>
          <div className="mt-auto flex flex-col gap-1.5 border-t-2 border-[#2b2b2b] pt-5">
            <span className="font-mono text-[11px] font-extrabold tracking-[2px] text-cinza">SEU APOIO</span>
            <div className="text-[52px] leading-none font-black tracking-[-3px] text-lima tabular-nums md:text-[72px]">{textoValor}</div>
            <span className="text-[13px] text-cinza">
              {valor === null ? 'Você escolhe o valor na hora de pagar.' : 'Pagamento único, sem cadastro.'}
            </span>
          </div>
        </div>

        {/* 02: pagar */}
        <div className="relative flex flex-col gap-[18px] overflow-hidden border-2 border-texto bg-superficie p-[22px] md:p-8">
          <Cabecalho rotulo="PAGUE COM PIX" passo="02 / 02" />
          <div className="flex items-center gap-5">
            <div className={`flex-none border-2 border-grafite bg-white p-1 ${mostrarQr ? 'block' : 'hidden md:block'}`}>
              <QrCode
                texto={codigo}
                rotulo={`QR Code do Pix${valor ? ` de ${reais(valor)}` : ''} para a BraSúmula`}
                tamanho={168}
                className="max-md:size-[132px]"
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="font-mono text-[11px] font-extrabold tracking-[1.5px] text-texto-2">VALOR DO PIX</span>
              <span className="text-[30px] leading-none font-black tracking-[-1.5px] tabular-nums md:text-4xl">{textoValor}</span>
              <span className="text-[13px] leading-[1.4] text-texto-2">
                O Pix vai para <b className="text-texto">{AUTORIA.nome}</b>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={copiar}
            className={`flex h-14 cursor-pointer items-center justify-center gap-2.5 border-2 border-grafite text-base font-black shadow-[4px_4px_0_var(--texto)] transition-[background-color,color,transform,box-shadow] duration-75 active:translate-x-1 active:translate-y-1 active:shadow-none ${
              copiado ? 'bg-grafite text-lima' : 'bg-lima text-grafite'
            }`}
          >
            {copiado ? 'Copiado ✓' : 'Copiar código Pix'}
          </button>
          <button
            type="button"
            onClick={() => setMostrarQr((m) => !m)}
            aria-expanded={mostrarQr}
            className="cursor-pointer self-center text-sm font-bold underline underline-offset-4 md:hidden"
          >
            {mostrarQr ? 'Esconder QR Code' : 'Mostrar QR Code (para pagar de outro aparelho)'}
          </button>
          <ol className="grid grid-cols-3 gap-2">
            {PASSOS.map((passo, i) => (
              <li key={passo} className="flex flex-col gap-1.5 bg-fundo p-2.5">
                <span aria-hidden className="grid size-[22px] place-items-center bg-grafite font-mono text-[11px] font-extrabold text-lima">
                  {i + 1}
                </span>
                <span className="text-[13px] leading-[1.35] text-texto-2">{passo}</span>
              </li>
            ))}
          </ol>
          <div className="border-t border-borda pt-3">
            <button
              type="button"
              onClick={() => setVerCodigo((v) => !v)}
              aria-expanded={verCodigo}
              className="flex cursor-pointer items-center gap-2 text-sm font-bold"
            >
              <span aria-hidden className={`inline-block text-[10px] transition-transform ${verCodigo ? 'rotate-90' : ''}`}>
                ▶
              </span>
              Ver o código Pix
            </button>
            {verCodigo && (
              <div className="mt-2.5 bg-fundo px-3 py-2.5 font-mono text-[11px] leading-normal break-all text-texto-2 select-all">
                {codigo}
              </div>
            )}
          </div>

          {copiado && disparo > 0 && <Agradecimento disparo={disparo} aoVoltar={fecharAgradecimento} />}
        </div>
      </div>

      <section className="mt-12">
        <h2 className="border-b-2 border-texto pb-3 text-[26px] leading-[1.1] font-black tracking-[-1px] md:text-[28px]">Para onde vai o apoio</h2>
        <div className="mt-[18px] grid gap-3.5 md:grid-cols-3">
          {USOS.map((uso, i) => (
            <div
              key={uso.titulo}
              className="relative overflow-hidden border-2 border-texto bg-superficie px-[22px] py-5 transition-[transform,box-shadow] duration-200 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_var(--color-lima)]"
            >
              <span aria-hidden className="absolute -top-4 -right-1.5 text-[88px] leading-none font-black opacity-[.06]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="text-[22px] font-black tracking-[-.5px]">{uso.titulo}</div>
              <div className="mt-1.5 text-[15px] leading-normal text-texto-2">{uso.texto}</div>
            </div>
          ))}
        </div>
      </section>

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

function Cabecalho({ rotulo, passo, claro = false }: { rotulo: string; passo: string; claro?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <Rotulo className={`tracking-[2.5px] ${claro ? 'text-lima' : 'text-destaque'}`}>{rotulo}</Rotulo>
      <span className={`font-mono text-[11px] font-bold ${claro ? 'text-cinza' : 'text-texto-2'}`}>{passo}</span>
    </div>
  )
}

/** Cobre o card do Pix depois de copiar: confirma, explica o próximo passo e agradece. */
function Agradecimento({ disparo, aoVoltar }: { disparo: number; aoVoltar: () => void }) {
  const voltar = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    voltar.current?.focus()
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && aoVoltar()
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [aoVoltar])

  return (
    <div
      role="status"
      className="absolute inset-0 z-[2] flex animate-entrada flex-col items-center justify-center gap-3.5 bg-grafite/95 p-7 text-center text-creme"
    >
      <Confete disparo={disparo} />
      <span aria-hidden className="corte-canto grid size-[60px] place-items-center bg-lima text-[28px] font-black text-grafite">
        ✓
      </span>
      <span className="text-[32px] leading-[1.05] font-black tracking-[-1px]">Código copiado!</span>
      <span className="max-w-[320px] text-[15px] leading-normal text-prata">
        Agora é só colar no app do banco, em "Pix Copia e Cola". Obrigada pelo apoio.
      </span>
      <button
        ref={voltar}
        type="button"
        onClick={aoVoltar}
        className="mt-1.5 h-[46px] cursor-pointer border-2 border-lima bg-transparent px-5 text-sm font-extrabold text-lima transition-colors hover:bg-lima hover:text-grafite"
      >
        Voltar
      </button>
    </div>
  )
}
