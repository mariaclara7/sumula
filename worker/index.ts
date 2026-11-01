import { tratarEu } from './eu'
import { criarVerificador } from './firebase'
import { apagarSalasParadas, tratarSalas } from './salas'

type Env = {
  /** Os arquivos do build (dist/). */
  ASSETS: Fetcher
  /** Banco D1 "sumula-salas". */
  DB: D1Database
  /** Projeto do Firebase cujas contas valem aqui (vars no wrangler.jsonc). */
  FIREBASE_PROJECT_ID: string
}

/**
 * O Worker do site. Só /api/* passa por aqui (run_worker_first no wrangler.jsonc); o resto é servido direto
 * dos arquivos do build, sem contar como requisição do Worker.
 */
export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    const ctx = { db: env.DB, verificar: criarVerificador(env.FIREBASE_PROJECT_ID) }
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
