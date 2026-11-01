import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Pagina } from '../componentes/Pagina'
import { Rotulo, TituloPagina } from '../componentes/TituloPagina'
import { AUTORIA } from '../config'

/** Data desta versão da política. Mudou o texto, muda a data. */
const ATUALIZADA_EM = '2 de novembro de 2026'
const EMAIL = AUTORIA.links.find((l) => l.url.startsWith('mailto:'))?.url.replace('mailto:', '') ?? ''

/** /privacidade: o que a BraSúmula guarda, por quê, com quem, por quanto tempo e os direitos de cada pessoa (LGPD). */
export function PaginaPrivacidade() {
  return (
    <Pagina className="pt-9 pb-16">
      <TituloPagina>Privacidade</TituloPagina>
      <p className="mt-[18px] max-w-[720px] text-[15px] leading-[1.55] text-pretty text-texto-2">
        Como a BraSúmula trata os seus dados, em linguagem simples. Atualizada em {ATUALIZADA_EM}.
      </p>

      <div className="mt-8 grid max-w-[920px] gap-4 md:grid-cols-3">
        <Resumo titulo="Sem conta">Nada que identifique você fica nos nossos servidores. As suas escolhas ficam só no seu navegador.</Resumo>
        <Resumo titulo="Com conta">Guardamos só o necessário: nome, e-mail, time do coração e os palpites das salas.</Resumo>
        <Resumo titulo="Sempre">Não vendemos dados, não mostramos anúncios e não usamos cookies de rastreamento. Você pode excluir tudo quando quiser.</Resumo>
      </div>

      <div className="mt-10 max-w-[720px] text-[15px] leading-[1.65]">
        <Secao titulo="Quem é responsável">
          <p>
            A BraSúmula é um projeto pessoal de estudo e portfólio de {AUTORIA.nome}, que é a responsável (controladora)
            pelos dados tratados aqui, nos termos da Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018). Contato:{' '}
            <Email />.
          </p>
        </Secao>

        <Secao titulo="O que fica guardado">
          <h3 className="mt-4 font-black">Se você só usa o site, sem conta</h3>
          <p>
            Nada que identifique você fica nos nossos servidores. Algumas escolhas ficam guardadas <b>só no seu navegador</b>{' '}
            (o chamado armazenamento local), para o site lembrar delas na próxima visita: o tema claro ou escuro, o time do
            coração e os palpites do Simulador. Você apaga tudo limpando os dados do site no navegador.
          </p>
          <p className="mt-3">
            Para saber quantas pessoas usam o site, contamos as visitas com o <b>Cloudflare Web Analytics</b>, que{' '}
            <b>não usa cookies</b>, não guarda o seu endereço IP e não identifica você nem acompanha você em outros sites.
            Ele registra só números gerais: quais páginas foram abertas, quanto tempo levaram para carregar, de qual site a
            pessoa veio, o país e o tipo de aparelho e de navegador.
          </p>
          <h3 className="mt-5 font-black">Se você cria uma conta</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
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
          <p className="mt-3">
            Não pedimos CPF, telefone, endereço, data de nascimento ou foto, e não guardamos o seu histórico de navegação.
          </p>
        </Secao>

        <Secao titulo="Para que usamos">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Para você entrar na sua conta e só você mexer nos seus palpites (o e-mail serve para confirmar que é seu e para recuperar a senha).</li>
            <li>Para as salas funcionarem: os seus amigos veem o seu nome e os seus palpites.</li>
            <li>Para lembrar o seu time do coração em qualquer aparelho.</li>
            <li>Para a segurança do site, como bloquear tentativas repetidas de adivinhar senhas (feito pelo Firebase).</li>
            <li>Para entender, em números gerais e sem identificar ninguém, quais páginas são mais usadas e melhorar o site.</li>
          </ul>
          <p className="mt-3">
            Esses usos se baseiam na execução do serviço que você pediu ao criar a conta (art. 7º, V, da LGPD) e, no caso
            da segurança e da contagem anônima de visitas, no legítimo interesse de proteger as contas e melhorar o site (art. 7º, IX).
          </p>
        </Secao>

        <Secao titulo="Quem mais vê os seus dados">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <b>Os participantes das suas salas e quem tiver o link delas</b> veem o nome com que você aparece e os seus
              palpites. O seu e-mail nunca aparece nas salas.
            </li>
            <li>
              <b>Google (Firebase)</b>, que cuida do login, e <b>Cloudflare</b>, que hospeda o site e o banco de dados e conta as
              visitas.
              Eles tratam os dados só para prestar esses serviços. Os servidores deles podem ficar fora do Brasil; essa
              transferência é feita com as garantias previstas na LGPD (art. 33).
            </li>
          </ul>
          <p className="mt-3">
            Como em qualquer site, os servidores recebem o endereço IP do seu navegador para entregar as páginas. As fontes
            vêm do Google Fonts e os escudos dos times, do football-data.org, que também recebem esse endereço ao entregar
            os arquivos. A BraSúmula não guarda o seu IP.
          </p>
          <p className="mt-3">Não vendemos, alugamos nem compartilhamos os seus dados com mais ninguém, e não há anúncios no site.</p>
        </Secao>

        <Secao titulo="Por quanto tempo">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Enquanto a sua conta existir.</li>
            <li>Salas sem nenhuma mudança por 60 dias são apagadas automaticamente, com os palpites.</li>
            <li>
              Ao excluir a conta, ela é apagada do Firebase na hora, e você sai de todas as salas: o seu time do coração e
              os seus palpites são apagados do nosso banco.
            </li>
          </ul>
        </Secao>

        <Secao titulo="Os seus direitos">
          <p>Pela LGPD (art. 18), você pode, a qualquer momento e de graça:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <b>Ver e levar os seus dados:</b> em <Link to="/conta" className="font-bold text-destaque hover:underline">Minha conta</Link>,
              "Baixar meus dados" gera um arquivo com tudo o que guardamos sobre você.
            </li>
            <li>
              <b>Corrigir:</b> mude o seu nome em Minha conta.
            </li>
            <li>
              <b>Excluir:</b> "Excluir minha conta", em Minha conta, apaga tudo.
            </li>
            <li>
              <b>Tirar dúvidas, pedir informações ou reclamar:</b> escreva para <Email />. Você também pode procurar a
              Autoridade Nacional de Proteção de Dados (ANPD).
            </li>
          </ul>
        </Secao>

        <Secao titulo="Segurança">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Todo o site usa conexão segura (HTTPS).</li>
            <li>A senha fica só no Firebase, com criptografia; nós nunca temos acesso a ela.</li>
            <li>
              Cada pedido que mexe na sua conta ou nas suas salas é conferido pelo nosso servidor com a assinatura digital
              do Google: ninguém consegue palpitar no seu lugar.
            </li>
            <li>Guardamos o mínimo de dados possível.</li>
          </ul>
        </Secao>

        <Secao titulo="Crianças e adolescentes">
          <p>
            Todo o site pode ser usado sem conta. Se você tem menos de 18 anos, crie a conta com a ajuda e a autorização de
            um responsável.
          </p>
        </Secao>

        <Secao titulo="Mudanças nesta política">
          <p>
            Se esta política mudar, a nova versão aparece aqui, com a data atualizada no topo. Mudanças importantes também
            serão avisadas no site.
          </p>
        </Secao>
      </div>
    </Pagina>
  )
}

function Resumo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="border-2 border-texto bg-superficie p-5">
      <Rotulo className="text-destaque">{titulo.toUpperCase()}</Rotulo>
      <p className="mt-2 text-sm leading-relaxed">{children}</p>
    </div>
  )
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-9 first:mt-0">
      <h2 className="border-b-2 border-texto pb-2 text-2xl font-black tracking-[-0.5px]">{titulo}</h2>
      <div className="mt-3 text-texto">{children}</div>
    </section>
  )
}

function Email() {
  return (
    <a href={`mailto:${EMAIL}`} className="font-bold text-destaque hover:underline">
      {EMAIL}
    </a>
  )
}
