import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CHAVE_MEU_TIME,
  CHAVE_TEMA,
  ContextoPreferencias,
  gravarArmazenado,
  lerArmazenado,
  type Tema,
} from '../preferencias'

const consultaEscuro = '(prefers-color-scheme: dark)'

function lerTemaEscolhido(): Tema | null {
  const valor = lerArmazenado(CHAVE_TEMA)
  return valor === 'claro' || valor === 'escuro' ? valor : null
}

function lerMeuTime() {
  const id = Number(lerArmazenado(CHAVE_MEU_TIME))
  return Number.isInteger(id) && id > 0 ? id : null
}

export function ProvedorPreferencias({ children }: { children: React.ReactNode }) {
  const [temaEscolhido, setTemaEscolhido] = useState(lerTemaEscolhido)
  const [sistemaEscuro, setSistemaEscuro] = useState(() => window.matchMedia?.(consultaEscuro).matches ?? false)
  const [meuTime, setMeuTime] = useState(lerMeuTime)

  useEffect(() => {
    const consulta = window.matchMedia?.(consultaEscuro)
    if (!consulta) return
    const aoMudar = (evento: MediaQueryListEvent) => setSistemaEscuro(evento.matches)
    consulta.addEventListener('change', aoMudar)
    return () => consulta.removeEventListener('change', aoMudar)
  }, [])

  // O CSS lê data-tema no <html>; sem escolha, fica o tema do sistema.
  useEffect(() => {
    if (temaEscolhido) document.documentElement.dataset.tema = temaEscolhido
    else delete document.documentElement.dataset.tema
  }, [temaEscolhido])

  const tema: Tema = temaEscolhido ?? (sistemaEscuro ? 'escuro' : 'claro')

  const alternarTema = useCallback(() => {
    const novo: Tema = tema === 'escuro' ? 'claro' : 'escuro'
    setTemaEscolhido(novo)
    gravarArmazenado(CHAVE_TEMA, novo)
  }, [tema])

  const escolherMeuTime = useCallback((timeId: number | null) => {
    setMeuTime(timeId)
    gravarArmazenado(CHAVE_MEU_TIME, timeId === null ? null : String(timeId))
  }, [])

  const valor = useMemo(
    () => ({ tema, alternarTema, meuTime, escolherMeuTime }),
    [tema, alternarTema, meuTime, escolherMeuTime],
  )

  return <ContextoPreferencias.Provider value={valor}>{children}</ContextoPreferencias.Provider>
}
