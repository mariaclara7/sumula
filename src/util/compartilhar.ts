import type { LinhaClassificacao } from '../api/tipos'

export { codificarPalpites, decodificarPalpites } from './codigoPalpites'

/** Texto que acompanha o link: quem é campeão e quem cai na simulação. */
export function resumoDaSimulacao(tabela: LinhaClassificacao[], rebaixados: number) {
  const campeao = tabela[0]?.time.nomeCurto
  const caem = tabela
    .slice(-rebaixados)
    .map((l) => l.time.nomeCurto)
  if (!campeao) return 'Minha simulação do Brasileirão na Súmula'
  const lista = caem.length > 1 ? `${caem.slice(0, -1).join(', ')} e ${caem.at(-1)}` : caem.join('')
  // Sem artigo ("o"/"a") antes do nome: nem todo clube usa o mesmo.
  return `Minha simulação do Brasileirão: campeão ${campeao}${lista ? `; caem ${lista}` : ''}. Faça a sua:`
}
