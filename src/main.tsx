import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Layout } from './componentes/Layout'
import './index.css'
import { PaginaArtilharia } from './paginas/PaginaArtilharia'
import { PaginaChances } from './paginas/PaginaChances'
import { PaginaClassificacao } from './paginas/PaginaClassificacao'
import { PaginaConfronto } from './paginas/PaginaConfronto'
import { PaginaNaoEncontrada } from './paginas/PaginaNaoEncontrada'
import { PaginaTime } from './paginas/PaginaTime'

// Os dados só mudam quando o coletor roda, então não precisa buscar de novo a todo momento.
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<PaginaClassificacao />} />
            <Route path="times/:timeId" element={<PaginaTime />} />
            <Route path="chances" element={<PaginaChances />} />
            <Route path="confronto" element={<PaginaConfronto />} />
            <Route path="artilharia" element={<PaginaArtilharia />} />
            <Route path="*" element={<PaginaNaoEncontrada />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
