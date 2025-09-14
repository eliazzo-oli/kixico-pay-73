import { createContext, useContext, useEffect, useState } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="kixicopay-theme"
      {...props}
    >
      <ThemeSync />
      {children}
    </NextThemesProvider>
  )
}

// Componente para sincronizar tema com o banco de dados
function ThemeSync() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    // Carregar tema do usuário
    const loadUserTheme = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_theme')
          .eq('user_id', user.id)
          .single()

        if (profile?.preferred_theme) {
          const theme = profile.preferred_theme
          document.documentElement.className = theme === 'dark' ? 'dark' : ''
          localStorage.setItem('kixicopay-theme', theme)
        }
      } catch (error) {
        console.error('Erro ao carregar tema do usuário:', error)
      }
    }

    loadUserTheme()
  }, [user])

  return null
}