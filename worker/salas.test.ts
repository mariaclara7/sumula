import { readFileSync } from 'node:fs'
import { DatabaseSync, type SQLInputValue } from 'node:sqlite'
import { beforeEach, describe, expect, it } from 'vitest'
import { tratarEu } from './eu'
import type { Partida } from '../src/api/tipos'
import { codificarPalpites, decodificarPalpites } from '../src/util/codigoPalpites'
import type { VerificarToken } from './firebase'
import { apagarSalasParadas, normalizarCodigo, tratarSalas } from './salas'

/** O pedaço da API do D1 que o Worker usa, em cima do SQLite do Node, com as migrações de verdade. */
function bancoDeTeste() {
  const sqlite = new DatabaseSync(':memory:')
  sqlite.exec('PRAGMA foreign_keys = ON')
  for (const arquivo of ['0001_salas.sql', '0002_contas.sql'])
    sqlite.exec(readFileSync(new URL(`../migrations/${arquivo}`, import.meta.url), 'utf8'))

  const comando = (sql: string, valores: SQLInputValue[] = []) => ({
    bind: (...novos: SQLInputValue[]) => comando(sql, novos),
    first: async () => sqlite.prepare(sql).get(...valores) ?? null,
    all: async () => ({ results: sqlite.prepare(sql).all(...valores) }),
    run: async () => ({ results: sqlite.prepare(sql).all(...valores) }),
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

// Tokens de mentira: a verificação de verdade (assinatura do Google) é testada em firebase.test.ts.
const token = (uid: string, confirmado = true) => `conta.${uid}.${confirmado ? 'ok' : 'nao'}.000000000000`
const verificar: VerificarToken = async (t) => {
  const [tipo, uid, confirmado] = t.split('.')
  return tipo === 'conta' ? { uid, nome: '', emailConfirmado: confirmado === 'ok' } : null
}

// Os jogos que a API confere na trava do horário (cada teste pode trocar).
let jogos: Partida[] = []
let dadosForaDoAr = false
const buscarPartidas = async () => {
  if (dadosForaDoAr) throw new Error('fora do ar')
  return jogos
}

let db: D1Database
let sqlite: DatabaseSync

beforeEach(() => {
  ;({ db, sqlite } = bancoDeTeste())
  jogos = []
  dadosForaDoAr = false
})

type Opcoes = { corpo?: unknown; conta?: string; etag?: string; chaveSala?: string; tokenCru?: string }

function pedir(metodo: string, caminho: string, { corpo, conta, etag, chaveSala, tokenCru }: Opcoes = {}) {
  const headers: Record<string, string> = {}
  if (corpo !== undefined) headers['Content-Type'] = 'application/json'
  if (conta) headers.Authorization = `Bearer ${token(conta)}`
  if (tokenCru) headers.Authorization = `Bearer ${tokenCru}`
  if (etag) headers['If-None-Match'] = etag
  if (chaveSala) headers['X-Chave-Sala'] = chaveSala
  const request = new Request(`https://brasumula.com.br${caminho}`, {
    method: metodo,
    headers,
    body: corpo === undefined ? undefined : typeof corpo === 'string' ? corpo : JSON.stringify(corpo),
  })
  const ctx = { db, verificar, partidas: buscarPartidas }
  return caminho.startsWith('/api/eu') ? tratarEu(request, ctx) : tratarSalas(request, ctx)
}

async function criar(conta = 'maria', nome = 'Os Brothers', seuNome = 'Maria') {
  const resposta = await pedir('POST', '/api/salas', { conta, corpo: { nome, seuNome, competicao: 'BSA', temporada: 2026 } })
  expect(resposta.status).toBe(201)
  return (await resposta.json()) as { codigo: string; participante: { id: number } }
}

async function entrar(codigo: string, conta: string, nome = conta) {
  const resposta = await pedir('POST', `/api/salas/${codigo}/participantes`, { conta, corpo: { nome } })
  return { status: resposta.status, dados: (await resposta.json()) as { id: number; erro?: string } }
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

describe('salas com conta', () => {
  it('criar e entrar exigem conta com e-mail confirmado; ver a sala continua aberto', async () => {
    const semConta = await pedir('POST', '/api/salas', { corpo: { nome: 'X', seuNome: 'Y', competicao: 'BSA', temporada: 2026 } })
    expect(semConta.status).toBe(401)
    expect(await semConta.json()).toEqual({ erro: 'Entre com a sua conta para fazer isso.' })

    const naoConfirmado = await pedir('POST', '/api/salas', {
      tokenCru: token('ze', false),
      corpo: { nome: 'X', seuNome: 'Zé', competicao: 'BSA', temporada: 2026 },
    })
    expect(naoConfirmado.status).toBe(403)

    const invalido = await pedir('GET', '/api/salas', { tokenCru: 'qualquer.coisa.inventada.aqui' })
    expect(invalido.status).toBe(401)
    expect(await invalido.json()).toEqual({ erro: 'A sua sessão expirou. Entre de novo.' })

    const { codigo } = await criar()
    const { status, sala } = await ver(codigo)
    expect(status).toBe(200)
    expect(sala.participantes).toEqual([expect.objectContaining({ nome: 'Maria', cor: 0, dono: true })])
    // O uid nunca aparece para quem olha a sala.
    expect(JSON.stringify(sala)).not.toContain('maria')
  })

  it('entrar duas vezes com a mesma conta não duplica; até 5 contas', async () => {
    const { codigo } = await criar()
    const primeira = await entrar(codigo, 'lucas', 'Lucas')
    const segunda = await entrar(codigo, 'lucas', 'Lucas')
    expect(primeira.status).toBe(201)
    expect(segunda.status).toBe(200)
    expect(segunda.dados.id).toBe(primeira.dados.id)
    for (const nome of ['bia', 'rafa', 'duda']) expect((await entrar(codigo, nome)).status).toBe(201)
    const cheia = await entrar(codigo, 'sexto')
    expect(cheia.status).toBe(409)
    expect((await ver(codigo)).sala.participantes).toHaveLength(5)
  })

  it('cada conta grava só os próprios palpites', async () => {
    const { codigo, participante: maria } = await criar()
    const lucas = (await entrar(codigo, 'lucas', 'Lucas')).dados
    const gravar = (id: number, conta?: string, palpites = '1.a-21') =>
      pedir('PUT', `/api/salas/${codigo}/participantes/${id}/palpites`, { conta, corpo: { palpites } })

    expect((await gravar(maria.id, 'maria')).status).toBe(204)
    expect((await gravar(maria.id, 'lucas')).status).toBe(403)
    expect((await gravar(maria.id)).status).toBe(401)
    expect((await gravar(lucas.id, 'estranho')).status).toBe(403)
    expect((await gravar(maria.id, 'maria', '<script>')).status).toBe(400)
    expect((await ver(codigo)).sala.participantes.find((p) => p.id === maria.id)?.palpites).toBe('1.a-21')
  })

  it('não deixa mudar palpite de jogo que já começou (bolão)', async () => {
    const { codigo, participante: maria } = await criar()
    const hora = 3_600_000
    const jogo = (id: number, daqui: number): Partida => ({
      id,
      rodada: 33,
      data: new Date(Date.now() + daqui).toISOString(),
      status: 'agendada',
      mandanteId: 1,
      visitanteId: 2,
      golsMandante: null,
      golsVisitante: null,
      golsMandanteIntervalo: null,
      golsVisitanteIntervalo: null,
      temResultado: false,
    })
    jogos = [jogo(10, -hora), jogo(11, hora)]
    const gravar = (palpites: Record<number, { mandante: number; visitante: number }>) =>
      pedir('PUT', `/api/salas/${codigo}/participantes/${maria.id}/palpites`, {
        conta: 'maria',
        corpo: { palpites: codificarPalpites(palpites) ?? '' },
      })

    // O jogo 10 já começou: não dá para incluir palpite nele; no 11 (daqui a uma hora), dá.
    expect((await gravar({ 10: { mandante: 2, visitante: 1 } })).status).toBe(409)
    expect((await gravar({ 11: { mandante: 1, visitante: 1 } })).status).toBe(204)

    // Com um palpite já guardado no 10 (de antes de começar), ele não pode mudar nem sumir.
    sqlite.prepare('UPDATE participantes SET palpites = ? WHERE id = ?').run(codificarPalpites({ 10: { mandante: 2, visitante: 1 } })!, maria.id)
    expect((await gravar({ 10: { mandante: 3, visitante: 0 } })).status).toBe(409)
    expect((await gravar({ 11: { mandante: 0, visitante: 0 } })).status).toBe(409)
    expect((await gravar({ 10: { mandante: 2, visitante: 1 }, 11: { mandante: 0, visitante: 0 } })).status).toBe(204)
    expect(decodificarPalpites((await ver(codigo)).sala.participantes[0].palpites)).toEqual({
      10: { mandante: 2, visitante: 1 },
      11: { mandante: 0, visitante: 0 },
    })

    // Sem os dados dos jogos, não grava às cegas.
    dadosForaDoAr = true
    expect((await gravar({ 10: { mandante: 2, visitante: 1 } })).status).toBe(503)
  })

  it('a conta descobre quem é na sala e lista as suas salas', async () => {
    const a = await criar('maria', 'Sala A')
    const b = await criar('lucas', 'Sala B', 'Lucas')
    await entrar(b.codigo, 'maria', 'Maria')

    const eu = await pedir('GET', `/api/salas/${a.codigo}/eu`, { conta: 'maria' })
    expect(await eu.json()).toEqual({ id: a.participante.id, nome: 'Maria' })
    expect((await pedir('GET', `/api/salas/${a.codigo}/eu`, { conta: 'lucas' })).status).toBe(404)

    await pedir('PUT', `/api/salas/${a.codigo}/participantes/${a.participante.id}/palpites`, { conta: 'maria', corpo: { palpites: '1.a-21' } })
    const minhas = (await (await pedir('GET', '/api/salas', { conta: 'maria' })).json()) as {
      codigo: string
      meusPalpites: string
      pessoas: { id: number; nome: string; cor: number; palpites: string }[]
    }[]
    expect(minhas.map((s) => s.codigo).sort()).toEqual([a.codigo, b.codigo].sort())
    expect(minhas.find((s) => s.codigo === b.codigo)?.pessoas).toEqual([
      { id: b.participante.id, nome: 'Lucas', cor: 0, palpites: '' },
      { id: expect.any(Number), nome: 'Maria', cor: 1, palpites: '' },
    ])
    expect(minhas.find((s) => s.codigo === a.codigo)).toMatchObject({ temporada: 2026, meuId: a.participante.id })
    expect(minhas.find((s) => s.codigo === a.codigo)?.meusPalpites).toBe('1.a-21')
  })

  it('liga à conta a participação de antes do login, pela chave antiga', async () => {
    const { codigo } = await criar()
    // Participação antiga: só a chave, sem conta.
    const chave = 'chave-antiga-do-navegador-123456'
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(chave)))]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    sqlite
      .prepare("INSERT INTO participantes (sala, nome, cor, dono, chave_hash, palpites, entrou_em, atualizado_em) VALUES (?, 'Kauan', 1, 0, ?, '1.a-10', 'x', 'x')")
      .run(codigo, hash)

    const ligada = await pedir('POST', `/api/salas/${codigo}/vincular`, { conta: 'kauan', chaveSala: chave })
    expect(ligada.status).toBe(200)
    const { id } = (await ligada.json()) as { id: number }
    // Agora a conta do Kauan grava nessa participação, e os palpites antigos continuam lá.
    expect((await ver(codigo)).sala.participantes.find((p) => p.id === id)?.palpites).toBe('1.a-10')
    expect((await pedir('PUT', `/api/salas/${codigo}/participantes/${id}/palpites`, { conta: 'kauan', corpo: { palpites: '1.a-11' } })).status).toBe(204)
    // Outra conta não consegue pegar a mesma participação.
    expect((await pedir('POST', `/api/salas/${codigo}/vincular`, { conta: 'outro', chaveSala: chave })).status).toBe(409)
    // Chave errada.
    expect((await pedir('POST', `/api/salas/${codigo}/vincular`, { conta: 'kauan', chaveSala: 'x'.repeat(30) })).status).toBe(404)
  })

  it('só o dono remove outros; se o dono sai, quem entrou primeiro vira dono; sala vazia some', async () => {
    const { codigo, participante: maria } = await criar()
    const lucas = (await entrar(codigo, 'lucas', 'Lucas')).dados
    const bia = (await entrar(codigo, 'bia', 'Bia')).dados
    const tirar = (id: number, conta: string) => pedir('DELETE', `/api/salas/${codigo}/participantes/${id}`, { conta })

    expect((await tirar(bia.id, 'lucas')).status).toBe(403)
    expect((await tirar(bia.id, 'maria')).status).toBe(204)
    expect((await tirar(maria.id, 'maria')).status).toBe(204)
    expect((await ver(codigo)).sala.participantes).toEqual([expect.objectContaining({ nome: 'Lucas', dono: true })])
    expect((await tirar(lucas.id, 'lucas')).status).toBe(204)
    expect((await ver(codigo)).status).toBe(404)
  })

  it('responde 304 quando nada mudou e aceita o código com traço', async () => {
    const { codigo, participante } = await criar()
    const { etag } = await ver(codigo)
    expect((await pedir('GET', `/api/salas/${codigo}`, { etag: etag! })).status).toBe(304)
    await new Promise((r) => setTimeout(r, 5))
    await pedir('PUT', `/api/salas/${codigo}/participantes/${participante.id}/palpites`, { conta: 'maria', corpo: { palpites: '1.a-00' } })
    expect((await pedir('GET', `/api/salas/${codigo}`, { etag: etag! })).status).toBe(200)
    expect((await ver(`${codigo.slice(0, 3).toLowerCase()}-${codigo.slice(3)}`)).status).toBe(200)
    expect(normalizarCodigo('K0P2QX')).toBeNull()
  })

  it('a tarefa diária apaga só as salas paradas há mais de 60 dias', async () => {
    const parada = await criar('maria', 'Parada')
    const ativa = await criar('maria', 'Ativa')
    sqlite.prepare('UPDATE salas SET atualizada_em = ? WHERE codigo = ?').run('2026-01-01T00:00:00.000Z', parada.codigo)
    await apagarSalasParadas(db, new Date('2026-10-06T00:00:00Z'))
    expect((await ver(parada.codigo)).status).toBe(404)
    expect((await ver(ativa.codigo)).status).toBe(200)
  })
})

describe('/api/eu', () => {
  it('guarda o time do coração da conta', async () => {
    expect((await pedir('GET', '/api/eu')).status).toBe(401)
    expect(await (await pedir('GET', '/api/eu', { conta: 'maria' })).json()).toEqual({ meuTime: null })
    expect((await pedir('PUT', '/api/eu', { conta: 'maria', corpo: { meuTime: 1765 } })).status).toBe(204)
    expect(await (await pedir('GET', '/api/eu', { conta: 'maria' })).json()).toEqual({ meuTime: 1765 })
    expect((await pedir('PUT', '/api/eu', { conta: 'maria', corpo: { meuTime: 'flamengo' } })).status).toBe(400)
    expect((await pedir('PUT', '/api/eu', { conta: 'maria', corpo: { meuTime: null } })).status).toBe(204)
    expect(await (await pedir('GET', '/api/eu', { conta: 'maria' })).json()).toEqual({ meuTime: null })
  })

  it('mudar o nome muda nas salas em que a pessoa está', async () => {
    const { codigo } = await criar()
    await pedir('PUT', '/api/eu', { conta: 'maria', corpo: { nome: 'Maria Clara' } })
    expect((await ver(codigo)).sala.participantes[0].nome).toBe('Maria Clara')
  })

  it('apagar a conta tira a pessoa de todas as salas e apaga as preferências', async () => {
    const a = await criar('maria', 'Sala A')
    const b = await criar('lucas', 'Sala B', 'Lucas')
    await entrar(b.codigo, 'maria', 'Maria')
    await pedir('PUT', '/api/eu', { conta: 'maria', corpo: { meuTime: 10 } })

    expect((await pedir('DELETE', '/api/eu', { conta: 'maria' })).status).toBe(204)
    expect((await ver(a.codigo)).status).toBe(404) // a Maria estava sozinha
    expect((await ver(b.codigo)).sala.participantes.map((p) => p.nome)).toEqual(['Lucas'])
    expect(sqlite.prepare("SELECT COUNT(*) AS n FROM usuarios WHERE uid = 'maria'").get()).toEqual({ n: 0 })
  })
})
