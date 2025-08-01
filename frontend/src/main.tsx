// Importa as bibliotecas principais
import React from "react"
import ReactDOM from "react-dom/client"

// Importa o componente principal
import App from "./App"

// Renderiza a aplicação no DOM
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
