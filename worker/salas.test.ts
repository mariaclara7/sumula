import { readFileSync } from 'node:fs'
import { DatabaseSync, type SQLInputValue } from 'node:sqlite'
import { beforeEach, describe, expect, it } from 'vitest'
import { apagarSalasParadas, normalizarCodigo, tratarSalas } from './salas'

/** O pedaço da API do D1 que salas.ts usa, em cima do SQLite do Node, com a migração de verdade. */
function bancoDeTeste() {
  const sqlite = new DatabaseSync(':memory:')
  sqlite.exec('PRAGMA foreign_keys = ON')
  sqlite.exec(readFileSync(new URL('../migrations/0001_salas.sql', import.meta.url), 'utf8'))

  const comando = (sql: string, valores: SQLInputValue[] = []) => ({
    bind: (...novos: SQLInputValue[]) => comando(sql, novos),
    first: async () => sqlite.prepare(sql).get(...valores) ?? null,
    all: async () => ({ results: sqlite.prepare(sql).all(...valores) }),
    executar: () => ({ results: sqlite.prepare(sql).all(...valores) }),
  })

  const db = {
    prepare: (sql: string) => comando(sql),
    // Como no D1: tudo ou nada.
    batch: async (comandos: ReturnType<typeof comando>[]) => {
      sqlite.exec('BEGIN')
      try {
        const resultados = comandos.map((c) => c.executar())
        sqlite.exec('COMMIT')
        return resultados
      } catch (erro) {
        sqlite.exec('ROLLBACK')
        throw erro
      }
    },
  }
  return { db: db as unknown as D1Database, sqlite }
}

let db: D1Database
let sqlite: DatabaseSync

beforeEach(() => {
  ;({ db, sqlite } = bancoDeTeste())
})

function pedir(metodo: string, caminho: string, { corpo, chave, etag }: { corpo?: unknown; chave?: string; etag?: string } = {}) {
  const headers: Record<string, string> = {}
  if (corpo !== undefined) headers['Content-Type'] = 'application/json'
  if (chave) headers.Authorization = `Bearer ${chave}`
  if (etag) headers['If-None-Match'] = etag
  return tratarSalas(
    new Request(`https://brasumula.com.br${caminho}`, {
      method: metodo,
      headers,
      body: corpo === undefined ? undefined : typeof corpo === 'string' ? corpo : JSON.stringify(corpo),
    }),
    db,
  )
}

async function criar(nome = 'Os Brothers', seuNome = 'Maria') {
  const resposta = await pedir('POST', '/api/salas', { corpo: { nome, seuNome, competicao: 'BSA', temporada: 2026 } })
  expect(resposta.status).toBe(201)
  return (await resposta.json()) as { codigo: string; participante: { id: number; chave: string } }
}

async function entrar(codigo: string, nome: string) {
  return pedir('POST', `/api/salas/${codigo}/participantes`, { corpo: { nome } })
}

async function ver(codigo: string) {
  const resposta = await pedir('GET', `/api/salas/${codigo}`)
  return {
    status: resposta.status,
    etag: resposta.headers.get('ETag'),
    sala: (await resposta.json()) as {
      nome: string
      participantes: { id: number; nome: string; cor: number; dono: boolean; palpites: string }[]
    },
  }
}

describe('salas', () => {
  it('cria a sala com quem criou como dono, sem nunca devolver a chave na leitura', async () => {
    const { codigo, participante } = await criar('  Os   Brothers ', 'Maria')
    expect(codigo).toMatch(/^[2-9A-HJ-NP-Z]{6}$/)
    expect(participante.chave.length).toBeGreaterThanOrEqual(30)

    const { status, sala } = await ver(codigo)
    expect(status).toBe(200)
    expect(sala.nome).toBe('Os Brothers')
    expect(sala.participantes).toEqual([
      expect.objectContaining({ id: participante.id, nome: 'Maria', cor: 0, dono: true, palpites: '' }),
    ])
    expect(JSON.stringify(sala)).not.toContain(participante.chave)
    // O banco guarda só o hash.
    expect(JSON.stringify(sqlite.prepare('SELECT * FROM participantes').all())).not.toContain(participante.chave)
  })

  it('aceita o código com traço e em minúsculas', async () => {
    const { codigo } = await criar()
    expect((await ver(`${codigo.slice(0, 3).toLowerCase()}-${codigo.slice(3)}`)).status).toBe(200)
    expect(normalizarCodigo('k7p-2qx')).toBe('K7P2QX')
    expect(normalizarCodigo('K0P2QX')).toBeNull() // 0 não existe no alfabeto
    expect((await pedir('GET', '/api/salas/ABCDEFG')).status).toBe(404)
  })

  it('recusa nomes vazios ou longos demais e campeonato inválido', async () => {
    const corpo = { nome: 'Sala', seuNome: 'Maria', competicao: 'BSA', temporada: 2026 }
    expect((await pedir('POST', '/api/salas', { corpo: { ...corpo, seuNome: '   ' } })).status).toBe(400)
    expect((await pedir('POST', '/api/salas', { corpo: { ...corpo, seuNome: 'x'.repeat(21) } })).status).toBe(400)
    expect((await pedir('POST', '/api/salas', { corpo: { ...corpo, nome: 'x'.repeat(31) } })).status).toBe(400)
    expect((await pedir('POST', '/api/salas', { corpo: { ...corpo, competicao: 'bsa; drop' } })).status).toBe(400)
    expect((await pedir('POST', '/api/salas', { corpo: 'não é json' })).status).toBe(400)
    const resposta = await pedir('POST', '/api/salas', { corpo: { ...corpo, seuNome: '' } })
    expect(await resposta.json()).toEqual({ erro: 'Seu nome não pode ficar vazio.' })
  })

  it('aceita até 5 pessoas, cada uma com uma cor, e recusa nome repetido', async () => {
    const { codigo } = await criar()
    for (const nome of ['Lucas', 'Bia', 'Rafa', 'Duda']) expect((await entrar(codigo, nome)).status).toBe(201)

    const cheia = await entrar(codigo, 'Sexto')
    expect(cheia.status).toBe(409)
    expect(await cheia.json()).toEqual({ erro: 'A sala já está cheia (5 pessoas).' })

    const { sala } = await ver(codigo)
    expect(sala.participantes.map((p) => p.cor)).toEqual([0, 1, 2, 3, 4])
    expect(sala.participantes.filter((p) => p.dono)).toHaveLength(1)

    const outra = await criar('Outra sala')
    expect((await entrar(outra.codigo, 'maría')).status).toBe(409) // "Maria" já está lá (sem diferenciar acento e maiúscula)
  })

  it('cada um grava só os próprios palpites', async () => {
    const { codigo, participante: maria } = await criar()
    const lucas = (await (await entrar(codigo, 'Lucas')).json()) as { id: number; chave: string }

    const palpites = '1.a1-2010~3~11'
    expect((await pedir('PUT', `/api/salas/${codigo}/participantes/${maria.id}/palpites`, { corpo: { palpites }, chave: maria.chave })).status).toBe(204)
    // Lucas tentando mudar os palpites da Maria.
    expect((await pedir('PUT', `/api/salas/${codigo}/participantes/${maria.id}/palpites`, { corpo: { palpites: '' }, chave: lucas.chave })).status).toBe(403)
    // Sem chave ou com chave inventada.
    expect((await pedir('PUT', `/api/salas/${codigo}/participantes/${maria.id}/palpites`, { corpo: { palpites: '' } })).status).toBe(401)
    expect((await pedir('PUT', `/api/salas/${codigo}/participantes/${maria.id}/palpites`, { corpo: { palpites: '' }, chave: 'x'.repeat(32) })).status).toBe(401)
    // A chave de uma sala não vale em outra.
    const outra = await criar('Outra')
    expect((await pedir('PUT', `/api/salas/${outra.codigo}/participantes/${outra.participante.id}/palpites`, { corpo: { palpites: '' }, chave: maria.chave })).status).toBe(401)
    // Formato errado.
    expect((await pedir('PUT', `/api/salas/${codigo}/participantes/${maria.id}/palpites`, { corpo: { palpites: '<script>' }, chave: maria.chave })).status).toBe(400)

    const { sala } = await ver(codigo)
    expect(sala.participantes.find((p) => p.id === maria.id)?.palpites).toBe(palpites)
  })

  it('o link pessoal descobre quem é a pessoa pela chave', async () => {
    const { codigo, participante } = await criar()
    const resposta = await pedir('GET', `/api/salas/${codigo}/eu`, { chave: participante.chave })
    expect(await resposta.json()).toEqual({ id: participante.id, nome: 'Maria' })
    expect((await pedir('GET', `/api/salas/${codigo}/eu`, { chave: 'y'.repeat(32) })).status).toBe(401)
  })

  it('responde 304 quando nada mudou desde a última leitura', async () => {
    const { codigo, participante } = await criar()
    const { etag } = await ver(codigo)
    expect((await pedir('GET', `/api/salas/${codigo}`, { etag: etag! })).status).toBe(304)

    await new Promise((r) => setTimeout(r, 5))
    await pedir('PUT', `/api/salas/${codigo}/participantes/${participante.id}/palpites`, { corpo: { palpites: '1.a-00' }, chave: participante.chave })
    expect((await pedir('GET', `/api/salas/${codigo}`, { etag: etag! })).status).toBe(200)
  })

  it('só o dono remove outros; se o dono sai, quem entrou primeiro vira dono; sala vazia some', async () => {
    const { codigo, participante: maria } = await criar()
    const lucas = (await (await entrar(codigo, 'Lucas')).json()) as { id: number; chave: string }
    const bia = (await (await entrar(codigo, 'Bia')).json()) as { id: number; chave: string }

    expect((await pedir('DELETE', `/api/salas/${codigo}/participantes/${bia.id}`, { chave: lucas.chave })).status).toBe(403)
    expect((await pedir('DELETE', `/api/salas/${codigo}/participantes/${bia.id}`, { chave: maria.chave })).status).toBe(204)
    expect((await pedir('DELETE', `/api/salas/${codigo}/participantes/${maria.id}`, { chave: maria.chave })).status).toBe(204)

    let { sala } = await ver(codigo)
    expect(sala.participantes).toEqual([expect.objectContaining({ nome: 'Lucas', dono: true })])

    // A cor de quem saiu fica livre para quem entrar.
    expect((await entrar(codigo, 'Rafa')).status).toBe(201)
    ;({ sala } = await ver(codigo))
    expect(sala.participantes.map((p) => [p.nome, p.cor])).toEqual([
      ['Lucas', 1],
      ['Rafa', 0],
    ])

    // O novo dono sai também: quem sobrou herda.
    await pedir('DELETE', `/api/salas/${codigo}/participantes/${lucas.id}`, { chave: lucas.chave })
    ;({ sala } = await ver(codigo))
    expect(sala.participantes).toEqual([expect.objectContaining({ nome: 'Rafa', dono: true })])
  })

  it('apaga a sala quando a última pessoa sai', async () => {
    const { codigo, participante } = await criar()
    expect((await pedir('DELETE', `/api/salas/${codigo}/participantes/${participante.id}`, { chave: participante.chave })).status).toBe(204)
    expect((await ver(codigo)).status).toBe(404)
  })

  it('a tarefa diária apaga só as salas paradas há mais de 60 dias', async () => {
    const parada = await criar('Parada')
    const ativa = await criar('Ativa')
    sqlite.prepare('UPDATE salas SET atualizada_em = ? WHERE codigo = ?').run('2026-01-01T00:00:00.000Z', parada.codigo)

    await apagarSalasParadas(db, new Date('2026-10-06T00:00:00Z'))
    expect((await ver(parada.codigo)).status).toBe(404)
    expect((await ver(ativa.codigo)).status).toBe(200)
    expect(sqlite.prepare('SELECT COUNT(*) AS n FROM participantes').get()).toEqual({ n: 1 })
  })

  it('não aceita métodos ou caminhos desconhecidos', async () => {
    const { codigo } = await criar()
    expect((await pedir('GET', '/api/salas')).status).toBe(405)
    expect((await pedir('DELETE', `/api/salas/${codigo}`)).status).toBe(404)
    expect((await pedir('POST', '/api/salas', { corpo: { nome: 'x'.repeat(5000) } })).status).toBe(413)
  })
})
