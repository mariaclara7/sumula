import { gravarArmazenado, lerArmazenado } from '../preferencias'

/** Quem a pessoa é numa sala: o id e a chave secreta que deixa mudar os próprios palpites. */
export type MinhaParticipacao = { id: number; chave: string; nomeSala: string; entrouEm: string }

const CHAVE_SALAS = 'sumula:salas'

/** As salas em que a pessoa está neste navegador, pelo código. */
export function lerMinhasSalas(): Record<string, MinhaParticipacao> {
  try {
    const dados: unknown = JSON.parse(lerArmazenado(CHAVE_SALAS) ?? '{}')
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return {}
    return Object.fromEntries(
      Object.entries(dados).filter(
        ([, p]) => p && typeof p.id === 'number' && typeof p.chave === 'string' && typeof p.nomeSala === 'string',
      ),
    ) as Record<string, MinhaParticipacao>
  } catch {
    return {}
  }
}

export function guardarParticipacao(codigo: string, participacao: MinhaParticipacao) {
  gravarArmazenado(CHAVE_SALAS, JSON.stringify({ ...lerMinhasSalas(), [codigo]: participacao }))
}

export function esquecerParticipacao(codigo: string) {
  const salas = lerMinhasSalas()
  delete salas[codigo]
  gravarArmazenado(CHAVE_SALAS, Object.keys(salas).length ? JSON.stringify(salas) : null)
}

/** "K7P2QX" -> "K7P-2QX", mais fácil de ler e ditar. */
export function formatarCodigo(codigo: string) {
  return `${codigo.slice(0, 3)}-${codigo.slice(3)}`
}

/** O que a pessoa digitou ("k7p 2qx", "brasumula.com.br/sala/K7P-2QX") -> "K7P2QX", ou null. */
export function lerCodigo(texto: string) {
  const ultimo = texto.trim().split('/').filter(Boolean).pop() ?? ''
  const codigo = ultimo.split(/[?#]/)[0].toUpperCase().replace(/[\s-]/g, '')
  return /^[2-9A-HJ-NP-Z]{6}$/.test(codigo) ? codigo : null
}

/** Cor de cada pessoa na sala, pela ordem de chegada (a mesma em toda a tela). */
export const CORES_PARTICIPANTES = [
  { fundo: '#c6f432', texto: '#111111' },
  { fundo: '#2f6bff', texto: '#ffffff' },
  { fundo: '#e5484d', texto: '#ffffff' },
  { fundo: '#e9a23b', texto: '#111111' },
  { fundo: '#1f9d55', texto: '#ffffff' },
]

export function corDoParticipante(cor: number) {
  return CORES_PARTICIPANTES[cor] ?? CORES_PARTICIPANTES[0]
}

/** "Maria Clara" -> "MC", "Lucas" -> "LU". */
export function iniciais(nome: string) {
  const palavras = nome.trim().split(/\s+/).filter(Boolean)
  if (palavras.length === 0) return '?'
  const letras = palavras.length > 1 ? [palavras[0][0], palavras[palavras.length - 1][0]] : [...palavras[0]].slice(0, 2)
  return letras.join('').toUpperCase()
}
