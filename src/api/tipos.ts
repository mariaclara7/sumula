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

export type Classificacao = {
  recorte: Recorte
  mando: Mando
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

export type Artilheiro = {
  jogadorId: number
  nome: string
  timeId: number
  jogos: number | null
  gols: number
  assistencias: number | null
  penaltis: number | null
}
