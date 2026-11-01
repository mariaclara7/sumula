import { tratarEu } from './eu'
import { criarVerificador } from './firebase'
import type { Partida } from '../src/api/tipos'
import { montarEndereco } from '../src/api/rotas'
import { apagarSalasParadas, tratarSalas, type BuscarPartidas } from './salas'

type Env = {
  /** Os arquivos do build (dist/). */
  ASSETS: Fetcher
  /** Banco D1 "sumula-salas". */
  DB: D1Database
  /** Projeto do Firebase cujas contas valem aqui (vars no wrangler.jsonc). */
  FIREBASE_PROJECT_ID: string
  /** O Worker dos dados ("sumula-dados", o mesmo de dados.brasumula.com.br), por service binding. */
  DADOS: Fetcher
  /** Só para testar localmente: busca os dados neste endereço em vez do service binding. */
  DADOS_URL?: string
}

/** Quanto tempo os jogos buscados ficam guardados na memória do Worker. */
const GUARDAR_PARTIDAS_POR = 60_000
let guardadas: { chave: string; ate: number; partidas: Partida[] } | null = null

/** Os jogos da competição, dos mesmos arquivos que o site usa (guardados por um minuto). */
function buscarPartidas(env: Env): BuscarPartidas {
  return async (competicao, temporada) => {
    const caminho = montarEndereco(competicao, temporada, '/partidas', {}, true)
    if (guardadas?.chave === caminho && guardadas.ate > Date.now()) return guardadas.partidas
    let resposta: Response
    if (env.DADOS_URL) resposta = await fetch(env.DADOS_URL.replace(/\/$/, '') + caminho)
    else {
      // Pelo service binding; se ele falhar, pelo endereço público (os mesmos arquivos).
      const endereco = `https://dados.brasumula.com.br${caminho}`
      resposta = await env.DADOS.fetch(endereco).catch(() => fetch(endereco))
      if (!resposta.ok) resposta = await fetch(endereco)
    }
    if (!resposta.ok) throw new Error(`Dados dos jogos responderam ${resposta.status}`)
    const partidas: unknown = await resposta.json()
    if (!Array.isArray(partidas)) throw new Error('Dados dos jogos em formato inesperado')
    guardadas = { chave: caminho, ate: Date.now() + GUARDAR_PARTIDAS_POR, partidas: partidas as Partida[] }
    return guardadas.partidas
  }
}

/**
 * O Worker do site. Só /api/* passa por aqui (run_worker_first no wrangler.jsonc); o resto é servido direto
 * dos arquivos do build, sem contar como requisição do Worker.
 */
export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    const ctx = { db: env.DB, verificar: criarVerificador(env.FIREBASE_PROJECT_ID), partidas: buscarPartidas(env) }
    if (pathname === '/api/salas' || pathname.startsWith('/api/salas/')) return tratarSalas(request, ctx)
    if (pathname === '/api/eu') return tratarEu(request, ctx)
    if (pathname.startsWith('/api/')) return Response.json({ erro: 'Endereço não encontrado.' }, { status: 404 })
    return env.ASSETS.fetch(request)
  },

  // Uma vez por dia (triggers.crons no wrangler.jsonc).
  async scheduled(_controle, env) {
    await apagarSalasParadas(env.DB)
  },
} satisfies ExportedHandler<Env>
