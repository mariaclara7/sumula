import { COMPETICAO, TEMPORADA } from '../config'

const URL_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export class ErroApi extends Error {
  readonly status: number

  constructor(status: number, mensagem: string) {
    super(mensagem)
    this.status = status
  }
}

/** Busca um recurso da competição atual, ex.: obter('/classificacao'). */
export async function obter<T>(caminho: string, parametros?: Record<string, string | number | undefined>) {
  const busca = new URLSearchParams()
  for (const [chave, valor] of Object.entries(parametros ?? {})) {
    if (valor !== undefined) busca.set(chave, String(valor))
  }

  const consulta = busca.size > 0 ? `?${busca}` : ''
  const resposta = await fetch(`${URL_BASE}/api/${COMPETICAO}/${TEMPORADA}${caminho}${consulta}`)

  if (!resposta.ok) {
    throw new ErroApi(resposta.status, `A API respondeu ${resposta.status} para ${caminho}`)
  }

  return (await resposta.json()) as T
}
