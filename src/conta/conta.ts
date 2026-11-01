import { createContext, useContext } from 'react'

export type Usuario = {
  uid: string
  nome: string
  email: string
  emailConfirmado: boolean
  /** Entrou com e-mail e senha, com o Google, ou os dois. */
  comSenha: boolean
  comGoogle: boolean
}

export type EstadoConta = {
  /** true até o Firebase dizer se há alguém logado neste navegador. */
  carregando: boolean
  usuario: Usuario | null
  /** Lê de novo os dados do usuário (depois de confirmar o e-mail ou mudar o nome). */
  atualizar: () => Promise<void>
}

export const ContextoConta = createContext<EstadoConta>({ carregando: true, usuario: null, atualizar: async () => {} })

export function useConta() {
  return useContext(ContextoConta)
}

const ERROS: Record<string, string> = {
  'auth/email-already-in-use': 'Já existe uma conta com esse e-mail. Tente entrar, ou use "Esqueci a senha".',
  'auth/invalid-email': 'Esse e-mail não parece válido.',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/missing-password': 'Digite a senha.',
  'auth/weak-password': 'A senha precisa ter pelo menos 8 caracteres.',
  'auth/password-does-not-meet-requirements': 'A senha precisa ter pelo menos 8 caracteres.',
  'auth/too-many-requests': 'Muitas tentativas seguidas. Por segurança, espere alguns minutos e tente de novo.',
  'auth/network-request-failed': 'Sem conexão. Confira a internet e tente de novo.',
  'auth/popup-closed-by-user': 'A janela do Google foi fechada antes de terminar.',
  'auth/cancelled-popup-request': 'A janela do Google foi fechada antes de terminar.',
  'auth/popup-blocked': 'O navegador bloqueou a janela do Google. Permita pop-ups para este site e tente de novo.',
  'auth/account-exists-with-different-credential':
    'Esse e-mail já tem conta com senha. Entre com e-mail e senha; depois dá para usar o Google também.',
  'auth/requires-recent-login': 'Por segurança, entre de novo antes de fazer isso.',
  'auth/user-disabled': 'Essa conta foi desativada.',
  'auth/expired-action-code': 'Esse link expirou. Peça um novo.',
  'auth/invalid-action-code': 'Esse link não vale mais. Peça um novo.',
}

/** Mensagem em português para um erro do Firebase (os códigos vêm em inglês). */
export function mensagemDeErro(erro: unknown) {
  const codigo = (erro as { code?: string })?.code ?? ''
  return ERROS[codigo] ?? 'Algo deu errado. Tente de novo em instantes.'
}

/** Só deixa voltar para páginas do próprio site depois de entrar (nada de ?voltar=https://outro-site). */
export function destinoSeguro(voltar: string | null) {
  return voltar && voltar.startsWith('/') && !voltar.startsWith('//') ? voltar : '/'
}
