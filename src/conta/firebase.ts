import type { Auth } from 'firebase/auth'

/**
 * Configuração do app web no Firebase. Não é segredo: o Firebase foi feito para estes valores ficarem dentro do
 * site; quem protege as contas são os domínios autorizados e as regras do Firebase, não estes números.
 */
const CONFIG = {
  apiKey: 'AIzaSyDQDd3NScYJUtG1fgjIq-n4IOHs7VNNePY',
  authDomain: 'brasumula.firebaseapp.com',
  projectId: 'brasumula',
  appId: '1:364850286849:web:414d1a06c648c676ed4b00',
}

export type ModuloAuth = typeof import('firebase/auth') & { auth: Auth }

let carregando: Promise<ModuloAuth> | null = null

/**
 * O Firebase só é baixado quando o site já está na tela (é um pacote grande): quem só olha a tabela não espera por
 * ele. Todas as funções de conta passam por aqui.
 */
export function carregarAuth(): Promise<ModuloAuth> {
  carregando ??= Promise.all([import('firebase/app'), import('firebase/auth')]).then(([app, modulo]) => {
    const auth = modulo.getAuth(app.initializeApp(CONFIG))
    // E-mails do Firebase (confirmação, nova senha) e a janela do Google em português.
    auth.languageCode = 'pt-BR'
    return { ...modulo, auth }
  })
  return carregando
}
