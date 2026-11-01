import { carregarAuth } from './firebase'

/** Para onde o link do e-mail (confirmação e nova senha) leva a pessoa depois. */
const voltarParaConta = () => ({ url: `${window.location.origin}/conta` })

export const TAMANHO_MINIMO_SENHA = 8

export async function criarConta(nome: string, email: string, senha: string) {
  const { auth, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } = await carregarAuth()
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), senha)
  await updateProfile(user, { displayName: nome.trim() })
  await sendEmailVerification(user, voltarParaConta())
}

export async function entrarComEmail(email: string, senha: string) {
  const { auth, signInWithEmailAndPassword } = await carregarAuth()
  await signInWithEmailAndPassword(auth, email.trim(), senha)
}

/** Abre a janela do Google. Contas do Google já vêm com o e-mail confirmado. */
export async function entrarComGoogle() {
  const { auth, GoogleAuthProvider, signInWithPopup } = await carregarAuth()
  const provedor = new GoogleAuthProvider()
  provedor.setCustomParameters({ prompt: 'select_account' })
  await signInWithPopup(auth, provedor)
}

/** Manda o e-mail com o link para criar uma senha nova. */
export async function esqueciSenha(email: string) {
  const { auth, sendPasswordResetEmail } = await carregarAuth()
  await sendPasswordResetEmail(auth, email.trim(), voltarParaConta())
}

export async function reenviarConfirmacao() {
  const { auth, sendEmailVerification } = await carregarAuth()
  if (auth.currentUser) await sendEmailVerification(auth.currentUser, voltarParaConta())
}

export async function mudarNome(nome: string) {
  const { auth, updateProfile } = await carregarAuth()
  if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: nome.trim() })
}

export async function sair() {
  const { auth, signOut } = await carregarAuth()
  await signOut(auth)
}

/**
 * Apaga a conta no Firebase. Exige um login recente: se faz tempo, o Firebase recusa com
 * auth/requires-recent-login e a pessoa precisa confirmar quem é de novo (senha ou Google) antes.
 */
export async function excluirConta() {
  const { auth, deleteUser } = await carregarAuth()
  if (auth.currentUser) await deleteUser(auth.currentUser)
}

/** Confirma quem é (senha ou Google) logo antes de uma ação sensível, como excluir a conta. */
export async function confirmarIdentidade(senha?: string) {
  const { auth, EmailAuthProvider, GoogleAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup } =
    await carregarAuth()
  const usuario = auth.currentUser
  if (!usuario) return
  if (senha !== undefined) {
    await reauthenticateWithCredential(usuario, EmailAuthProvider.credential(usuario.email ?? '', senha))
  } else {
    await reauthenticateWithPopup(usuario, new GoogleAuthProvider())
  }
}
