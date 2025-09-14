import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)

    // Salvar preferência do usuário no banco de dados
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ preferred_theme: newTheme })
          .eq('user_id', user.id)

        if (error) {
          console.error('Erro ao salvar tema:', error)
          toast.error('Erro ao salvar preferência de tema')
        }
      } catch (error) {
        console.error('Erro ao salvar tema:', error)
        toast.error('Erro ao salvar preferência de tema')
      }
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-9 w-9 px-0"
      title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Alternar tema</span>
    </Button>
  )
}