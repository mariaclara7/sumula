/**
 * API das salas do simulador, em /api/salas. Guarda só nomes e palpites; as tabelas de cada pessoa são
 * calculadas no navegador, com o mesmo código do simulador.
 *
 * Sem login: quem cria ou entra numa sala recebe uma chave secreta (guardada só no navegador dela, o banco
 * fica com o SHA-256). A chave é o que deixa mudar os próprios palpites, sair da sala e, para quem é dono,
 * remover alguém.
 *
 *   POST   /api/salas                                  cria a sala e o dono         { nome, seuNome, competicao, temporada }
 *   GET    /api/salas/:codigo                          a sala com todos os palpites (ETag para 304)
 *   POST   /api/salas/:codigo/participantes            entra na sala (até 5)        { nome }
 *   GET    /api/salas/:codigo/eu                       quem é o dono da chave       (link pessoal em outro aparelho)
 *   PUT    /api/salas/:codigo/participantes/:id/palpites  grava os palpites        { palpites }
 *   DELETE /api/salas/:codigo/participantes/:id        sai da sala ou remove alguém (só o dono remove outros)
 */

export const MAXIMO_PARTICIPANTES = 5
export const TAMANHO_NOME_PESSOA = 20
export const TAMANHO_NOME_SALA = 30
/** Salas sem nenhuma mudança por este tempo são apagadas pela tarefa diária. */
export const DIAS_PARA_EXPIRAR = 60

// Sem 0/O e 1/I, que se confundem quando alguém dita o código.
const ALFABETO = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const TAMANHO_CODIGO = 6
const MAIOR_CORPO = 4096
const MAIOR_PALPITES = 2000
// Mesmo formato de codificarPalpites (src/util/compartilhar.ts): "1.<id>-<pares de gols>", ou vazio.
const FORMATO_PALPITES = /^(1\.[0-9a-z]+-[0-9a-z~]*)?$/

type Sala = { codigo: string; nome: string; competicao: string; temporada: number; criada_em: string; atualizada_em: string }
type Participante = {
  id: number
  nome: string
  cor: number
  dono: number
  palpites: string
  atualizado_em: string
}

class ErroHttp extends Error {
  readonly status: number
  constructor(status: number, mensagem: string) {
    super(mensagem)
    this.status = status
  }
}

export async function tratarSalas(request: Request, db: D1Database): Promise<Response> {
  try {
    return await rotear(request, db)
  } catch (erro) {
    if (erro instanceof ErroHttp) return json({ erro: erro.message }, erro.status)
    console.error(erro)
    return json({ erro: 'Algo deu errado. Tente de novo em instantes.' }, 500)
  }
}

async function rotear(request: Request, db: D1Database): Promise<Response> {
  const caminho = new URL(request.url).pathname.replace(/\/+$/, '')
  const partes = caminho.split('/').slice(3) // ['', 'api', 'salas', ...]
  const metodo = request.method

  if (partes.length === 0) {
    if (metodo === 'POST') return criarSala(request, db)
    throw new ErroHttp(405, 'Método não permitido.')
  }

  const codigo = normalizarCodigo(partes[0])
  if (!codigo) throw new ErroHttp(404, 'Sala não encontrada.')

  if (partes.length === 1 && metodo === 'GET') return verSala(request, db, codigo)
  if (partes.length === 2 && partes[1] === 'participantes' && metodo === 'POST') return entrar(request, db, codigo)
  if (partes.length === 2 && partes[1] === 'eu' && metodo === 'GET') return quemSou(request, db, codigo)

  if (partes[1] === 'participantes' && /^\d{1,12}$/.test(partes[2] ?? '')) {
    const id = Number(partes[2])
    if (partes.length === 4 && partes[3] === 'palpites' && metodo === 'PUT') return gravarPalpites(request, db, codigo, id)
    if (partes.length === 3 && metodo === 'DELETE') return remover(request, db, codigo, id)
  }

  throw new ErroHttp(404, 'Endereço não encontrado.')
}

async function criarSala(request: Request, db: D1Database) {
  const corpo = await lerCorpo(request)
  const nome = lerNome(corpo.nome, TAMANHO_NOME_SALA, 'O nome da sala')
  const seuNome = lerNome(corpo.seuNome, TAMANHO_NOME_PESSOA, 'Seu nome')
  const competicao = typeof corpo.competicao === 'string' && /^[A-Z0-9]{2,6}$/.test(corpo.competicao) ? corpo.competicao : null
  const temporada = Number.isInteger(corpo.temporada) && (corpo.temporada as number) >= 2000 && (corpo.temporada as number) <= 2100
  if (!competicao || !temporada) throw new ErroHttp(400, 'Campeonato inválido.')

  const agora = new Date().toISOString()
  const chave = gerarChave()
  const chaveHash = await hash(chave)

  // Um código repetido é raríssimo (1 em ~1 bilhão), mas se acontecer tenta outro.
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const codigo = gerarCodigo()
    try {
      const [, inserido] = await db.batch([
        db
          .prepare('INSERT INTO salas (codigo, nome, competicao, temporada, criada_em, atualizada_em) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(codigo, nome, competicao, corpo.temporada, agora, agora),
        db
          .prepare(
            'INSERT INTO participantes (sala, nome, cor, dono, chave_hash, entrou_em, atualizado_em) VALUES (?, ?, 0, 1, ?, ?, ?) RETURNING id',
          )
          .bind(codigo, seuNome, chaveHash, agora, agora),
      ])
      const id = (inserido.results[0] as { id: number }).id
      return json({ codigo, participante: { id, chave } }, 201)
    } catch (erro) {
      if (!String(erro).includes('UNIQUE')) throw erro
    }
  }
  throw new ErroHttp(503, 'Não foi possível criar a sala agora. Tente de novo.')
}

async function verSala(request: Request, db: D1Database, codigo: string) {
  const sala = await buscarSala(db, codigo)
  const etag = `W/"${sala.atualizada_em}"`
  if (request.headers.get('If-None-Match') === etag) return new Response(null, { status: 304, headers: cabecalhos({ ETag: etag }) })

  const { results } = await db
    .prepare('SELECT id, nome, cor, dono, palpites, atualizado_em FROM participantes WHERE sala = ? ORDER BY id')
    .bind(codigo)
    .all<Participante>()

  return json(
    {
      codigo: sala.codigo,
      nome: sala.nome,
      competicao: sala.competicao,
      temporada: sala.temporada,
      criadaEm: sala.criada_em,
      atualizadaEm: sala.atualizada_em,
      participantes: results.map((p) => ({
        id: p.id,
        nome: p.nome,
        cor: p.cor,
        dono: p.dono === 1,
        palpites: p.palpites,
        atualizadoEm: p.atualizado_em,
      })),
    },
    200,
    { ETag: etag },
  )
}

async function entrar(request: Request, db: D1Database, codigo: string) {
  const corpo = await lerCorpo(request)
  const nome = lerNome(corpo.nome, TAMANHO_NOME_PESSOA, 'Seu nome')
  await buscarSala(db, codigo)

  const chave = gerarChave()
  const chaveHash = await hash(chave)

  // Duas pessoas entrando ao mesmo tempo podem pegar a mesma cor; o UNIQUE (sala, cor) barra uma delas e ela tenta de novo.
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const { results } = await db.prepare('SELECT nome, cor FROM participantes WHERE sala = ?').bind(codigo).all<{ nome: string; cor: number }>()
    if (results.length >= MAXIMO_PARTICIPANTES) throw new ErroHttp(409, `A sala já está cheia (${MAXIMO_PARTICIPANTES} pessoas).`)
    if (results.some((p) => mesmoNome(p.nome, nome))) throw new ErroHttp(409, 'Já tem alguém com esse nome na sala. Use outro.')

    const usadas = new Set(results.map((p) => p.cor))
    const cor = [...Array(MAXIMO_PARTICIPANTES).keys()].find((c) => !usadas.has(c))!
    const agora = new Date().toISOString()
    try {
      const [inserido] = await db.batch([
        db
          .prepare(
            'INSERT INTO participantes (sala, nome, cor, dono, chave_hash, entrou_em, atualizado_em) VALUES (?, ?, ?, 0, ?, ?, ?) RETURNING id',
          )
          .bind(codigo, nome, cor, chaveHash, agora, agora),
        tocarSala(db, codigo, agora),
      ])
      return json({ id: (inserido.results[0] as { id: number }).id, chave }, 201)
    } catch (erro) {
      if (!String(erro).includes('UNIQUE')) throw erro
    }
  }
  throw new ErroHttp(409, 'Muita gente entrando ao mesmo tempo. Tente de novo.')
}

async function quemSou(request: Request, db: D1Database, codigo: string) {
  const eu = await autenticar(request, db, codigo)
  return json({ id: eu.id, nome: eu.nome })
}

async function gravarPalpites(request: Request, db: D1Database, codigo: string, id: number) {
  const eu = await autenticar(request, db, codigo)
  if (eu.id !== id) throw new ErroHttp(403, 'Você só pode mudar os seus palpites.')

  const corpo = await lerCorpo(request)
  const palpites = corpo.palpites
  if (typeof palpites !== 'string' || palpites.length > MAIOR_PALPITES || !FORMATO_PALPITES.test(palpites))
    throw new ErroHttp(400, 'Palpites em formato inválido.')

  const agora = new Date().toISOString()
  await db.batch([
    db.prepare('UPDATE participantes SET palpites = ?, atualizado_em = ? WHERE id = ?').bind(palpites, agora, id),
    tocarSala(db, codigo, agora),
  ])
  return new Response(null, { status: 204, headers: cabecalhos() })
}

async function remover(request: Request, db: D1Database, codigo: string, id: number) {
  const eu = await autenticar(request, db, codigo)
  if (eu.id !== id && eu.dono !== 1) throw new ErroHttp(403, 'Só quem criou a sala pode remover outras pessoas.')

  const alvo = await db.prepare('SELECT id, dono FROM participantes WHERE sala = ? AND id = ?').bind(codigo, id).first<{ id: number; dono: number }>()
  if (!alvo) throw new ErroHttp(404, 'Essa pessoa não está na sala.')

  const agora = new Date().toISOString()
  await db.batch([
    db.prepare('DELETE FROM participantes WHERE id = ?').bind(id),
    // Se o dono saiu, quem entrou primeiro entre os que ficaram vira o dono.
    db
      .prepare(
        `UPDATE participantes SET dono = 1
         WHERE ? = 1 AND id = (SELECT MIN(id) FROM participantes WHERE sala = ?)`,
      )
      .bind(alvo.dono, codigo),
    tocarSala(db, codigo, agora),
    // Sala vazia não serve para nada.
    db.prepare('DELETE FROM salas WHERE codigo = ? AND NOT EXISTS (SELECT 1 FROM participantes WHERE sala = ?)').bind(codigo, codigo),
  ])
  return new Response(null, { status: 204, headers: cabecalhos() })
}

/** Tarefa diária: apaga as salas sem nenhuma mudança há mais de DIAS_PARA_EXPIRAR dias. */
export async function apagarSalasParadas(db: D1Database, agora = new Date()) {
  const limite = new Date(agora.getTime() - DIAS_PARA_EXPIRAR * 86_400_000).toISOString()
  await db.batch([
    db.prepare('DELETE FROM participantes WHERE sala IN (SELECT codigo FROM salas WHERE atualizada_em < ?)').bind(limite),
    db.prepare('DELETE FROM salas WHERE atualizada_em < ?').bind(limite),
  ])
}

// ---------- auxiliares ----------

async function buscarSala(db: D1Database, codigo: string) {
  const sala = await db.prepare('SELECT * FROM salas WHERE codigo = ?').bind(codigo).first<Sala>()
  if (!sala) throw new ErroHttp(404, 'Sala não encontrada. Confira o código ou peça o link de novo.')
  return sala
}

async function autenticar(request: Request, db: D1Database, codigo: string) {
  const chave = request.headers.get('Authorization')?.match(/^Bearer ([A-Za-z0-9_-]{20,100})$/)?.[1]
  if (!chave) throw new ErroHttp(401, 'Você não está nesta sala.')
  const eu = await db
    .prepare('SELECT id, nome, dono FROM participantes WHERE sala = ? AND chave_hash = ?')
    .bind(codigo, await hash(chave))
    .first<{ id: number; nome: string; dono: number }>()
  if (!eu) throw new ErroHttp(401, 'Você não está mais nesta sala.')
  return eu
}

function tocarSala(db: D1Database, codigo: string, agora: string) {
  return db.prepare('UPDATE salas SET atualizada_em = ? WHERE codigo = ?').bind(agora, codigo)
}

async function lerCorpo(request: Request): Promise<Record<string, unknown>> {
  const texto = await request.text()
  if (texto.length > MAIOR_CORPO) throw new ErroHttp(413, 'Dados grandes demais.')
  try {
    const corpo: unknown = JSON.parse(texto)
    if (corpo && typeof corpo === 'object' && !Array.isArray(corpo)) return corpo as Record<string, unknown>
  } catch {
    // cai no erro abaixo
  }
  throw new ErroHttp(400, 'Dados inválidos.')
}

/** Tira caracteres de controle e espaços repetidos; exige de 1 até `maximo` letras. */
export function lerNome(valor: unknown, maximo: number, rotulo: string) {
  const nome = typeof valor === 'string' ? valor.normalize('NFC').replace(/\p{C}/gu, '').replace(/\s+/g, ' ').trim() : ''
  if (!nome) throw new ErroHttp(400, `${rotulo} não pode ficar vazio.`)
  if ([...nome].length > maximo) throw new ErroHttp(400, `${rotulo} pode ter no máximo ${maximo} letras.`)
  return nome
}

function mesmoNome(a: string, b: string) {
  return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }) === 0
}

/** "k7p-2qx", "K7P2QX" -> "K7P2QX"; null se não for um código possível. */
export function normalizarCodigo(texto: string) {
  const codigo = texto.toUpperCase().replace(/-/g, '')
  return codigo.length === TAMANHO_CODIGO && [...codigo].every((c) => ALFABETO.includes(c)) ? codigo : null
}

function gerarCodigo() {
  // 256 é múltiplo de 32: o resto da divisão não favorece nenhuma letra.
  return [...crypto.getRandomValues(new Uint8Array(TAMANHO_CODIGO))].map((b) => ALFABETO[b % ALFABETO.length]).join('')
}

function gerarChave() {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hash(texto: string) {
  const resumo = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto))
  return [...new Uint8Array(resumo)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function cabecalhos(extra: Record<string, string> = {}) {
  return { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra }
}

function json(dados: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: cabecalhos({ 'Content-Type': 'application/json; charset=utf-8', ...extra }),
  })
}
