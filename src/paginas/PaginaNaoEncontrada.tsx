import { Link } from 'react-router'
import { Pagina } from '../componentes/Pagina'
import { TituloPagina } from '../componentes/TituloPagina'

export function PaginaNaoEncontrada() {
  return (
    <Pagina className="pt-9 pb-16">
      <TituloPagina>Fora de jogo</TituloPagina>
      <p className="mt-4 text-[15px] text-texto-2">Esta página não existe.</p>
      <Link to="/" className="mt-3 inline-block font-bold text-destaque hover:underline">
        Voltar para a classificação →
      </Link>
    </Pagina>
  )
}
