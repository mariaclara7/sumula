/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Endereço da api-sumula em produção. Vazio = mesma origem (proxy do Vite em desenvolvimento). */
  readonly VITE_API_URL?: string
}
