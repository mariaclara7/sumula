import type { LinhaClassificacao } from '../api/tipos'
import { MAIOR_PLACAR, type PalpitesUsuario } from './simulador'

/**
 * Palpites dentro do próprio link, sem servidor: `/simulador?p=1.<código>`.
 *
 * Formato do código (versão 1): os palpites completos, em ordem de id da partida.
 * - Começa com o id da primeira partida em base 36 e um "-".
 * - Cada palpite ocupa 2 caracteres, os gols do mandante e do visitante em base 36 (0–20 → "0"–"k").
 * - Quando o id não é o seguinte ao anterior, o palpite vem precedido de "~<salto em base 36>~".
 *
 * Como cada palpite fica preso ao id da partida, o link continua certo depois que jogos novos acontecem:
 * quem abre vê o resultado real nesses jogos e os palpites só nos que ainda faltam.
 * Com os ~120 jogos de um returno inteiro, o código fica em torno de 250 caracteres.
 */
const VERSAO = '1'

const gol = (valor: number) => valor.toString(36)

export function codificarPalpites(palpites: PalpitesUsuario): string | null {
  const completos = Object.entries(palpites)
    .filter(([, p]) => p.mandante != null && p.visitante != null)
    .map(([id, p]) => ({ id: Number(id), mandante: p.mandante!, visitante: p.visitante! }))
    .sort((a, b) => a.id - b.id)

  if (completos.length === 0) return null

  let codigo = `${completos[0].id.toString(36)}-`
  let anterior = completos[0].id - 1
  for (const p of completos) {
    const salto = p.id - anterior
    if (salto !== 1) codigo += `~${salto.toString(36)}~`
    codigo += gol(p.mandante) + gol(p.visitante)
    anterior = p.id
  }

  return `${VERSAO}.${codigo}`
}

/** Devolve null se o código estiver quebrado ou for de uma versão desconhecida. */
export function decodificarPalpites(texto: string | null): PalpitesUsuario | null {
  if (!texto) return null
  const [versao, codigo] = texto.split('.', 2)
  if (versao !== VERSAO || !codigo) return null

  const traco = codigo.indexOf('-')
  const primeiro = parseInt(codigo.slice(0, traco), 36)
  if (traco <= 0 || !Number.isSafeInteger(primeiro)) return null

  const palpites: PalpitesUsuario = {}
  let id = primeiro - 1
  let i = traco + 1

  while (i < codigo.length) {
    let salto = 1
    if (codigo[i] === '~') {
      const fim = codigo.indexOf('~', i + 1)
      if (fim < 0) return null
      salto = parseInt(codigo.slice(i + 1, fim), 36)
      if (!Number.isSafeInteger(salto) || salto < 1) return null
      i = fim + 1
    }

    const mandante = parseInt(codigo[i] ?? '', 36)
    const visitante = parseInt(codigo[i + 1] ?? '', 36)
    if (!validoGol(mandante) || !validoGol(visitante)) return null

    id += salto
    palpites[id] = { mandante, visitante }
    i += 2
  }

  return Object.keys(palpites).length > 0 ? palpites : null
}

function validoGol(valor: number) {
  return Number.isInteger(valor) && valor >= 0 && valor <= MAIOR_PLACAR
}

/** Texto que acompanha o link: quem é campeão e quem cai na simulação. */
export function resumoDaSimulacao(tabela: LinhaClassificacao[], rebaixados: number) {
  const campeao = tabela[0]?.time.nomeCurto
  const caem = tabela
    .slice(-rebaixados)
    .map((l) => l.time.nomeCurto)
  if (!campeao) return 'Minha simulação do Brasileirão na Súmula'
  const lista = caem.length > 1 ? `${caem.slice(0, -1).join(', ')} e ${caem.at(-1)}` : caem.join('')
  // Sem artigo ("o"/"a") antes do nome: nem todo clube usa o mesmo.
  return `Minha simulação do Brasileirão: campeão ${campeao}${lista ? `; caem ${lista}` : ''}. Faça a sua:`
}
