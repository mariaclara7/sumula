import { describe, expect, it } from 'vitest'
import { codigoPix, crc16, semAcentos } from './pix'

describe('código Pix (BR Code estático)', () => {
  it('reproduz o exemplo do manual do Banco Central', () => {
    // Exemplo de QR estático do manual do BR Code, com o mesmo CRC (1D3D).
    const exemplo =
      '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***6304'
    expect(crc16(exemplo)).toBe('1D3D')
    // Valor de referência do CRC-16/CCITT-FALSE.
    expect(crc16('123456789')).toBe('29B1')
  })

  it('monta os campos na ordem certa, com o valor quando houver', () => {
    const dados = { chave: '123e4567-e12b-12d1-a456-426655440000', nome: 'Fulano de Tal', cidade: 'BRASILIA' }
    const semValor = codigoPix(dados)
    expect(semValor.startsWith('000201265800')).toBe(true)
    expect(semValor).toContain('0136123e4567-e12b-12d1-a456-426655440000')
    expect(semValor).not.toContain('5405')
    expect(semValor).toMatch(/6304[0-9A-F]{4}$/)
    expect(crc16(semValor.slice(0, -4))).toBe(semValor.slice(-4))

    const comValor = codigoPix(dados, 10)
    expect(comValor).toContain('540510.00')
  })

  it('tira acentos e encurta nome e cidade até caber no tamanho do padrão', () => {
    expect(semAcentos('Maria Clara Adelmônico', 25)).toBe('Maria Clara Adelmonico')
    expect(semAcentos('São José dos Campos', 15)).toBe('Sao Jose Campos')
    expect(semAcentos('Maria Clara Albino Delmonico', 25)).toBe('Maria Clara A Delmonico')
    expect(semAcentos('Cornélio Procópio', 15)).toBe('C Procopio')
    expect(semAcentos('Florianópolis', 10)).toBe('Florianopo')
    expect(codigoPix({ chave: 'x', nome: 'Ção', cidade: 'Niterói' })).toContain('5903Cao6007Niteroi')
  })
})
