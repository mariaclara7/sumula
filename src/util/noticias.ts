import type {
  Artilheiro,
  DesempenhoPorTempo,
  EstatisticasTime,
  LinhaClassificacao,
  Partida,
  ProbabilidadesTime,
  SituacaoMatematica,
  Time,
  TipoSequencia,
} from '../api/tipos'
import { ZONAS, chanceNaFaixa } from '../config'
import { formatarChance, formatarPercentual } from './formato'
import { ULTIMA_POSICAO_SEGURA, selosMatematicos } from './matematica'

/** Cor da etiqueta: lima (bom), vermelho (ruim), grafite (números) e azul (curiosidade, agenda). */
export type CorNoticia = 'lima' | 'vermelho' | 'grafite' | 'azul'

export type Noticia = {
  /** Identifica a notícia (tipo + assunto), para não repetir a mesma coisa. */
  id: string
  etiqueta: string
  cor: CorNoticia
  texto: string
  /** Para onde a notícia leva ao clicar. */
  link: string
  /** Quanto maior, mais cedo aparece. */
  peso: number
}

export type EntradaNoticias = {
  /** Tabela geral, em ordem de posição. */
  linhas: LinhaClassificacao[]
  estatisticas?: EstatisticasTime[]
  artilharia?: Artilheiro[]
  tempos?: DesempenhoPorTempo[]
  probabilidades?: ProbabilidadesTime[]
  matematica?: SituacaoMatematica[]
  /** Tabela só do 2º turno. */
  segundoTurno?: LinhaClassificacao[]
  /** Tabela "se os jogos acabassem no intervalo". */
  intervalo?: LinhaClassificacao[]
  partidas?: Partida[]
  times?: Map<number, Time>
  /** Momento de referência para "jogos recentes" e "próximo jogo". */
  agora?: Date
}

/*
 * Regras para nunca publicar notícia falsa:
 *  1. Só fatos que saem direto dos dados (resultados, tabela, artilharia, simulação). Nada de causa ou opinião.
 *  2. "O maior", "o melhor", "o que mais": só quando há um único dono. Empatou, a notícia não sai
 *     (a artilharia diz "dividem").
 *  3. Sequências vêm de todos os jogos da temporada, não só dos últimos 5.
 *  4. Chances sempre ditas como simulação, e "garantido" só pela conta conservadora da matemática.
 *  5. Fato de jogo (goleada, virada) só de jogos encerrados nos últimos 7 dias; agenda só de jogo que
 *     ainda não começou.
 *  6. Sem artigo antes de nome de time ("o"/"a"), que erraria em "a Chapecoense".
 */

const DIAS_RECENTES = 7
const MINIMO_SEQUENCIA = 3

const pluralJogos = (n: number) => (n === 1 ? '1 jogo' : `${n} jogos`)
const pluralPontos = (n: number) => (n === 1 ? '1 ponto' : `${n} pontos`)
const pluralGols = (n: number) => (n === 1 ? '1 gol' : `${n} gols`)

/** O item com o maior valor, só se ninguém empatar com ele. */
export function unicoMaior<T>(itens: T[], valor: (item: T) => number): T | undefined {
  const ordenados = [...itens].sort((a, b) => valor(b) - valor(a))
  if (ordenados.length === 0) return undefined
  if (ordenados.length > 1 && valor(ordenados[1]) === valor(ordenados[0])) return undefined
  return ordenados[0]
}

function sequencia(estatistica: EstatisticasTime, tipo: TipoSequencia) {
  return estatistica.sequencias.find((s) => s.tipo === tipo)?.atual ?? 0
}

/** Times com a sequência atual de pelo menos "minimo", da maior para a menor (empate: o mais bem colocado). */
export function emSequencia(
  estatisticas: EstatisticasTime[],
  linhas: LinhaClassificacao[],
  tipo: TipoSequencia,
  minimo = MINIMO_SEQUENCIA,
) {
  const porId = new Map(linhas.map((l) => [l.time.id, l]))
  return estatisticas
    .map((e) => ({ linha: porId.get(e.time.id), quantidade: sequencia(e, tipo) }))
    .filter((s): s is { linha: LinhaClassificacao; quantidade: number } => s.linha !== undefined && s.quantidade >= minimo)
    .sort((a, b) => b.quantidade - a.quantidade || a.linha.posicao - b.linha.posicao)
}

function ondeEsta(linha: LinhaClassificacao) {
  return linha.posicao === 1 ? 'lidera o campeonato' : `está em ${linha.posicao}º lugar`
}

const FUSO = 'America/Sao_Paulo'
const formatoDia = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, weekday: 'long' })
const formatoData = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, day: '2-digit', month: '2-digit' })
const formatoHora = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

/** "no sábado, 10/10, às 16h" / "na quinta, 08/10, às 19h30" (horário de Brasília). */
export function quandoSera(iso: string) {
  const data = new Date(iso)
  const dia = formatoDia.format(data).split('-')[0]
  const artigo = dia === 'sábado' || dia === 'domingo' ? 'no' : 'na'
  const [hora, minuto] = formatoHora.format(data).split(':')
  return `${artigo} ${dia}, ${formatoData.format(data)}, às ${Number(hora)}h${minuto === '00' ? '' : minuto}`
}

export function gerarNoticias(entrada: EntradaNoticias): Noticia[] {
  const { linhas, estatisticas = [], artilharia = [], tempos = [], probabilidades = [], matematica = [] } = entrada
  const noticias: Noticia[] = []
  const adicionar = (noticia: Noticia) => {
    if (!noticias.some((n) => n.id === noticia.id)) noticias.push(noticia)
  }
  const linhaDe = new Map(linhas.map((l) => [l.time.id, l]))

  // Sequências (de todos os jogos, não só dos 5 últimos).
  const vencendo = emSequencia(estatisticas, linhas, 'vitorias')
  vencendo.slice(0, 2).forEach(({ linha, quantidade }) =>
    adicionar({
      id: `vitorias-${linha.time.id}`,
      etiqueta: 'EMBALADO',
      cor: 'lima',
      texto: `${linha.time.nomeCurto} vence o ${quantidade}º jogo seguido e ${ondeEsta(linha)}`,
      link: `/times/${linha.time.id}`,
      peso: 60 + quantidade * 5,
    }),
  )
  const perdendo = emSequencia(estatisticas, linhas, 'derrotas')
  perdendo.slice(0, 2).forEach(({ linha, quantidade }) =>
    adicionar({
      id: `derrotas-${linha.time.id}`,
      etiqueta: 'ALERTA',
      cor: 'vermelho',
      texto: `${linha.time.nomeCurto} perde a ${quantidade}ª seguida e ${ondeEsta(linha)}`,
      link: `/times/${linha.time.id}`,
      peso: 60 + quantidade * 5,
    }),
  )
  // Invencibilidade e jejum só quando dizem algo além da sequência de vitórias/derrotas do mesmo time.
  const [invicto] = emSequencia(estatisticas, linhas, 'invencibilidade', 6).filter(
    (s) => !vencendo.some((v) => v.linha.time.id === s.linha.time.id && v.quantidade === s.quantidade),
  )
  if (invicto)
    adicionar({
      id: `invicto-${invicto.linha.time.id}`,
      etiqueta: 'INVICTO',
      cor: 'lima',
      texto: `${invicto.linha.time.nomeCurto} está há ${invicto.quantidade} jogos sem perder e ${ondeEsta(invicto.linha)}`,
      link: `/times/${invicto.linha.time.id}`,
      peso: 50 + invicto.quantidade * 3,
    })
  const [jejum] = emSequencia(estatisticas, linhas, 'semVencer', 6).filter(
    (s) => !perdendo.some((p) => p.linha.time.id === s.linha.time.id && p.quantidade === s.quantidade),
  )
  if (jejum)
    adicionar({
      id: `jejum-${jejum.linha.time.id}`,
      etiqueta: 'JEJUM',
      cor: 'vermelho',
      texto: `${jejum.linha.time.nomeCurto} está há ${jejum.quantidade} jogos sem vencer e ${ondeEsta(jejum.linha)}`,
      link: `/times/${jejum.linha.time.id}`,
      peso: 50 + jejum.quantidade * 3,
    })

  // Artilharia.
  const porGols = [...artilharia].sort((a, b) => b.gols - a.gols)
  const [artilheiro, segundo] = porGols
  if (artilheiro && artilheiro.gols > 0) {
    const vantagem = segundo ? artilheiro.gols - segundo.gols : artilheiro.gols
    const empatados = porGols.filter((a) => a.gols === artilheiro.gols)
    adicionar({
      id: 'artilharia',
      etiqueta: 'ARTILHARIA',
      cor: 'grafite',
      texto:
        vantagem > 0
          ? `${artilheiro.nome} chega a ${artilheiro.gols} gols e abre ${vantagem} de vantagem na artilharia`
          : empatados.length === 2
            ? `${empatados[0].nome} e ${empatados[1].nome} dividem a artilharia com ${artilheiro.gols} gols`
            : `${empatados.length} jogadores dividem a artilharia com ${artilheiro.gols} gols`,
      link: '/artilharia',
      peso: 45,
    })
  }
  // Pênaltis: a lista corta nos 100 primeiros em gols, então só vale se ninguém de fora puder ter mais.
  const menorGolsDaLista = porGols.at(-1)?.gols ?? 0
  const batedor = unicoMaior(
    artilharia.filter((a) => (a.penaltis ?? 0) > 0),
    (a) => a.penaltis ?? 0,
  )
  const penaltis = batedor?.penaltis ?? 0
  if (batedor && penaltis >= 3 && (artilharia.length < 100 || penaltis > menorGolsDaLista))
    adicionar({
      id: 'penaltis',
      etiqueta: 'PÊNALTI',
      cor: 'grafite',
      texto: `${batedor.nome} é quem mais marca de pênalti: ${penaltis} gols`,
      link: '/artilharia',
      peso: 20,
    })

  // Defesa e ataque (só com um único dono).
  const jogaram = linhas.filter((l) => l.jogos > 0)
  const muralha = jogaram.length > 1 ? unicoMaior(jogaram, (l) => -l.golsContra) : undefined
  if (muralha)
    adicionar({
      id: `defesa-${muralha.time.id}`,
      etiqueta: 'MURALHA',
      cor: 'grafite',
      texto: `${muralha.time.nomeCurto} tem a melhor defesa: ${pluralGols(muralha.golsContra)} sofridos em ${pluralJogos(muralha.jogos)}`,
      link: `/times/${muralha.time.id}`,
      peso: 30,
    })
  const ataque = jogaram.length > 1 ? unicoMaior(jogaram, (l) => l.golsPro) : undefined
  if (ataque)
    adicionar({
      id: `ataque-${ataque.time.id}`,
      etiqueta: 'ATAQUE',
      cor: 'lima',
      texto: `${ataque.time.nomeCurto} tem o melhor ataque: ${pluralGols(ataque.golsPro)} em ${pluralJogos(ataque.jogos)}`,
      link: `/times/${ataque.time.id}`,
      peso: 28,
    })

  // 1º x 2º tempo.
  const reiDaVirada = unicoMaior(tempos, (t) => t.viradasAFavor)
  if (reiDaVirada && reiDaVirada.viradasAFavor >= 2)
    adicionar({
      id: `virada-${reiDaVirada.time.id}`,
      etiqueta: 'VIRADA',
      cor: 'azul',
      texto: `${reiDaVirada.time.nomeCurto} é o time que mais vira no 2º tempo: ${reiDaVirada.viradasAFavor} jogos`,
      link: '/tempos',
      peso: 25,
    })
  const liderNoIntervalo = entrada.intervalo?.[0]
  if (liderNoIntervalo && linhas[0] && liderNoIntervalo.jogos > 0 && liderNoIntervalo.time.id !== linhas[0].time.id)
    adicionar({
      id: 'intervalo',
      etiqueta: 'INTERVALO',
      cor: 'azul',
      texto: `Se os jogos acabassem no intervalo, ${liderNoIntervalo.time.nomeCurto} seria o líder`,
      link: '/?tempo=primeiroTempo',
      peso: 22,
    })

  // 2º turno: só depois de 5 jogos, para não chamar de "melhor" quem jogou duas vezes.
  const returno = (entrada.segundoTurno ?? []).filter((l) => l.jogos >= 5)
  const melhorReturno = returno.length > 1 ? unicoMaior(returno, (l) => l.aproveitamento) : undefined
  if (melhorReturno) {
    const geral = linhaDe.get(melhorReturno.time.id)
    adicionar({
      id: `returno-${melhorReturno.time.id}`,
      etiqueta: '2º TURNO',
      cor: 'lima',
      texto: `${melhorReturno.time.nomeCurto} tem o melhor 2º turno: ${formatarPercentual(melhorReturno.aproveitamento)} de aproveitamento${geral ? ` (está em ${geral.posicao}º na geral)` : ''}`,
      link: '/?recorte=segundoTurno',
      peso: 32,
    })
  }

  // Briga por vagas: diferença de pontos na fronteira do G-4 e do Z-4.
  const libertadores = ZONAS.find((z) => z.nome === 'Libertadores')!
  const quarto = linhas[libertadores.ate - 1]
  const quinto = linhas[libertadores.ate]
  if (quarto && quinto && quinto.jogos > 0 && quarto.pontos - quinto.pontos <= 3)
    adicionar({
      id: 'g4',
      etiqueta: 'G-4',
      cor: 'azul',
      texto:
        quarto.pontos === quinto.pontos
          ? `${quinto.time.nomeCurto} tem os mesmos ${quinto.pontos} pontos de ${quarto.time.nomeCurto}, o 4º colocado`
          : `${quinto.time.nomeCurto} está a ${pluralPontos(quarto.pontos - quinto.pontos)} do G-4`,
      link: '/',
      peso: 34,
    })
  const ultimoSeguro = linhas[ULTIMA_POSICAO_SEGURA - 1]
  const primeiroNaZona = linhas[ULTIMA_POSICAO_SEGURA]
  if (ultimoSeguro && primeiroNaZona && primeiroNaZona.jogos > 0 && ultimoSeguro.pontos - primeiroNaZona.pontos <= 3)
    adicionar({
      id: 'z4',
      etiqueta: 'ZONA',
      cor: 'vermelho',
      texto:
        ultimoSeguro.pontos === primeiroNaZona.pontos
          ? `${primeiroNaZona.time.nomeCurto} abre o Z-4 com os mesmos ${primeiroNaZona.pontos} pontos de ${ultimoSeguro.time.nomeCurto}`
          : `${primeiroNaZona.time.nomeCurto} abre o Z-4, ${pluralPontos(ultimoSeguro.pontos - primeiroNaZona.pontos)} atrás de ${ultimoSeguro.time.nomeCurto}`,
      link: '/',
      peso: 34,
    })

  // Simulação: sempre dita como simulação.
  const titulo = unicoMaior(probabilidades, (p) => p.posicoes[0] ?? 0)
  const chanceTitulo = titulo?.posicoes[0] ?? 0
  if (titulo && chanceTitulo >= 0.5 && chanceTitulo < 1)
    adicionar({
      id: `simulacao-titulo-${titulo.time.id}`,
      etiqueta: 'SIMULAÇÃO',
      cor: 'lima',
      texto: `${titulo.time.nomeCurto} tem ${formatarChance(chanceTitulo)} de chance de título nas simulações da BraSúmula`,
      link: '/chances',
      peso: 36,
    })
  const zonaRebaixamento = ZONAS.find((z) => z.nome === 'Rebaixamento')!
  const ameacado = unicoMaior(probabilidades, (p) => chanceNaFaixa(p.posicoes, zonaRebaixamento))
  const chanceQueda = ameacado ? chanceNaFaixa(ameacado.posicoes, zonaRebaixamento) : 0
  if (ameacado && chanceQueda >= 0.5 && chanceQueda < 1)
    adicionar({
      id: `simulacao-queda-${ameacado.time.id}`,
      etiqueta: 'SIMULAÇÃO',
      cor: 'vermelho',
      texto: `${ameacado.time.nomeCurto} tem ${formatarChance(chanceQueda)} de chance de rebaixamento nas simulações da BraSúmula`,
      link: '/chances',
      peso: 36,
    })

  // Matemática: conta conservadora (nunca diz "garantido" antes da hora).
  const fraseMatematica: Record<string, (nome: string) => string> = {
    Campeão: (nome) => `${nome} é campeão brasileiro`,
    Rebaixado: (nome) => `${nome} está matematicamente rebaixado`,
    'Garantido na Libertadores': (nome) => `${nome} já tem vaga garantida na Libertadores`,
    'Garantido em copa continental': (nome) => `${nome} já garantiu vaga em copa continental`,
    'Livre do rebaixamento': (nome) => `${nome} está matematicamente livre do rebaixamento`,
  }
  for (const situacao of matematica) {
    const selo = selosMatematicos(situacao).find((s) => fraseMatematica[s.texto])
    if (!selo) continue
    adicionar({
      id: `matematica-${situacao.time.id}`,
      etiqueta: 'MATEMÁTICA',
      cor: selo.tom === 'ruim' ? 'vermelho' : 'lima',
      texto: fraseMatematica[selo.texto](situacao.time.nomeCurto),
      link: '/chances',
      peso: selo.texto === 'Livre do rebaixamento' ? 15 : 70,
    })
  }

  // Jogos recentes: goleada e virada dos últimos 7 dias.
  const agora = (entrada.agora ?? new Date()).getTime()
  const nome = (id: number) => entrada.times?.get(id)?.nomeCurto ?? linhaDe.get(id)?.time.nomeCurto
  const recentes = (entrada.partidas ?? []).filter((p) => {
    const quando = new Date(p.data).getTime()
    return (
      p.status === 'encerrada' &&
      p.golsMandante !== null &&
      p.golsVisitante !== null &&
      quando <= agora &&
      agora - quando <= DIAS_RECENTES * 24 * 3600 * 1000
    )
  })
  const diferenca = (p: Partida) => Math.abs(p.golsMandante! - p.golsVisitante!)
  const goleada = unicoMaior(recentes, diferenca)
  if (goleada && diferenca(goleada) >= 3) {
    const mandanteVenceu = goleada.golsMandante! > goleada.golsVisitante!
    const [vencedor, perdedor] = mandanteVenceu
      ? [goleada.mandanteId, goleada.visitanteId]
      : [goleada.visitanteId, goleada.mandanteId]
    const placar = mandanteVenceu
      ? `${goleada.golsMandante} x ${goleada.golsVisitante}`
      : `${goleada.golsVisitante} x ${goleada.golsMandante}`
    if (nome(vencedor) && nome(perdedor))
      adicionar({
        id: `goleada-${goleada.id}`,
        etiqueta: 'GOLEADA',
        cor: 'lima',
        texto: `${nome(vencedor)} goleia ${nome(perdedor)} por ${placar}${mandanteVenceu ? '' : ' fora de casa'}`,
        link: `/times/${vencedor}`,
        peso: 55,
      })
  }
  const virou = (p: Partida) =>
    p.golsMandanteIntervalo !== null &&
    p.golsVisitanteIntervalo !== null &&
    Math.sign(p.golsMandanteIntervalo - p.golsVisitanteIntervalo) * Math.sign(p.golsMandante! - p.golsVisitante!) === -1
  const virada = recentes.filter(virou).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0]
  if (virada) {
    const mandanteVirou = virada.golsMandante! > virada.golsVisitante!
    const [quemVirou, contra] = mandanteVirou ? [virada.mandanteId, virada.visitanteId] : [virada.visitanteId, virada.mandanteId]
    const noIntervalo = mandanteVirou
      ? `${virada.golsMandanteIntervalo} x ${virada.golsVisitanteIntervalo}`
      : `${virada.golsVisitanteIntervalo} x ${virada.golsMandanteIntervalo}`
    const final = mandanteVirou
      ? `${virada.golsMandante} x ${virada.golsVisitante}`
      : `${virada.golsVisitante} x ${virada.golsMandante}`
    if (nome(quemVirou) && nome(contra))
      adicionar({
        id: `virou-${virada.id}`,
        etiqueta: 'VIROU',
        cor: 'azul',
        texto: `${nome(quemVirou)} perdia por ${noIntervalo} no intervalo e venceu ${nome(contra)} por ${final}`,
        link: `/times/${quemVirou}`,
        peso: 52,
      })
  }

  // Agenda: o jogo entre os mais bem colocados da próxima rodada, entre os que ainda não começaram.
  const futuros = (entrada.partidas ?? []).filter((p) => p.status === 'agendada' && new Date(p.data).getTime() > agora)
  if (futuros.length > 0) {
    const proximaRodada = Math.min(...futuros.map((p) => p.rodada))
    const posicao = (id: number) => linhaDe.get(id)?.posicao ?? 99
    const soma = (p: Partida) => posicao(p.mandanteId) + posicao(p.visitanteId)
    const [grande] = futuros.filter((p) => p.rodada === proximaRodada).sort((a, b) => soma(a) - soma(b))
    if (grande && nome(grande.mandanteId) && nome(grande.visitanteId) && soma(grande) < 99)
      adicionar({
        id: `agenda-${grande.id}`,
        etiqueta: 'PRÓXIMA RODADA',
        cor: 'azul',
        texto: `${nome(grande.mandanteId)} (${posicao(grande.mandanteId)}º) x ${nome(grande.visitanteId)} (${posicao(grande.visitanteId)}º) ${quandoSera(grande.data)}`,
        link: `/confronto?a=${grande.mandanteId}&b=${grande.visitanteId}`,
        peso: 10,
      })
  }

  return noticias.sort((a, b) => b.peso - a.peso)
}
