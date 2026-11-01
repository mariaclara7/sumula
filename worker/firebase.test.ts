import { beforeAll, describe, expect, it } from 'vitest'
import { criarVerificador } from './firebase'

// Um par de chaves RSA de teste faz o papel do Google: assina tokens no mesmo formato do Firebase.
let chaves: CryptoKeyPair
let outraChave: CryptoKeyPair
const AGORA = Date.parse('2026-11-01T12:00:00Z')

beforeAll(async () => {
  const algoritmo = { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }
  chaves = (await crypto.subtle.generateKey(algoritmo, true, ['sign', 'verify'])) as CryptoKeyPair
  outraChave = (await crypto.subtle.generateKey(algoritmo, true, ['sign', 'verify'])) as CryptoKeyPair
})

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const b64json = (dados: unknown) => b64(new TextEncoder().encode(JSON.stringify(dados)))

async function assinar(dados: Record<string, unknown>, { kid = 'chave-1', chave = chaves.privateKey, alg = 'RS256' } = {}) {
  const corpo = `${b64json({ alg, kid, typ: 'JWT' })}.${b64json(dados)}`
  const assinatura = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', chave, new TextEncoder().encode(corpo)))
  return `${corpo}.${b64(assinatura)}`
}

const segundos = AGORA / 1000
const valido = {
  iss: 'https://securetoken.google.com/brasumula',
  aud: 'brasumula',
  sub: 'uid-da-maria',
  iat: segundos - 100,
  exp: segundos + 3500,
  name: 'Maria Clara',
  email_verified: true,
}

const verificar = criarVerificador('brasumula', async () => new Map([['chave-1', chaves.publicKey]]), () => AGORA)

describe('verificação do token do Firebase', () => {
  it('aceita um token válido do projeto', async () => {
    expect(await verificar(await assinar(valido))).toEqual({ uid: 'uid-da-maria', nome: 'Maria Clara', emailConfirmado: true })
    expect(await verificar(await assinar({ ...valido, email_verified: false }))).toMatchObject({ emailConfirmado: false })
  })

  it('recusa token vencido, de outro projeto, sem usuário ou com data no futuro', async () => {
    expect(await verificar(await assinar({ ...valido, exp: segundos - 3600 }))).toBeNull()
    expect(await verificar(await assinar({ ...valido, aud: 'outro-projeto' }))).toBeNull()
    expect(await verificar(await assinar({ ...valido, iss: 'https://securetoken.google.com/outro' }))).toBeNull()
    expect(await verificar(await assinar({ ...valido, sub: '' }))).toBeNull()
    expect(await verificar(await assinar({ ...valido, iat: segundos + 3600 }))).toBeNull()
  })

  it('recusa assinatura de outra chave, chave desconhecida, outro algoritmo ou token adulterado', async () => {
    expect(await verificar(await assinar(valido, { chave: outraChave.privateKey }))).toBeNull()
    expect(await verificar(await assinar(valido, { kid: 'chave-que-nao-existe' }))).toBeNull()
    expect(await verificar(await assinar(valido, { alg: 'none' }))).toBeNull()

    // Troca o usuário no meio do token sem refazer a assinatura.
    const [h, , s] = (await assinar(valido)).split('.')
    expect(await verificar(`${h}.${b64json({ ...valido, sub: 'uid-de-outra-pessoa' })}.${s}`)).toBeNull()
    expect(await verificar('isso-nem-e-um-token')).toBeNull()
  })
})
