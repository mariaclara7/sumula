import { pedirApi } from './salas'

/** O que a BraSúmula guarda da conta (worker/eu.ts): por enquanto, o time do coração. */
export function lerEu() {
  return pedirApi<{ meuTime: number | null }>('GET', '/api/eu')
}

export function gravarEu(dados: { meuTime?: number | null; nome?: string }) {
  return pedirApi<void>('PUT', '/api/eu', { corpo: dados })
}

/** Apaga tudo da conta (salas e preferências). Recebe o token pronto porque é chamado logo depois de excluir a conta. */
export async function apagarEu(token: string) {
  const resposta = await fetch('/api/eu', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  if (!resposta.ok) throw new Error(`Apagar dados: ${resposta.status}`)
}
