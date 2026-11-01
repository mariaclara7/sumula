/**
 * API das salas do simulador, em /api/salas. Guarda só nomes e palpites; as tabelas de cada pessoa são
 * calculadas no navegador, com o mesmo código do simulador.
 *
 * Para criar, entrar e palpitar é preciso estar logado (conta do Firebase com e-mail confirmado): o pedido
 * traz o ID token do Firebase em "Authorization: Bearer", e o servidor confere a assinatura antes de tudo.
 * Ver a sala pelo link continua aberto. Quem entrou antes do login existir tinha uma chave secreta no navegador;
 * ela agora só serve para ligar aquela participação à conta (/vincular).
 *
 *   GET    /api/salas                                  as salas da conta
 *   POST   /api/salas                                  cria a sala e o dono         { nome, seuNome, competicao, temporada }
 *   GET    /api/salas/:codigo                          a sala com todos os palpites (aberto; ETag para 304)
 *   POST   /api/salas/:codigo/participantes            entra na sala (até 5)        { nome }
 *   GET    /api/salas/:codigo/eu                       quem a conta é nesta sala
 *   POST   /api/salas/:codigo/vincular                 liga a participação antiga (X-Chave-Sala) à conta
 *   PUT    /api/salas/:codigo/participantes/:id/palpites  grava os palpites        { palpites }
 *   DELETE /api/salas/:codigo/participantes/:id        sai da sala ou remove alguém (só o dono remove outros)
 */

import type { Identidade, VerificarToken } from './firebase'
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

export class ErroHttp extends Error {
  readonly status: number
  constructor(status: number, mensagem: string) {
    super(mensagem)
    this.status = status
  }
}

export type Contexto = { db: D1Database; verificar: VerificarToken }

export async function tratarSalas(request: Request, ctx: Contexto): Promise<Response> {
  try {
    return await rotear(request, ctx)
  } catch (erro) {
    return respostaDeErro(erro)
  }
}

export function respostaDeErro(erro: unknown) {
  if (erro instanceof ErroHttp) return json({ erro: erro.message }, erro.status)
  console.error(erro)
  return json({ erro: 'Algo deu errado. Tente de novo em instantes.' }, 500)
}

async function rotear(request: Request, ctx: Contexto): Promise<Response> {
  const caminho = new URL(request.url).pathname.replace(/\/+$/, '')
  const partes = caminho.split('/').slice(3) // ['', 'api', 'salas', ...]
  const metodo = request.method

  if (partes.length === 0) {
    if (metodo === 'GET') return minhasSalas(request, ctx)
    if (metodo === 'POST') return criarSala(request, ctx)
    throw new ErroHttp(405, 'Método não permitido.')
  }

  const codigo = normalizarCodigo(partes[0])
  if (!codigo) throw new ErroHttp(404, 'Sala não encontrada.')

  if (partes.length === 1 && metodo === 'GET') return verSala(request, ctx.db, codigo)
  if (partes.length === 2 && partes[1] === 'participantes' && metodo === 'POST') return entrar(request, ctx, codigo)
  if (partes.length === 2 && partes[1] === 'eu' && metodo === 'GET') return quemSou(request, ctx, codigo)
  if (partes.length === 2 && partes[1] === 'vincular' && metodo === 'POST') return vincular(request, ctx, codigo)

  if (partes[1] === 'participantes' && /^\d{1,12}$/.test(partes[2] ?? '')) {
    const id = Number(partes[2])
    if (partes.length === 4 && partes[3] === 'palpites' && metodo === 'PUT') return gravarPalpites(request, ctx, codigo, id)
    if (partes.length === 3 && metodo === 'DELETE') return remover(request, ctx, codigo, id)
  }

  throw new ErroHttp(404, 'Endereço não encontrado.')
}

/** As salas da conta, com quem está em cada uma (nome e cor, para as bolinhas) e os palpites da própria pessoa. */
async function minhasSalas(request: Request, ctx: Contexto) {
  const conta = await exigirConta(request, ctx)
  const { results: salas } = await ctx.db
    .prepare(
      `SELECT s.codigo, s.nome, p.palpites AS meusPalpites
       FROM participantes p JOIN salas s ON s.codigo = p.sala
       WHERE p.uid = ? ORDER BY s.atualizada_em DESC`,
    )
    .bind(conta.uid)
    .all<{ codigo: string; nome: string; meusPalpites: string }>()
  const { results: pessoas } = await ctx.db
    .prepare(
      `SELECT sala, nome, cor FROM participantes
       WHERE sala IN (SELECT sala FROM participantes WHERE uid = ?) ORDER BY id`,
    )
    .bind(conta.uid)
    .all<{ sala: string; nome: string; cor: number }>()
  return json(
    salas.map((s) => ({
      ...s,
      pessoas: pessoas.filter((p) => p.sala === s.codigo).map(({ nome, cor }) => ({ nome, cor })),
    })),
  )
}

async function criarSala(request: Request, ctx: Contexto) {
  const conta = await exigirConta(request, ctx, { confirmado: true })
  const { db } = ctx
  const corpo = await lerCorpo(request)
  const nome = lerNome(corpo.nome, TAMANHO_NOME_SALA, 'O nome da sala')
  const seuNome = lerNome(corpo.seuNome, TAMANHO_NOME_PESSOA, 'Seu nome')
  const competicao = typeof corpo.competicao === 'string' && /^[A-Z0-9]{2,6}$/.test(corpo.competicao) ? corpo.competicao : null
  const temporada = Number.isInteger(corpo.temporada) && (corpo.temporada as number) >= 2000 && (corpo.temporada as number) <= 2100
  if (!competicao || !temporada) throw new ErroHttp(400, 'Campeonato inválido.')

  const agora = new Date().toISOString()

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
            'INSERT INTO participantes (sala, nome, cor, dono, chave_hash, uid, entrou_em, atualizado_em) VALUES (?, ?, 0, 1, ?, ?, ?, ?) RETURNING id',
          )
          .bind(codigo, seuNome, await chaveInutil(), conta.uid, agora, agora),
      ])
      const id = (inserido.results[0] as { id: number }).id
      return json({ codigo, participante: { id } }, 201)
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

  // O uid de cada um nunca sai daqui: quem olha a sala vê só nome, cor e palpites.
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

async function entrar(request: Request, ctx: Contexto, codigo: string) {
  const conta = await exigirConta(request, ctx, { confirmado: true })
  const { db } = ctx
  const corpo = await lerCorpo(request)
  const nome = lerNome(corpo.nome, TAMANHO_NOME_PESSOA, 'Seu nome')
  await buscarSala(db, codigo)

  // Já está na sala com esta conta: só devolve quem é.
  const jaEsta = await participanteDaConta(db, codigo, conta.uid)
  if (jaEsta) return json({ id: jaEsta.id })

  // Duas pessoas entrando ao mesmo tempo podem pegar a mesma cor; o UNIQUE (sala, cor) barra uma delas e ela tenta de novo.
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const { results } = await db.prepare('SELECT nome, cor FROM participantes WHERE sala = ?').bind(codigo).all<{ nome: string; cor: number }>()
    if (results.length >= MAXIMO_PARTICIPANTES) throw new ErroHttp(409, `A sala já está cheia (${MAXIMO_PARTICIPANTES} pessoas).`)
    if (results.some((p) => mesmoNome(p.nome, nome)))
      throw new ErroHttp(409, 'Já tem alguém com esse nome na sala. Mude o seu nome em Minha conta e tente de novo.')

    const usadas = new Set(results.map((p) => p.cor))
    const cor = [...Array(MAXIMO_PARTICIPANTES).keys()].find((c) => !usadas.has(c))!
    const agora = new Date().toISOString()
    try {
      const [inserido] = await db.batch([
        db
          .prepare(
            'INSERT INTO participantes (sala, nome, cor, dono, chave_hash, uid, entrou_em, atualizado_em) VALUES (?, ?, ?, 0, ?, ?, ?, ?) RETURNING id',
          )
          .bind(codigo, nome, cor, await chaveInutil(), conta.uid, agora, agora),
        tocarSala(db, codigo, agora),
      ])
      return json({ id: (inserido.results[0] as { id: number }).id }, 201)
    } catch (erro) {
      if (!String(erro).includes('UNIQUE')) throw erro
    }
  }
  throw new ErroHttp(409, 'Muita gente entrando ao mesmo tempo. Tente de novo.')
}

async function quemSou(request: Request, ctx: Contexto, codigo: string) {
  const conta = await exigirConta(request, ctx)
  const eu = await participanteDaConta(ctx.db, codigo, conta.uid)
  if (!eu) throw new ErroHttp(404, 'Você não está nesta sala.')
  return json({ id: eu.id, nome: eu.nome })
}

/** Liga à conta a participação de antes do login (a chave que ficou no navegador). */
async function vincular(request: Request, ctx: Contexto, codigo: string) {
  const conta = await exigirConta(request, ctx)
  const chave = request.headers.get('X-Chave-Sala')?.match(/^[A-Za-z0-9_-]{20,100}$/)?.[0]
  if (!chave) throw new ErroHttp(400, 'Chave inválida.')

  const antiga = await ctx.db
    .prepare('SELECT id, uid FROM participantes WHERE sala = ? AND chave_hash = ?')
    .bind(codigo, await hash(chave))
    .first<{ id: number; uid: string | null }>()
  if (!antiga) throw new ErroHttp(404, 'Essa participação não existe mais.')
  if (antiga.uid === conta.uid) return json({ id: antiga.id })
  if (antiga.uid) throw new ErroHttp(409, 'Essa participação já está ligada a outra conta.')
  if (await participanteDaConta(ctx.db, codigo, conta.uid)) throw new ErroHttp(409, 'A sua conta já está nesta sala.')

  await ctx.db.prepare('UPDATE participantes SET uid = ? WHERE id = ? AND uid IS NULL').bind(conta.uid, antiga.id).run()
  return json({ id: antiga.id })
}

async function gravarPalpites(request: Request, ctx: Contexto, codigo: string, id: number) {
  const conta = await exigirConta(request, ctx, { confirmado: true })
  const eu = await participanteDaConta(ctx.db, codigo, conta.uid)
  if (!eu) throw new ErroHttp(403, 'Você não está nesta sala.')
  if (eu.id !== id) throw new ErroHttp(403, 'Você só pode mudar os seus palpites.')

  const corpo = await lerCorpo(request)
  const palpites = corpo.palpites
  if (typeof palpites !== 'string' || palpites.length > MAIOR_PALPITES || !FORMATO_PALPITES.test(palpites))
    throw new ErroHttp(400, 'Palpites em formato inválido.')

  const agora = new Date().toISOString()
  await ctx.db.batch([
    ctx.db.prepare('UPDATE participantes SET palpites = ?, atualizado_em = ? WHERE id = ?').bind(palpites, agora, id),
    tocarSala(ctx.db, codigo, agora),
  ])
  return new Response(null, { status: 204, headers: cabecalhos() })
}

async function remover(request: Request, ctx: Contexto, codigo: string, id: number) {
  const conta = await exigirConta(request, ctx)
  const eu = await participanteDaConta(ctx.db, codigo, conta.uid)
  if (!eu) throw new ErroHttp(403, 'Você não está nesta sala.')
  if (eu.id !== id && eu.dono !== 1) throw new ErroHttp(403, 'Só quem criou a sala pode remover outras pessoas.')

  const alvo = await ctx.db.prepare('SELECT id, dono FROM participantes WHERE sala = ? AND id = ?').bind(codigo, id).first<{ id: number; dono: number }>()
  if (!alvo) throw new ErroHttp(404, 'Essa pessoa não está na sala.')
  await ctx.db.batch(tirarDaSala(ctx.db, codigo, alvo))
  return new Response(null, { status: 204, headers: cabecalhos() })
}

/**
 * Os comandos para tirar alguém de uma sala: se era o dono, quem entrou primeiro entre os que ficaram vira o
 * dono; se a sala ficou vazia, ela é apagada.
 */
export function tirarDaSala(db: D1Database, codigo: string, alvo: { id: number; dono: number }) {
  const agora = new Date().toISOString()
  return [
    db.prepare('DELETE FROM participantes WHERE id = ?').bind(alvo.id),
    db
      .prepare(
        `UPDATE participantes SET dono = 1
         WHERE ? = 1 AND id = (SELECT MIN(id) FROM participantes WHERE sala = ?)`,
      )
      .bind(alvo.dono, codigo),
    tocarSala(db, codigo, agora),
    db.prepare('DELETE FROM salas WHERE codigo = ? AND NOT EXISTS (SELECT 1 FROM participantes WHERE sala = ?)').bind(codigo, codigo),
  ]
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

/**
 * Quem está fazendo o pedido, pelo ID token do Firebase. Com `confirmado`, exige o e-mail confirmado (contas do
 * Google já vêm confirmadas): é o que impede alguém de criar contas com e-mails falsos para encher as salas.
 */
export async function exigirConta(request: Request, ctx: Contexto, { confirmado = false } = {}): Promise<Identidade> {
  const token = request.headers.get('Authorization')?.match(/^Bearer (\S{20,4096})$/)?.[1]
  if (!token) throw new ErroHttp(401, 'Entre com a sua conta para fazer isso.')
  const conta = await ctx.verificar(token)
  if (!conta) throw new ErroHttp(401, 'A sua sessão expirou. Entre de novo.')
  if (confirmado && !conta.emailConfirmado) throw new ErroHttp(403, 'Confirme o seu e-mail antes (veja em Minha conta).')
  return conta
}

function participanteDaConta(db: D1Database, codigo: string, uid: string) {
  return db
    .prepare('SELECT id, nome, dono FROM participantes WHERE sala = ? AND uid = ?')
    .bind(codigo, uid)
    .first<{ id: number; nome: string; dono: number }>()
}

/** As participações novas não usam chave; a coluna é obrigatória, então vai o hash de algo que ninguém tem. */
async function chaveInutil() {
  return hash(gerarChave())
}

export function tocarSala(db: D1Database, codigo: string, agora: string) {
  return db.prepare('UPDATE salas SET atualizada_em = ? WHERE codigo = ?').bind(agora, codigo)
}

export async function lerCorpo(request: Request): Promise<Record<string, unknown>> {
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

export function cabecalhos(extra: Record<string, string> = {}) {
  return { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra }
}

export function json(dados: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: cabecalhos({ 'Content-Type': 'application/json; charset=utf-8', ...extra }),
  })
}
