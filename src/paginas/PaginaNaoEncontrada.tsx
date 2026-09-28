import { Link } from 'react-router'

export function PaginaNaoEncontrada() {
  return (
    <div className="py-16 text-center">
      <h1 className="mb-2 text-2xl font-bold">Página não encontrada</h1>
      <Link to="/" className="text-destaque hover:underline">
        Voltar para a classificação
      </Link>
    </div>
  )
}
