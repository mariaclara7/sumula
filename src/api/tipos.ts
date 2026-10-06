// Formatos das respostas da api-sumula.

export type Time = {
  id: number
  nome: string
  nomeCurto: string
  sigla: string
  escudo: string | null
}

export type StatusPartida = 'agendada' | 'emAndamento' | 'encerrada' | 'adiada' | 'cancelada'

export type Resultado = 'vitoria' | 'empate' | 'derrota'

export type Partida = {
  id: number
  rodada: number
  data: string
  status: StatusPartida
  mandanteId: number
  visitanteId: number
  golsMandante: number | null
  golsVisitante: number | null
  golsMandanteIntervalo: number | null
  golsVisitanteIntervalo: number | null
  temResultado: boolean
}

export type LinhaClassificacao = {
  posicao: number
  time: Time
  pontos: number
  jogos: number
  vitorias: number
  empates: number
  derrotas: number
  golsPro: number
  golsContra: number
  saldo: number
  aproveitamento: number
  ultimosResultados: Resultado[]
}

export type Recorte = 'geral' | 'primeiroTurno' | 'segundoTurno'
export type Mando = 'todos' | 'casa' | 'fora'
export type Tempo = 'jogoTodo' | 'primeiroTempo' | 'segundoTempo'

export type Classificacao = {
  recorte: Recorte
  mando: Mando
  tempo: Tempo
  atualizadoEm: string | null
  linhas: LinhaClassificacao[]
}

export type PontoEvolucao = {
  rodada: number
  posicao: number
  pontos: number
}

export type EvolucaoTime = {
  timeId: number
  rodadas: PontoEvolucao[]
}

export type ResumoTime = {
  time: Time
  geral: LinhaClassificacao
  casa: LinhaClassificacao
  fora: LinhaClassificacao
  primeiroTurno: LinhaClassificacao
  segundoTurno: LinhaClassificacao
  evolucao: PontoEvolucao[]
  ultimasPartidas: Partida[]
  proximasPartidas: Partida[]
}

export type ResumoConfronto = {
  timeAId: number
  timeBId: number
  jogos: number
  vitoriasA: number
  empates: number
  vitoriasB: number
  golsA: number
  golsB: number
  partidas: Partida[]
}

export type ProbabilidadesTime = {
  time: Time
  posicaoAtual: number
  pontosAtuais: number
  pontosEsperados: number
  posicaoMedia: number
  /** Chance de terminar em cada posição; índice 0 = 1º lugar. */
  posicoes: number[]
}

export type ResultadoSimulacao = {
  simulacoes: number
  partidasRestantes: number
  times: ProbabilidadesTime[]
}

export type TransicaoIntervalo = {
  noIntervalo: Resultado
  noFinal: Resultado
  jogos: number
}

/** Gols por faixa de 15 minutos; índice 0 = 1–15 ... 5 = 76–90+. */
export type FaixasMinuto = {
  marcados: number[]
  sofridos: number[]
}

export type DesempenhoPorTempo = {
  time: Time
  jogos: number
  golsProPrimeiroTempo: number
  golsContraPrimeiroTempo: number
  golsProSegundoTempo: number
  golsContraSegundoTempo: number
  pontosNoIntervalo: number
  pontos: number
  pontosDepoisDoIntervalo: number
  viradasAFavor: number
  viradasContra: number
  pontosPerdidosVencendo: number
  pontosConquistadosPerdendo: number
  transicoes: TransicaoIntervalo[]
  /** Só existe quando a coleta usa os dados detalhados (gols com minuto). */
  faixas: FaixasMinuto | null
}

export type ResultadoTempos = {
  temFaixas: boolean
  rotulosFaixas: string[]
  times: DesempenhoPorTempo[]
}

export type Artilheiro = {
  jogadorId: number
  nome: string
  timeId: number
  jogos: number | null
  gols: number
  assistencias: number | null
  penaltis: number | null
}

export type Placar = {
  mandante: number
  visitante: number
}

/** Palpite da Súmula para um jogo que ainda não aconteceu. */
export type Palpite = {
  partidaId: number
  golsEsperadosMandante: number
  golsEsperadosVisitante: number
  vitoriaMandante: number
  empate: number
  vitoriaVisitante: number
  placarMaisProvavel: Placar
}

export type SituacaoMatematica = {
  time: Time
  posicao: number
  pontos: number
  jogosRestantes: number
  pontosMaximos: number
  melhorPosicaoPossivel: number
  piorPosicaoPossivel: number
  /** Índice k-1: total de pontos que garante terminar entre os k primeiros. */
  pontosParaGarantir: number[]
}

export type TipoSequencia = 'vitorias' | 'invencibilidade' | 'semVencer' | 'derrotas' | 'marcando' | 'semSofrerGol'

export type Sequencia = {
  tipo: TipoSequencia
  atual: number
  maior: number
}

export type PerfilGols = {
  jogos: number
  golsPro: number
  golsContra: number
  semSofrerGol: number
  semMarcar: number
  maisDeDoisGolsEMeio: number
  ambosMarcam: number
}

export type EstatisticasTime = {
  time: Time
  gols: PerfilGols
  sequencias: Sequencia[]
}

export type ResumoLiga = {
  jogos: number
  gols: number
  vitoriasMandante: number
  empates: number
  vitoriasVisitante: number
  maisDeDoisGolsEMeio: number
  ambosMarcam: number
}

export type ResultadoEstatisticas = {
  liga: ResumoLiga
  times: EstatisticasTime[]
}
