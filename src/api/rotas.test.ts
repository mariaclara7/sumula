import { describe, expect, it } from 'vitest'
import { montarEndereco } from './rotas'

// Os mesmos exemplos estão em api-sumula/tests/Sumula.Core.Tests/RotasEstaticasTests.cs: as duas regras precisam bater.
describe('montarEndereco', () => {
  it('sem parâmetros', () => {
    expect(montarEndereco('BSA', 2026, '/times')).toBe('/api/BSA/2026/times')
    expect(montarEndereco('BSA', 2026, '/times', {}, true)).toBe('/api/BSA/2026/times.json')
    expect(montarEndereco('BSA', 2026, '/times/1016', {}, true)).toBe('/api/BSA/2026/times/1016.json')
  })

  it('ordena os parâmetros pela chave nos dois modos', () => {
    const parametros = { tempo: 'jogoTodo', recorte: 'geral', mando: 'todos' }
    expect(montarEndereco('BSA', 2026, '/classificacao', parametros)).toBe(
      '/api/BSA/2026/classificacao?mando=todos&recorte=geral&tempo=jogoTodo',
    )
    expect(montarEndereco('BSA', 2026, '/classificacao', parametros, true)).toBe(
      '/api/BSA/2026/classificacao__mando-todos__recorte-geral__tempo-jogoTodo.json',
    )
    expect(montarEndereco('BSA', 2026, '/confronto', { timeB: 1001, timeA: 1000 }, true)).toBe(
      '/api/BSA/2026/confronto__timeA-1000__timeB-1001.json',
    )
  })

  it('ignora parâmetros sem valor', () => {
    expect(montarEndereco('BSA', 2026, '/partidas', { rodada: undefined })).toBe('/api/BSA/2026/partidas')
  })
})
