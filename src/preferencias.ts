import { createContext, useContext } from 'react'

export type Tema = 'claro' | 'escuro'

export type Preferencias = {
  /** Tema em uso agora: o escolhido no botão ou, se nada foi escolhido, o do sistema. */
  tema: Tema
  alternarTema: () => void
  /** Time destacado nas tabelas. */
  meuTime: number | null
  escolherMeuTime: (timeId: number | null) => void
}

export const CHAVE_TEMA = 'sumula:tema'
export const CHAVE_MEU_TIME = 'sumula:meu-time'

export const ContextoPreferencias = createContext<Preferencias>({
  tema: 'claro',
  alternarTema: () => {},
  meuTime: null,
  escolherMeuTime: () => {},
})

export function usePreferencias() {
  return useContext(ContextoPreferencias)
}

/** localStorage pode falhar (aba anônima, cookies bloqueados); aí a escolha só vale até recarregar. */
export function lerArmazenado(chave: string) {
  try {
    return localStorage.getItem(chave)
  } catch {
    return null
  }
}

export function gravarArmazenado(chave: string, valor: string | null) {
  try {
    if (valor === null) localStorage.removeItem(chave)
    else localStorage.setItem(chave, valor)
  } catch {
    // Sem armazenamento, segue só na memória.
  }
}
