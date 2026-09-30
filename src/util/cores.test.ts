import { describe, expect, it } from 'vitest'
import { coresDoTime } from './cores'

describe('coresDoTime', () => {
  it('acha o time pelo nome curto, sem ligar para acento e maiúsculas', () => {
    expect(coresDoTime({ nomeCurto: 'São Paulo', nome: 'São Paulo FC' }).principal).toBe('#e8e8e8')
    expect(coresDoTime({ nomeCurto: 'GRÊMIO', nome: '' }).principal).toBe('#0a7fc2')
  })

  it('usa o nome completo e depois cores neutras', () => {
    expect(coresDoTime({ nomeCurto: 'Tricolor', nome: 'Fluminense' }).principal).toBe('#7a1f3d')
    expect(coresDoTime({ nomeCurto: 'Desconhecido', nome: 'Desconhecido FC' })).toEqual({
      principal: '#111111',
      secundaria: '#f2f1ec',
    })
  })
})
