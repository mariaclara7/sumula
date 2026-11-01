import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Layout } from './componentes/Layout'
import { ProvedorConta } from './conta/ProvedorConta'
import { SincronizarMeuTime } from './conta/SincronizarMeuTime'
import { ProvedorPreferencias } from './componentes/Preferencias'
import './index.css'
import { PaginaArtilharia } from './paginas/PaginaArtilharia'
import { PaginaChances } from './paginas/PaginaChances'
import { PaginaClassificacao } from './paginas/PaginaClassificacao'
import { PaginaConfronto } from './paginas/PaginaConfronto'
import { PaginaConta } from './paginas/PaginaConta'
import { PaginaEntrar } from './paginas/PaginaEntrar'
import { PaginaEstatisticas } from './paginas/PaginaEstatisticas'
import { PaginaEvolucao } from './paginas/PaginaEvolucao'
import { PaginaJogos } from './paginas/PaginaJogos'
import { PaginaNaoEncontrada } from './paginas/PaginaNaoEncontrada'
import { PaginaSala } from './paginas/PaginaSala'
import { PaginaSalas } from './paginas/PaginaSalas'
import { PaginaSimulador } from './paginas/PaginaSimulador'
import { PaginaTempos } from './paginas/PaginaTempos'
import { PaginaTime } from './paginas/PaginaTime'

// Os dados só mudam quando o coletor roda, então não precisa buscar de novo a todo momento.
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ProvedorPreferencias>
        <ProvedorConta>
          <SincronizarMeuTime />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<PaginaClassificacao />} />
              <Route path="times/:timeId" element={<PaginaTime />} />
              <Route path="jogos" element={<PaginaJogos />} />
              <Route path="simulador" element={<PaginaSimulador />} />
              <Route path="sala" element={<PaginaSalas />} />
              <Route path="sala/:codigo" element={<PaginaSala />} />
              <Route path="chances" element={<PaginaChances />} />
              <Route path="estatisticas" element={<PaginaEstatisticas />} />
              <Route path="evolucao" element={<PaginaEvolucao />} />
              <Route path="tempos" element={<PaginaTempos />} />
              <Route path="confronto" element={<PaginaConfronto />} />
              <Route path="artilharia" element={<PaginaArtilharia />} />
              <Route path="entrar" element={<PaginaEntrar modo="entrar" />} />
              <Route path="criar-conta" element={<PaginaEntrar modo="criar" />} />
              <Route path="esqueci-senha" element={<PaginaEntrar modo="esqueci" />} />
              <Route path="conta" element={<PaginaConta />} />
              <Route path="*" element={<PaginaNaoEncontrada />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </ProvedorConta>
      </ProvedorPreferencias>
    </QueryClientProvider>
  </StrictMode>,
)
