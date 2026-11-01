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

/**
 * O ID token do Firebase de quem está logado (o Firebase renova sozinho quando vence). Vai em cada pedido que
 * mexe em sala; o servidor confere a assinatura.
 */
export async function tokenDaConta() {
  const { carregarAuth } = await import('../conta/firebase')
  const { auth } = await carregarAuth()
  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new ErroSala(401, 'Entre com a sua conta para fazer isso.')
  return token
}

export async function pedirApi<T>(
  metodo: string,
  endereco: string,
  { corpo, conta = true, extra = {} }: { corpo?: unknown; conta?: boolean; extra?: Record<string, string> } = {},
) {
  const headers: Record<string, string> = { ...extra }
  if (corpo !== undefined) headers['Content-Type'] = 'application/json'
  if (conta) headers.Authorization = `Bearer ${await tokenDaConta()}`

  let resposta: Response
  try {
    resposta = await fetch(endereco, {
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
  return pedirApi<{ codigo: string; participante: { id: number } }>('POST', BASE, { corpo: dados })
}

export function entrarNaSala(codigo: string, nome: string) {
  return pedirApi<{ id: number }>('POST', `${BASE}/${codigo}/participantes`, { corpo: { nome } })
}

/** O id da conta nesta sala, ou null se a conta não está nela. */
export async function quemSou(codigo: string) {
  try {
    return (await pedirApi<{ id: number; nome: string }>('GET', `${BASE}/${codigo}/eu`)).id
  } catch (erro) {
    if (erro instanceof ErroSala && erro.status === 404) return null
    throw erro
  }
}

/** Liga à conta a participação de antes do login (a chave que ficou neste navegador). */
export function vincularParticipacao(codigo: string, chave: string) {
  return pedirApi<{ id: number }>('POST', `${BASE}/${codigo}/vincular`, { extra: { 'X-Chave-Sala': chave } })
}

export type MinhaSala = { codigo: string; nome: string; meusPalpites: string; pessoas: { nome: string; cor: number }[] }

export function minhasSalasDaConta() {
  return pedirApi<MinhaSala[]>('GET', BASE)
}

export function gravarPalpitesNaSala(codigo: string, id: number, palpites: string) {
  return pedirApi<void>('PUT', `${BASE}/${codigo}/participantes/${id}/palpites`, { corpo: { palpites } })
}

export function sairOuRemover(codigo: string, id: number) {
  return pedirApi<void>('DELETE', `${BASE}/${codigo}/participantes/${id}`)
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
