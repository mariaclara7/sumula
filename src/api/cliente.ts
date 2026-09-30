import { COMPETICAO, TEMPORADA } from '../config'
import { montarEndereco, type Parametros } from './rotas'

const URL_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
/** Em produção os dados são arquivos pré-calculados (veja rotas.ts e o README). */
const API_ESTATICA = import.meta.env.VITE_API_ESTATICA === 'true'

export class ErroApi extends Error {
  readonly status: number

  constructor(status: number, mensagem: string) {
    super(mensagem)
    this.status = status
  }
}

/** Busca um recurso da competição atual, ex.: obter('/classificacao'). */
export async function obter<T>(caminho: string, parametros?: Parametros) {
  const resposta = await fetch(URL_BASE + montarEndereco(COMPETICAO, TEMPORADA, caminho, parametros, API_ESTATICA))

  if (!resposta.ok) {
    throw new ErroApi(resposta.status, `A API respondeu ${resposta.status} para ${caminho}`)
  }

  return (await resposta.json()) as T
}
