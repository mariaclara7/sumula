export type Parametros = Record<string, string | number | undefined>

/**
 * Endereço de um recurso da API.
 *
 * Ao vivo (desenvolvimento): `/api/BSA/2026/classificacao?mando=todos&recorte=geral`.
 * Pré-calculada (produção, VITE_API_ESTATICA=true): o arquivo gerado pelo Sumula.Exportador,
 * `/api/BSA/2026/classificacao__mando-todos__recorte-geral.json`.
 *
 * A regra do nome precisa ser igual à da api-sumula (RotasEstaticas.cs): parâmetros em ordem
 * alfabética da chave, cada um como `__chave-valor`.
 */
export function montarEndereco(
  competicao: string,
  temporada: number,
  caminho: string,
  parametros: Parametros = {},
  estatica = false,
) {
  const base = `/api/${competicao}/${temporada}${caminho}`
  const definidos = Object.entries(parametros)
    .filter((par): par is [string, string | number] => par[1] !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))

  if (estatica) return `${base}${definidos.map(([chave, valor]) => `__${chave}-${valor}`).join('')}.json`

  const busca = new URLSearchParams(definidos.map(([chave, valor]) => [chave, String(valor)]))
  return busca.size > 0 ? `${base}?${busca}` : base
}
