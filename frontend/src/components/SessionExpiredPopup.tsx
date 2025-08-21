// Importa React e hooks
import React, { useEffect, useState } from 'react'

// Importa o CSS do popup (já está centralizado na tela de login)
import '../styles/Login.css'

// Define o componente funcional de aviso de sessão expirada
const SessionExpiredPopup: React.FC = () => {
  // Controla visibilidade do popup
  const [visivel, setVisivel] = useState(true)

  // Controla tempo restante para sumir automaticamente
  const [contador, setContador] = useState(5)

  // Reduz contador a cada segundo
  useEffect(() => {
    if (contador === 0) {
      setVisivel(false)
    }

    const timer = setInterval(() => {
      setContador((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [contador])

  // Oculta popup manualmente
  const fechar = () => {
    setVisivel(false)
  }

  // Se não estiver visível, não renderiza nada
  if (!visivel) return null

  // Renderiza estrutura do popup
  return (
    <div className="popup popup-vermelho">
      <p>Sua sessão expirou. Faça login novamente.</p>
      <button className="button botao-fechar" onClick={fechar}>
        Fechar ({contador} segundos)
      </button>
    </div>
  )
}

// Exporta o componente
export default SessionExpiredPopup
