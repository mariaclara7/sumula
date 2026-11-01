/**
 * Confere o "ID token" que o Firebase entrega a quem entrou no site (um JWT assinado pelo Google com RS256).
 * Sem biblioteca: a WebCrypto do Worker faz a verificação da assinatura com as chaves públicas do Google.
 *
 * O token só vale se: a assinatura bate com uma chave atual do Google, é do nosso projeto (aud e iss), não
 * expirou e tem um usuário (sub). Ver https://firebase.google.com/docs/auth/admin/verify-id-tokens.
 */

export type Identidade = {
  uid: string
  nome: string
  emailConfirmado: boolean
}

export type VerificarToken = (token: string) => Promise<Identidade | null>

/** Chaves públicas pelo "kid" do cabeçalho do token. */
export type BuscarChaves = () => Promise<Map<string, CryptoKey>>

const URL_CHAVES = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
// Folga para relógios um pouco diferentes entre o Google e a Cloudflare.
const FOLGA_SEGUNDOS = 60

let cache: { chaves: Map<string, CryptoKey>; expira: number } | null = null

/** Busca as chaves públicas do Google e guarda pelo tempo que o próprio Google manda (Cache-Control). */
export const chavesDoGoogle: BuscarChaves = async () => {
  if (cache && cache.expira > Date.now()) return cache.chaves
  const resposta = await fetch(URL_CHAVES)
  if (!resposta.ok) throw new Error(`Chaves do Google: ${resposta.status}`)
  const { keys } = (await resposta.json()) as { keys: (JsonWebKey & { kid: string })[] }
  const chaves = new Map<string, CryptoKey>()
  for (const jwk of keys) {
    chaves.set(jwk.kid, await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']))
  }
  const maxAge = Number(resposta.headers.get('Cache-Control')?.match(/max-age=(\d+)/)?.[1] ?? 3600)
  cache = { chaves, expira: Date.now() + maxAge * 1000 }
  return chaves
}

function base64url(texto: string) {
  const base64 = texto.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(texto.length / 4) * 4, '=')
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

function lerJson(parte: string): Record<string, unknown> | null {
  try {
    const valor: unknown = JSON.parse(new TextDecoder().decode(base64url(parte)))
    return valor && typeof valor === 'object' ? (valor as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/** Devolve a função que confere tokens do projeto `projeto` (ex.: "brasumula"). null = token inválido. */
export function criarVerificador(projeto: string, buscarChaves: BuscarChaves = chavesDoGoogle, agora = () => Date.now()): VerificarToken {
  return async (token) => {
    const partes = token.split('.')
    if (partes.length !== 3) return null
    const [h, p, assinatura] = partes
    const cabecalho = lerJson(h)
    const dados = lerJson(p)
    if (!cabecalho || !dados || cabecalho.alg !== 'RS256' || typeof cabecalho.kid !== 'string') return null

    const segundos = agora() / 1000
    const exp = Number(dados.exp)
    const iat = Number(dados.iat)
    const sub = dados.sub
    if (dados.aud !== projeto || dados.iss !== `https://securetoken.google.com/${projeto}`) return null
    if (!(exp > segundos - FOLGA_SEGUNDOS) || !(iat < segundos + FOLGA_SEGUNDOS)) return null
    if (typeof sub !== 'string' || sub.length === 0 || sub.length > 128) return null

    const chave = (await buscarChaves()).get(cabecalho.kid)
    if (!chave) return null
    const valida = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', chave, base64url(assinatura), new TextEncoder().encode(`${h}.${p}`))
    if (!valida) return null

    return {
      uid: sub,
      nome: typeof dados.name === 'string' ? dados.name : '',
      emailConfirmado: dados.email_verified === true,
    }
  }
}
