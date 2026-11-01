/**
 * /api/eu: o que a BraSúmula guarda de cada conta (além do Firebase, que guarda nome, e-mail e senha).
 *
 *   GET    /api/eu   { meuTime }
 *   PUT    /api/eu   { meuTime?, nome? }   o nome vai para as salas em que a pessoa está
 *   DELETE /api/eu   apaga tudo da conta: as participações nas salas e as preferências (antes de excluir a conta)
 */
import { cabecalhos, ErroHttp, exigirConta, json, lerCorpo, lerNome, respostaDeErro, tirarDaSala, TAMANHO_NOME_PESSOA, type Contexto } from './salas'

export async function tratarEu(request: Request, ctx: Contexto): Promise<Response> {
  try {
    const conta = await exigirConta(request, ctx)
    const { db } = ctx
    const agora = new Date().toISOString()

    if (request.method === 'GET') {
      const linha = await db.prepare('SELECT meu_time FROM usuarios WHERE uid = ?').bind(conta.uid).first<{ meu_time: number | null }>()
      return json({ meuTime: linha?.meu_time ?? null })
    }

    if (request.method === 'PUT') {
      const corpo = await lerCorpo(request)
      const comandos = []
      if ('meuTime' in corpo) {
        const meuTime = corpo.meuTime
        if (meuTime !== null && !(Number.isInteger(meuTime) && (meuTime as number) > 0 && (meuTime as number) < 1e9))
          throw new ErroHttp(400, 'Time inválido.')
        comandos.push(
          db
            .prepare(
              `INSERT INTO usuarios (uid, meu_time, criado_em, atualizado_em) VALUES (?, ?, ?, ?)
               ON CONFLICT (uid) DO UPDATE SET meu_time = excluded.meu_time, atualizado_em = excluded.atualizado_em`,
            )
            .bind(conta.uid, meuTime, agora, agora),
        )
      }
      if ('nome' in corpo) {
        const nome = lerNome(corpo.nome, TAMANHO_NOME_PESSOA, 'O nome')
        comandos.push(
          // Muda o nome nas salas e "toca" as salas, para os amigos verem o nome novo na próxima atualização.
          db.prepare('UPDATE salas SET atualizada_em = ? WHERE codigo IN (SELECT sala FROM participantes WHERE uid = ?)').bind(agora, conta.uid),
          db.prepare('UPDATE participantes SET nome = ? WHERE uid = ?').bind(nome, conta.uid),
        )
      }
      if (comandos.length) await db.batch(comandos)
      return new Response(null, { status: 204, headers: cabecalhos() })
    }

    if (request.method === 'DELETE') {
      const { results } = await db
        .prepare('SELECT id, sala, dono FROM participantes WHERE uid = ?')
        .bind(conta.uid)
        .all<{ id: number; sala: string; dono: number }>()
      for (const p of results) await db.batch(tirarDaSala(db, p.sala, p))
      await db.prepare('DELETE FROM usuarios WHERE uid = ?').bind(conta.uid).run()
      return new Response(null, { status: 204, headers: cabecalhos() })
    }

    throw new ErroHttp(405, 'Método não permitido.')
  } catch (erro) {
    return respostaDeErro(erro)
  }
}
