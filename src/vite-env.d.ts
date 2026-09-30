/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Endereço dos dados. Vazio = mesma origem (proxy do Vite para a api-sumula em desenvolvimento). */
  readonly VITE_API_URL?: string
  /** "true" em produção: lê os arquivos .json pré-calculados em vez da API ao vivo. */
  readonly VITE_API_ESTATICA?: string
}
