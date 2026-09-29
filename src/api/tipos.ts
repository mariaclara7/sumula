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
