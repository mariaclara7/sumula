import { lerEu } from '../api/eu'
import { minhasSalasDaConta, quemSou, type Sala } from '../api/salas'
import { decodificarPalpites } from '../util/compartilhar'
import type { Usuario } from './conta'

/**
 * Tudo o que a BraSúmula guarda sobre a conta, num arquivo .json (direito de acesso e portabilidade da LGPD):
 * os dados da conta no Firebase, o time do coração e, em cada sala, o nome com que a pessoa aparece e os palpites.
 */
export async function baixarMeusDados(usuario: Usuario) {
  const [{ meuTime }, salas] = await Promise.all([lerEu(), minhasSalasDaConta()])
  const detalhes = await Promise.all(
    salas.map(async (s) => {
      const [meuId, sala] = await Promise.all([
        quemSou(s.codigo),
        fetch(`/api/salas/${s.codigo}`, { cache: 'no-store' }).then((r) => r.json() as Promise<Sala>),
      ])
      const eu = sala.participantes.find((p) => p.id === meuId)
      return {
        codigo: s.codigo,
        sala: s.nome,
        nomeNaSala: eu?.nome ?? null,
        criouASala: eu?.dono ?? false,
        // Palpite por id da partida: { mandante, visitante } (gols).
        palpites: decodificarPalpites(eu?.palpites || null) ?? {},
      }
    }),
  )

  const dados = {
    geradoEm: new Date().toISOString(),
    conta: {
      nome: usuario.nome,
      email: usuario.email,
      emailConfirmado: usuario.emailConfirmado,
      entraCom: [usuario.comGoogle && 'Google', usuario.comSenha && 'e-mail e senha'].filter(Boolean),
      guardadaEm: 'Firebase Authentication (Google); a senha nunca chega à BraSúmula',
    },
    timeDoCoracao: meuTime,
    salas: detalhes,
  }

  const arquivo = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(arquivo)
  const link = document.createElement('a')
  link.href = url
  link.download = `brasumula-meus-dados-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
