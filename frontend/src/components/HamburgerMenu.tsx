// Importa React e hooks necessários
import React, { useCallback, useEffect, useRef, useState } from "react"; // Importa React, useState para controlar estado, useEffect para efeitos, useRef para referência DOM, useCallback para memoizar funções
// Importa utilidade de rota para fechar o menu quando a rota mudar
import { useLocation } from "react-router-dom"; // Importa useLocation para detectar mudança de rota
// Importa CSS externo do componente (sem inline style)
import "../styles/HamburgerMenu.css"; // Importa CSS específico do menu hambúrguer

// Define tipo das props do componente
type HamburgerMenuProps = {
  // Define elemento a ser renderizado dentro do drawer (por exemplo, navegação móvel)
  drawerContent?: React.ReactNode; // Permite injetar conteúdo do menu lateral (links, navegação, etc.)
  // Define rótulo acessível para o botão
  ariaLabel?: string; // Permite alterar o aria-label do botão para acessibilidade
};

// Exporta componente padrão
const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  drawerContent,
  ariaLabel = "Abrir menu de navegação", // Define rótulo padrão acessível
}) => {
  // Controla se o drawer está aberto
  const [open, setOpen] = useState(false); // Cria estado booleano para abrir/fechar o drawer
  // Cria referência ao container do drawer para detecção de clique externo
  const drawerRef = useRef<HTMLDivElement | null>(null); // Guarda referência do drawer para validar cliques fora
  // Obtém localização atual para fechar quando a rota muda
  const location = useLocation(); // Recupera objeto de localização para observar mudanças de rota

  // Função para alternar estado do drawer
  const toggle = useCallback(() => {
    // Alterna entre aberto e fechado
    setOpen((prev) => !prev); // Inverte estado atual do drawer
  }, []); // Mantém a mesma referência entre renders

  // Função para fechar o drawer
  const close = useCallback(() => {
    // Fecha o drawer se estiver aberto
    setOpen(false); // Altera estado para fechado
  }, []); // Mantém a mesma referência entre renders

  // Fecha ao mudar a rota
  useEffect(() => {
    // Executa sempre que a rota mudar
    close(); // Fecha o drawer ao navegar para outra página
  }, [location, close]); // Observa mudanças do objeto location

  // Fecha com tecla ESC
  useEffect(() => {
    // Define handler para keydown
    const onKeyDown = (e: KeyboardEvent) => {
      // Verifica se tecla pressionada é Escape
      if (e.key === "Escape") {
        // Fecha o drawer se estiver aberto
        close(); // Fecha ao pressionar ESC
      } // Finaliza verificação de tecla
    }; // Finaliza declaração do handler

    // Adiciona listener global de keydown
    window.addEventListener("keydown", onKeyDown); // Registra evento para tecla
    // Remove listener ao desmontar
    return () => window.removeEventListener("keydown", onKeyDown); // Limpa evento para evitar vazamento
  }, [close]); // Mantém dependência correta

  // Fecha ao clicar fora do drawer
  useEffect(() => {
    // Define handler para clique no documento
    const onClickOutside = (e: MouseEvent) => {
      // Obtém elemento alvo do clique
      const target = e.target as Node; // Converte para Node para usar contains
      // Verifica se drawer existe e se o clique não foi dentro dele
      if (open && drawerRef.current && !drawerRef.current.contains(target)) {
        // Fecha o drawer
        close(); // Fecha ao detectar clique fora
      } // Finaliza verificação
    }; // Finaliza handler

    // Adiciona listener global de clique
    document.addEventListener("mousedown", onClickOutside); // Registra evento mousedown
    // Remove listener ao desmontar
    return () => document.removeEventListener("mousedown", onClickOutside); // Limpa evento
  }, [open, close]); // Observa estado e função close

  // Bloqueia scroll do body quando drawer está aberto (mobile UX)
  useEffect(() => {
    // Verifica se drawer está aberto
    if (open) {
      // Adiciona classe no body para bloquear rolagem
      document.body.classList.add("no-scroll"); // Impede rolagem do fundo quando menu está aberto
    } else {
      // Remove classe quando drawer fechar
      document.body.classList.remove("no-scroll"); // Restaura rolagem do fundo
    } // Finaliza verificação
    // Remove classe ao desmontar por segurança
    return () => document.body.classList.remove("no-scroll"); // Garante remoção ao desmontar
  }, [open]); // Observa estado open

  // Renderiza botão + overlay + drawer
  return (
    <>
      {/* Renderiza botão do menu hambúrguer */}
      <button
        type="button" // Define tipo de botão
        className={`button hamburger-btn${open ? " is-active" : ""}`} // Define classes para estado visual do botão
        aria-label={ariaLabel} // Define rótulo acessível para leitores de tela
        aria-controls="mobile-drawer" // Associa botão ao drawer pelo id
        aria-expanded={open} // Informa estado de expansão para acessibilidade
        onClick={toggle} // Registra função para alternar estado ao clicar
      >
        {/* Renderiza ícone com três barras usando spans */}
        <span className="hamburger-box">{/* Container do ícone */}</span>
        <span className="hamburger-line top">{/* Linha superior do ícone */}</span>
        <span className="hamburger-line middle">{/* Linha do meio do ícone */}</span>
        <span className="hamburger-line bottom">{/* Linha inferior do ícone */}</span>
      </button>

      {/* Renderiza overlay clicável apenas quando aberto */}
      {open && (
        <div
          className="hamburger-overlay" // Define camada de sobreposição escura
          aria-hidden="true" // Marca como elemento decorativo para acessibilidade
        />
      )}

      {/* Renderiza drawer lateral (menu) */}
      <div
        id="mobile-drawer" // Define id para aria-controls
        ref={drawerRef} // Atribui referência para clique externo
        className={`hamburger-drawer${open ? " open" : ""}`} // Controla classes de abertura
        role="dialog" // Define papel semântico como diálogo lateral
        aria-modal="true" // Informa que é modal quando aberto
        aria-label="Menu de navegação" // Define rótulo para leitores de tela
      >
        {/* Renderiza área de conteúdo do drawer */}
        <div className="drawer-content">
          {/* Renderiza children passados como conteúdo do menu */}
          {drawerContent}{/* Insere conteúdo injetado (ex.: links de navegação) */}
        </div>
      </div>
    </>
  ); // Finaliza retorno do componente
}; // Finaliza declaração do componente

// Exporta componente para uso externo
export default HamburgerMenu; // Disponibiliza componente para importação
