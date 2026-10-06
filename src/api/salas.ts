import { useQuery } from '@tanstack/react-query'

/**
 * Cliente da API das salas (worker/salas.ts). Fica no mesmo endereço do site (/api/salas), não no dos dados.
 */

export type ParticipanteSala = {
  id: number
  nome: string
  /** 0 a 4: a cor da pessoa (CORES_PARTICIPANTES). */
  cor: number
  dono: boolean
  /** Palpites no formato do link de compartilhar (codificarPalpites); vazio se ainda não palpitou. */
  palpites: string
  atualizadoEm: string
}

export type Sala = {
  codigo: string
  nome: string
  competicao: string
  temporada: number
  criadaEm: string
  atualizadaEm: string
  participantes: ParticipanteSala[]
}

/** Erro com a mensagem que a API manda (já em português, pronta para mostrar). */
export class ErroSala extends Error {
  readonly status: number
  constructor(status: number, mensagem: string) {
    super(mensagem)
    this.status = status
  }
}

const BASE = '/api/salas'

async function pedir<T>(metodo: string, caminho: string, { corpo, chave }: { corpo?: unknown; chave?: string } = {}) {
  const headers: Record<string, string> = {}
  if (corpo !== undefined) headers['Content-Type'] = 'application/json'
  if (chave) headers.Authorization = `Bearer ${chave}`

  let resposta: Response
  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      method: metodo,
      headers,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    })
  } catch {
    throw new ErroSala(0, 'Sem conexão. Confira a internet e tente de novo.')
  }

  if (!resposta.ok) {
    const dados = (await resposta.json().catch(() => null)) as { erro?: string } | null
    throw new ErroSala(resposta.status, dados?.erro ?? 'Algo deu errado. Tente de novo em instantes.')
  }
  return (resposta.status === 204 ? undefined : await resposta.json()) as T
}

export function criarSala(dados: { nome: string; seuNome: string; competicao: string; temporada: number }) {
  return pedir<{ codigo: string; participante: { id: number; chave: string } }>('POST', '', { corpo: dados })
}

export function entrarNaSala(codigo: string, nome: string) {
  return pedir<{ id: number; chave: string }>('POST', `/${codigo}/participantes`, { corpo: { nome } })
}

export function quemSou(codigo: string, chave: string) {
  return pedir<{ id: number; nome: string }>('GET', `/${codigo}/eu`, { chave })
}

export function gravarPalpitesNaSala(codigo: string, id: number, chave: string, palpites: string) {
  return pedir<void>('PUT', `/${codigo}/participantes/${id}/palpites`, { corpo: { palpites }, chave })
}

export function sairOuRemover(codigo: string, id: number, chave: string) {
  return pedir<void>('DELETE', `/${codigo}/participantes/${id}`, { chave })
}

/** A cada quanto tempo a sala busca os palpites dos outros (só com a aba visível). */
const ATUALIZAR_A_CADA = 10_000

/**
 * A sala, atualizada sozinha enquanto a aba está aberta. Manda o ETag da última resposta: se nada mudou, a API
 * responde 304 sem corpo e fica a sala que já estava na tela.
 */
export function useSala(codigo: string) {
  return useQuery({
    queryKey: ['sala', codigo],
    queryFn: async ({ client, queryKey }) => {
      const anterior = client.getQueryData<{ sala: Sala; etag: string | null }>(queryKey)
      let resposta: Response
      try {
        resposta = await fetch(`${BASE}/${codigo}`, {
          headers: anterior?.etag ? { 'If-None-Match': anterior.etag } : {},
          cache: 'no-store',
        })
      } catch {
        throw new ErroSala(0, 'Sem conexão. Confira a internet e tente de novo.')
      }
      if (resposta.status === 304 && anterior) return anterior
      if (!resposta.ok) {
        const dados = (await resposta.json().catch(() => null)) as { erro?: string } | null
        throw new ErroSala(resposta.status, dados?.erro ?? 'Não foi possível abrir a sala.')
      }
      return { sala: (await resposta.json()) as Sala, etag: resposta.headers.get('ETag') }
    },
    select: (dados) => dados.sala,
    staleTime: 0,
    refetchInterval: ATUALIZAR_A_CADA,
    // Sala que não existe não volta a existir: não fica tentando.
    retry: (tentativas, erro) => !(erro instanceof ErroSala && erro.status === 404) && tentativas < 2,
  })
}
