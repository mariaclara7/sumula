/** Campo de texto dos formulários de conta (entrar, criar conta, minha conta). Borda vermelha quando tem erro. */
export function classeCampo(comErro = false) {
  return `h-[50px] w-full border-2 bg-superficie px-3.5 text-[15px] font-medium text-texto transition-[border-color] duration-200 placeholder:text-texto-3 focus:outline-2 focus:outline-offset-2 focus:outline-lima ${
    comErro ? 'border-vermelho' : 'border-texto'
  }`
}
