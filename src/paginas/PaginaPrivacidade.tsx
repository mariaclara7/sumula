import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Pagina } from '../componentes/Pagina'
import { Rotulo, TituloPagina } from '../componentes/TituloPagina'
import { AUTORIA } from '../config'

/** Data desta versão da política. Mudou o texto, muda as duas datas. */
const ATUALIZADA_EM = '2 de novembro de 2026'
const ATUALIZADA_EM_CURTA = '02/11/2026'
const EMAIL = AUTORIA.links.find((l) => l.url.startsWith('mailto:'))?.url.replace('mailto:', '') ?? ''

const SECOES = [
  ['quem', 'Quem é responsável'],
  ['guardado', 'O que fica guardado'],
  ['uso', 'Para que usamos'],
  ['quem-ve', 'Quem mais vê os seus dados'],
  ['tempo', 'Por quanto tempo'],
  ['direitos', 'Os seus direitos'],
  ['seguranca', 'Segurança'],
  ['criancas', 'Crianças e adolescentes'],
  ['mudancas', 'Mudanças nesta política'],
] as const

type IdSecao = (typeof SECOES)[number][0]

/** Distância do topo ao rolar até uma seção (o cabeçalho do site fica fixo em cima). */
const MARGEM_TOPO = 140

/** /privacidade: o que a BraSúmula guarda, por quê, com quem, por quanto tempo e os direitos de cada pessoa (LGPD). */
export function PaginaPrivacidade() {
  return (
    <Pagina className="pt-9 pb-16 md:pt-11">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <Rotulo>LGPD · LEI 13.709/2018</Rotulo>
          <TituloPagina className="mt-2.5">Privacidade</TituloPagina>
        </div>
        <span className="bg-grafite px-3 py-[7px] font-mono text-[13px] font-extrabold text-lima">ATUALIZADA EM {ATUALIZADA_EM_CURTA}</span>
      </div>
      <p className="mt-[18px] max-w-[640px] text-[15px] leading-normal text-pretty text-texto-2 md:text-lg">
        Como a BraSúmula trata os seus dados, em linguagem simples. Atualizada em {ATUALIZADA_EM}.
      </p>

      <div className="mt-8 grid gap-3.5 md:grid-cols-3">
        <Resumo numero="01" etiqueta={<Etiqueta cor="lima">SEM CONTA</Etiqueta>} sombra="var(--color-lima)">
          Nada que identifique você fica nos nossos servidores. As suas escolhas ficam só no seu navegador.
        </Resumo>
        <Resumo numero="02" etiqueta={<Etiqueta cor="azul">COM CONTA</Etiqueta>} sombra="var(--color-azul)">
          Guardamos só o necessário: nome, e-mail, time do coração e os palpites das salas.
        </Resumo>
        <div className="corte-canto relative overflow-hidden bg-grafite p-6 text-creme">
          <span aria-hidden className="absolute -top-[18px] -right-1.5 text-[96px] leading-none font-black text-lima opacity-10">
            03
          </span>
          <span className="inline-block border-[1.5px] border-lima px-2 py-[3px] font-mono text-[11px] font-extrabold tracking-[2px] text-lima">
            SEMPRE
          </span>
          <p className="mt-3.5 text-[17px] leading-[1.4] font-bold text-pretty">
            Não vendemos dados, não mostramos anúncios e não usamos cookies de rastreamento. Você pode excluir tudo quando quiser.
          </p>
        </div>
      </div>

      <div className="mt-14 grid items-start gap-12 lg:grid-cols-[minmax(0,760px)_260px] lg:justify-between">
        <div className="flex min-w-0 flex-col gap-14 text-base leading-[1.65]">
          <Secao id="quem" titulo="Quem é responsável">
            <p>
              A BraSúmula é um projeto pessoal de estudo e portfólio de {AUTORIA.nome}, que é a responsável (controladora)
              pelos dados tratados aqui, nos termos da Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018). Contato:{' '}
              <Email />.
            </p>
          </Secao>

          <Secao id="guardado" titulo="O que fica guardado">
            <div className="grid gap-3.5 md:grid-cols-2">
              <Bloco etiqueta={<Etiqueta cor="lima">SEM CONTA</Etiqueta>} onde="NO SEU NAVEGADOR">
                <b>Se você só usa o site, sem conta</b>
                <br />
                Nada que identifique você fica nos nossos servidores. Algumas escolhas ficam guardadas <b>só no seu navegador</b>{' '}
                (o chamado armazenamento local), para o site lembrar delas na próxima visita: o tema claro ou escuro, o time do
                coração e os palpites do Simulador. Você apaga tudo limpando os dados do site no navegador.
              </Bloco>
              <Bloco etiqueta={<Etiqueta cor="azul">COM CONTA</Etiqueta>} onde="FIREBASE E CLOUDFLARE">
                <b>Se você cria uma conta</b>
                <ul className="mt-2 flex flex-col gap-2">
                  <li>
                    <b>No Firebase Authentication (Google):</b> o seu nome, o seu e-mail, se o e-mail foi confirmado, a forma
                    de entrar (e-mail e senha ou conta Google) e as datas de criação e do último acesso. A <b>senha</b> fica só
                    lá, protegida por criptografia: a BraSúmula nunca vê nem guarda a sua senha.
                  </li>
                  <li>
                    <b>No nosso banco de dados (Cloudflare):</b> um código que identifica a sua conta, o seu time do coração e,
                    para cada sala em que você está, o nome com que aparece, a sua cor e os seus palpites.
                  </li>
                  <li>
                    <b>No seu navegador:</b> a sessão de login, para você não precisar entrar de novo a cada visita.
                  </li>
                </ul>
              </Bloco>
            </div>
            <p className="mt-4">
              Para saber quantas pessoas usam o site, contamos as visitas com o <b>Cloudflare Web Analytics</b>, que{' '}
              <b>não usa cookies</b>, não guarda o seu endereço IP e não identifica você nem acompanha você em outros sites.
              Ele registra só números gerais: quais páginas foram abertas, quanto tempo levaram para carregar, de qual site a
              pessoa veio, o país e o tipo de aparelho e de navegador.
            </p>
            <p className="mt-3">
              Se você pede para ser avisado do <b>BraSúmula Pro</b> (na página Cartola), guardamos só o e-mail que você
              digitou, a página de onde veio e a data, com ou sem conta. Esse e-mail serve só para esse aviso.
            </p>
            <p className="mt-3">
              Não pedimos CPF, telefone, endereço, data de nascimento ou foto, e não guardamos o seu histórico de navegação.
            </p>
          </Secao>

          <Secao id="uso" titulo="Para que usamos">
            <Linhas
              itens={[
                'Para você entrar na sua conta e só você mexer nos seus palpites (o e-mail serve para confirmar que é seu e para recuperar a senha).',
                'Para as salas funcionarem: os seus amigos veem o seu nome e os seus palpites.',
                'Para lembrar o seu time do coração em qualquer aparelho.',
                'Para a segurança do site, como bloquear tentativas repetidas de adivinhar senhas (feito pelo Firebase).',
                'Para entender, em números gerais e sem identificar ninguém, quais páginas são mais usadas e melhorar o site.',
                'Para avisar por e-mail, uma vez, quem pediu para saber quando o BraSúmula Pro abrir.',
              ]}
            />
            <p className="mt-4">
              Esses usos se baseiam na execução do serviço que você pediu ao criar a conta (art. 7º, V, da LGPD) e, no caso
              da segurança e da contagem anônima de visitas, no legítimo interesse de proteger as contas e melhorar o site (art. 7º, IX).
              O e-mail do aviso do Pro é guardado com o seu consentimento (art. 7º, I), que você pode retirar quando quiser.
            </p>
          </Secao>

          <Secao id="quem-ve" titulo="Quem mais vê os seus dados">
            <Linhas
              itens={[
                <>
                  <b>Os participantes das suas salas e quem tiver o link delas</b> veem o nome com que você aparece e os seus
                  palpites. O seu e-mail nunca aparece nas salas.
                </>,
                <>
                  <b>Google (Firebase)</b>, que cuida do login, e <b>Cloudflare</b>, que hospeda o site e o banco de dados e conta
                  as visitas. Eles tratam os dados só para prestar esses serviços. Os servidores deles podem ficar fora do Brasil;
                  essa transferência é feita com as garantias previstas na LGPD (art. 33).
                </>,
              ]}
            />
            <p className="mt-4">
              Como em qualquer site, os servidores recebem o endereço IP do seu navegador para entregar as páginas. As fontes
              vêm do Google Fonts e os escudos dos times, do football-data.org, que também recebem esse endereço ao entregar
              os arquivos. A BraSúmula não guarda o seu IP.
            </p>
            <p className="mt-3">Não vendemos, alugamos nem compartilhamos os seus dados com mais ninguém, e não há anúncios no site.</p>
          </Secao>

          <Secao id="tempo" titulo="Por quanto tempo">
            <Linhas
              itens={[
                'Enquanto a sua conta existir.',
                'Salas sem nenhuma mudança por 60 dias são apagadas automaticamente, com os palpites.',
                'Ao excluir a conta, ela é apagada do Firebase na hora, e você sai de todas as salas: o seu time do coração e os seus palpites são apagados do nosso banco.',
                <>
                  O e-mail do aviso do Pro fica guardado até o aviso ser enviado ou até você pedir para sair, escrevendo para{' '}
                  <Email />.
                </>,
              ]}
            />
          </Secao>

          <Secao id="direitos" titulo="Os seus direitos">
            <p>Pela LGPD (art. 18), você pode, a qualquer momento e de graça:</p>
            <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
              <Direito numero="01" titulo="Ver e levar os seus dados">
                Em{' '}
                <Link to="/conta" className="font-bold text-destaque hover:underline">
                  Minha conta
                </Link>
                , "Baixar meus dados" gera um arquivo com tudo o que guardamos sobre você.
              </Direito>
              <Direito numero="02" titulo="Corrigir">
                Mude o seu nome em Minha conta.
              </Direito>
              <Direito numero="03" titulo="Excluir">
                "Excluir minha conta", em Minha conta, apaga tudo.
              </Direito>
              <Direito numero="04" titulo="Tirar dúvidas, pedir informações ou reclamar">
                Escreva para <Email />.
              </Direito>
            </div>
            <p className="mt-3.5 text-sm text-texto-2">Você também pode procurar a Autoridade Nacional de Proteção de Dados (ANPD).</p>
          </Secao>

          <Secao id="seguranca" titulo="Segurança">
            <Linhas
              marca="check"
              itens={[
                'Todo o site usa conexão segura (HTTPS).',
                'A senha fica só no Firebase, com criptografia; nós nunca temos acesso a ela.',
                'Cada pedido que mexe na sua conta ou nas suas salas é conferido pelo nosso servidor com a assinatura digital do Google: ninguém consegue palpitar no seu lugar.',
                'Guardamos o mínimo de dados possível.',
              ]}
            />
          </Secao>

          <Secao id="criancas" titulo="Crianças e adolescentes">
            <p>
              Todo o site pode ser usado sem conta. Se você tem menos de 18 anos, crie a conta com a ajuda e a autorização de
              um responsável.
            </p>
          </Secao>

          <Secao id="mudancas" titulo="Mudanças nesta política">
            <p>
              Se esta política mudar, a nova versão aparece aqui, com a data atualizada no topo. Mudanças importantes também
              serão avisadas no site.
            </p>
          </Secao>

          <div className="corte-canto flex flex-wrap items-center justify-between gap-4 bg-grafite px-7 py-[26px] text-creme">
            <div>
              <Rotulo className="text-lima">DÚVIDAS?</Rotulo>
              <div className="mt-1.5 text-2xl leading-[1.2] font-black">Fale direto com a responsável</div>
            </div>
            <a
              href={`mailto:${EMAIL}`}
              className="border-2 border-lima bg-lima px-[18px] py-3 text-sm font-extrabold break-all text-grafite transition-colors hover:bg-transparent hover:text-lima"
            >
              {EMAIL}
            </a>
          </div>
        </div>

        <Indice />
      </div>
    </Pagina>
  )
}

/** "Nesta página": atalhos para as seções, com a seção atual marcada. Fica parado ao lado do texto em telas largas. */
function Indice() {
  const [atual, setAtual] = useState<IdSecao>(SECOES[0][0])

  useEffect(() => {
    const aoRolar = () => {
      let id: IdSecao = SECOES[0][0]
      for (const [secao] of SECOES) {
        const el = document.getElementById(secao)
        if (el && el.getBoundingClientRect().top < MARGEM_TOPO + 80) id = secao
      }
      setAtual(id)
    }
    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => window.removeEventListener('scroll', aoRolar)
  }, [])

  return (
    <aside className="order-first flex flex-col gap-3 lg:sticky lg:top-[130px] lg:order-none">
      <Rotulo>NESTA PÁGINA</Rotulo>
      <nav aria-label="Seções desta página" className="flex flex-col border-l-2 border-borda">
        {SECOES.map(([id, titulo], i) => {
          const ativo = id === atual
          return (
            <a
              key={id}
              href={`#${id}`}
              aria-current={ativo ? 'location' : undefined}
              onClick={(e) => {
                const el = document.getElementById(id)
                if (!el) return
                e.preventDefault()
                window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - MARGEM_TOPO, behavior: 'smooth' })
                history.replaceState(history.state, '', `#${id}`)
              }}
              className={`-ml-0.5 flex gap-2.5 border-l-2 px-3.5 py-2 text-sm transition-colors hover:text-texto ${
                ativo ? 'border-texto font-extrabold text-texto' : 'border-transparent font-semibold text-texto-2'
              }`}
            >
              <span className={`pt-0.5 font-mono text-[11px] font-bold ${ativo ? 'text-destaque' : 'text-texto-2 opacity-70'}`}>
                {String(i + 1).padStart(2, '0')}
              </span>
              {titulo}
            </a>
          )
        })}
      </nav>
      <div className="mt-2 flex flex-col gap-1.5 border-2 border-texto bg-superficie px-4 py-3.5">
        <span className="text-[15px] font-black">Tem conta?</span>
        <span className="text-[13px] leading-normal text-texto-2">Baixe ou exclua seus dados em Minha conta.</span>
        <Link to="/conta" className="text-[13px] font-bold text-destaque hover:underline">
          Ir para Minha conta →
        </Link>
      </div>
    </aside>
  )
}

function Etiqueta({ cor, children }: { cor: 'lima' | 'azul'; children: ReactNode }) {
  return (
    <span
      className={`inline-block px-2 py-1 font-mono text-[11px] font-extrabold tracking-[2px] ${
        cor === 'lima' ? 'bg-lima text-grafite' : 'bg-azul text-white'
      }`}
    >
      {children}
    </span>
  )
}

function Resumo({ numero, etiqueta, sombra, children }: { numero: string; etiqueta: ReactNode; sombra: string; children: ReactNode }) {
  return (
    <div
      className="relative overflow-hidden border-2 border-texto bg-superficie px-[22px] pt-[22px] pb-6 transition-[transform,box-shadow] duration-200 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_var(--sombra)]"
      style={{ '--sombra': sombra } as React.CSSProperties}
    >
      <span aria-hidden className="absolute -top-[18px] -right-1.5 text-[96px] leading-none font-black opacity-[.06]">
        {numero}
      </span>
      {etiqueta}
      <p className="mt-3.5 text-[17px] leading-[1.4] font-bold text-pretty">{children}</p>
    </div>
  )
}

function Secao({ id, titulo, children }: { id: IdSecao; titulo: string; children: ReactNode }) {
  const numero = String(SECOES.findIndex(([s]) => s === id) + 1).padStart(2, '0')
  return (
    <section id={id} className="scroll-mt-[140px]">
      <div className="flex items-baseline gap-3.5 border-b-2 border-texto pb-3">
        <span className="font-mono text-[13px] font-extrabold text-destaque">{numero}</span>
        <h2 className="text-[26px] leading-[1.1] font-black tracking-[-1px] md:text-[30px]">{titulo}</h2>
      </div>
      <div className="mt-[18px] text-pretty">{children}</div>
    </section>
  )
}

function Bloco({ etiqueta, onde, children }: { etiqueta: ReactNode; onde: string; children: ReactNode }) {
  return (
    <div className="border-2 border-texto bg-superficie px-5 py-[18px]">
      <div className="flex flex-wrap items-center gap-2.5">
        {etiqueta}
        <span className="font-mono text-[11px] font-extrabold text-texto-2">{onde}</span>
      </div>
      <div className="mt-3 text-[15px] leading-[1.6]">{children}</div>
    </div>
  )
}

/** Lista em linhas separadas por um fio, com um quadradinho lima (ou um ✓) na frente de cada item. */
function Linhas({ itens, marca = 'ponto' }: { itens: ReactNode[]; marca?: 'ponto' | 'check' }) {
  return (
    <ul className="flex flex-col">
      {itens.map((item, i) => (
        <li key={i} className="flex gap-3.5 border-b border-borda py-3.5 first:pt-0">
          {marca === 'check' ? (
            <span aria-hidden className="mt-0.5 grid size-[22px] flex-none place-items-center border-2 border-grafite bg-lima text-xs font-black text-grafite">
              ✓
            </span>
          ) : (
            <span aria-hidden className="mt-[9px] size-2 flex-none bg-lima outline-2 outline-texto" />
          )}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Direito({ numero, titulo, children }: { numero: string; titulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-2 border-texto bg-superficie px-[18px] py-4 transition-[transform,box-shadow] duration-200 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[5px_5px_0_var(--texto)]">
      <div className="flex items-center gap-2.5">
        <span className="grid size-7 flex-none place-items-center bg-grafite font-mono text-xs font-extrabold text-lima">{numero}</span>
        <span className="text-[17px] leading-[1.2] font-black">{titulo}</span>
      </div>
      <span className="text-[15px] leading-[1.55] text-texto-2">{children}</span>
    </div>
  )
}

function Email() {
  return (
    <a href={`mailto:${EMAIL}`} className="font-bold whitespace-nowrap text-destaque hover:underline">
      {EMAIL}
    </a>
  )
}
