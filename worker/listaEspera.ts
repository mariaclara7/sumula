/**
 * /api/lista-espera: guarda o e-mail de quem quer ser avisado quando o BraSúmula Pro abrir. Não precisa de conta.
 *
 *   POST /api/lista-espera   { email, origem?, site? }   "site" é uma armadilha para robôs: gente não preenche
 *
 * A resposta é a mesma se o e-mail já estava na lista (não dá para descobrir quem está nela).
 * Para ver a lista: no painel da Cloudflare, D1 > sumula-salas > Console: SELECT * FROM lista_espera
 */
import { ErroHttp, json, lerCorpo, respostaDeErro } from './salas'

const MAIOR_EMAIL = 254
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const ORIGENS = new Set(['cartola'])
/** Teto da lista, para um robô não encher o banco. */
const MAXIMO_NA_LISTA = 50_000

export async function tratarListaEspera(request: Request, db: D1Database): Promise<Response> {
  try {
    if (request.method !== 'POST') throw new ErroHttp(405, 'Método não permitido.')
    const corpo = await lerCorpo(request)
    const email = typeof corpo.email === 'string' ? corpo.email.trim().toLowerCase() : ''
    if (!email || email.length > MAIOR_EMAIL || !FORMATO_EMAIL.test(email)) throw new ErroHttp(400, 'Confira o e-mail.')
    // Robô que preencheu o campo escondido: finge que deu certo e não guarda nada.
    if (typeof corpo.site === 'string' && corpo.site !== '') return json({ ok: true }, 201)
    const origem = typeof corpo.origem === 'string' && ORIGENS.has(corpo.origem) ? corpo.origem : 'site'

    const total = await db.prepare('SELECT COUNT(*) AS n FROM lista_espera').first<{ n: number }>()
    if ((total?.n ?? 0) >= MAXIMO_NA_LISTA) throw new ErroHttp(503, 'A lista está cheia por enquanto. Tente de novo mais tarde.')

    await db
      .prepare('INSERT OR IGNORE INTO lista_espera (email, origem, criado_em) VALUES (?, ?, ?)')
      .bind(email, origem, new Date().toISOString())
      .run()
    return json({ ok: true }, 201)
  } catch (erro) {
    return respostaDeErro(erro)
  }
}
