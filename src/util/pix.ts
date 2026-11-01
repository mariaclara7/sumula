/**
 * Código "Pix copia e cola" (BR Code estático), no formato EMV do Manual de Padrões para Iniciação do Pix, do Banco
 * Central. O mesmo texto vira o QR Code. É estático: qualquer pessoa paga quanto quiser (ou o valor sugerido), e o
 * dinheiro cai direto na conta da chave; o site não fica sabendo de nada.
 */

export type DadosPix = {
  /** Chave Pix (de preferência a aleatória, para não expor CPF, telefone ou e-mail). */
  chave: string
  /** Nome de quem recebe, como no banco (até 25 letras). */
  nome: string
  /** Cidade de quem recebe (até 15 letras). */
  cidade: string
}

/** Cada campo é: id (2 dígitos) + tamanho (2 dígitos) + valor. */
function campo(id: string, valor: string) {
  if (valor.length > 99) throw new Error(`Campo ${id} do Pix grande demais`)
  return `${id}${String(valor.length).padStart(2, '0')}${valor}`
}

/** O padrão aceita só letras sem acento e alguns símbolos nos campos de nome e cidade. */
export function semAcentos(texto: string, maximo: number) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 .,\-/]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maximo)
}

/** CRC16-CCITT (polinômio 0x1021, começando em 0xFFFF), em 4 dígitos hexadecimais maiúsculos. */
export function crc16(texto: string) {
  let crc = 0xffff
  for (const byte of new TextEncoder().encode(texto)) {
    crc ^= byte << 8
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/** O código completo. `valor` em reais (ex.: 10 → "10.00"); sem valor, a pessoa digita no app do banco. */
export function codigoPix({ chave, nome, cidade }: DadosPix, valor?: number) {
  const conta = campo('00', 'br.gov.bcb.pix') + campo('01', chave.trim())
  const corpo =
    campo('00', '01') +
    campo('26', conta) +
    campo('52', '0000') +
    campo('53', '986') +
    (valor && valor > 0 ? campo('54', valor.toFixed(2)) : '') +
    campo('58', 'BR') +
    campo('59', semAcentos(nome, 25)) +
    campo('60', semAcentos(cidade, 15)) +
    // Identificador da transação: "***" no Pix estático.
    campo('62', campo('05', '***'))
  const semCrc = `${corpo}6304`
  return semCrc + crc16(semCrc)
}
