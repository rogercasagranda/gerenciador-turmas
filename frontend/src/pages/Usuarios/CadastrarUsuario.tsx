// Importa o React para criar o componente
import React, { useState } from 'react'
// Importa o cliente HTTP para chamadas ao backend
import axios from 'axios'
// Importa o hook de navegação para redirecionamentos
import { useNavigate } from 'react-router-dom'
// Importa o CSS dedicado desta tela (sem inline style)
import '../../styles/CadastrarUsuario.css'

// Define o componente funcional de cadastro de usuário
const CadastrarUsuario: React.FC = () => {
  // Define estado do campo nome
  const [nome, setNome] = useState<string>('') // Controla o valor do nome
  // Define estado do campo e-mail
  const [email, setEmail] = useState<string>('') // Controla o valor do e-mail
  // Define estado do campo senha
  const [senha, setSenha] = useState<string>('') // Controla o valor da senha
  // Define estado do campo confirmar senha
  const [confirmarSenha, setConfirmarSenha] = useState<string>('') // Controla a confirmação de senha
  // Define estado do select de perfil
  const [perfil, setPerfil] = useState<string>('professor') // Define perfil padrão
  // Define estado do campo DDI (obrigatório conforme regra anterior)
  const [ddi, setDdi] = useState<string>('55') // Define o DDI com padrão Brasil
  // Define estado do campo DDD (obrigatório conforme regra anterior)
  const [ddd, setDdd] = useState<string>('54') // Define um DDD padrão
  // Define estado do campo número de celular (obrigatório)
  const [numeroCelular, setNumeroCelular] = useState<string>('') // Armazena o número do celular
  // Define estado de feedback de erro
  const [erro, setErro] = useState<string>('') // Guarda mensagem de erro para exibir ao usuário
  // Define estado de feedback de sucesso
  const [sucesso, setSucesso] = useState<string>('') // Guarda mensagem de sucesso
  // Define estado de loading para bloquear múltiplos submits
  const [enviando, setEnviando] = useState<boolean>(false) // Impede reenvio durante processamento
  // Instancia o hook de navegação
  const navigate = useNavigate() // Permite redirecionar para outras rotas internas

  // Define a URL base da API usando variável de ambiente do Vite (ou fallback)
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000' // Determina endpoint do backend

  // Define função de submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    // Previne o comportamento padrão do submit
    e.preventDefault() // Evita recarregar a página
    // Zera mensagens anteriores
    setErro('') // Limpa erro anterior
    setSucesso('') // Limpa sucesso anterior

    // Valida se senha e confirmação são iguais
    if (senha !== confirmarSenha) { // Compara ambos os campos
      setErro('As senhas não coincidem.') // Informa erro ao usuário
      return // Interrompe o fluxo de envio
    }

    // Valida campo obrigatório do celular
    if (!numeroCelular.trim()) { // Checa se número foi informado
      setErro('O número de celular é obrigatório.') // Informa erro específico
      return // Interrompe o envio
    }

    // Prepara cabeçalhos com token, se existir
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') // Recupera token de sessão
    const headers: Record<string, string> = {} // Inicializa objeto de headers
    if (token) headers['Authorization'] = `Bearer ${token}` // Injeta token no header se presente

    try {
      // Marca estado de envio para bloquear botão
      setEnviando(true) // Evita reenvio durante a chamada
      // Envia os dados ao backend
      const body = { // Monta o payload seguindo contrato atual
        nome, // Transfere o nome informado
        email, // Transfere o e-mail informado
        senha, // Transfere a senha informada
        tipo_perfil: perfil, // Mapeia o perfil para o backend
        ddi, // Inclui DDI conforme regra
        ddd, // Inclui DDD conforme regra
        numero_celular: numeroCelular, // Inclui número de celular obrigatório
      } // Fecha o objeto de payload

      // Executa requisição POST para endpoint de usuários
      await axios.post(`${API_BASE}/usuarios`, body, { headers }) // Chama a API de criação de usuário

      // Exibe mensagem de sucesso
      setSucesso('Usuário cadastrado com sucesso.') // Informa que cadastro ocorreu
      // Limpa os campos do formulário
      setNome('') // Limpa nome
      setEmail('') // Limpa e-mail
      setSenha('') // Limpa senha
      setConfirmarSenha('') // Limpa confirmação de senha
      setPerfil('professor') // Restaura perfil padrão
      setDdi('55') // Restaura DDI padrão
      setDdd('54') // Restaura DDD padrão
      setNumeroCelular('') // Limpa celular
    } catch (err: any) {
      // Trata erro da API
      const msg = err?.response?.data?.detail || 'Falha ao cadastrar usuário.' // Extrai detalhe se houver
      setErro(msg) // Exibe a mensagem ao usuário
    } finally {
      // Libera o envio
      setEnviando(false) // Restaura botão para novo envio
    }
  }

  // Define função para navegar à tela de consulta
  const irParaConsulta = () => {
    // Redireciona para rota de consulta de usuários
    navigate('/usuarios/consultar') // Troca a rota dentro da Home
  }

  // Renderiza layout do formulário
  return (
    <div className="cadastro-wrapper">{/* Cria contêiner da página */}
      <h2 className="cadastro-titulo">{/* Define título da seção */}
        Cadastrar Usuário{/* Exibe texto do título */}
      </h2>

      {/* Exibe mensagem de erro, se houver */}
      {erro && <div className="alerta erro">{erro}</div>}{/* Renderiza alerta de erro */}

      {/* Exibe mensagem de sucesso, se houver */}
      {sucesso && <div className="alerta sucesso">{sucesso}</div>}{/* Renderiza alerta de sucesso */}

      {/* Inicia o formulário controlado */}
      <form className="cadastro-form" onSubmit={handleSubmit}>{/* Conecta submit ao handler */}
        {/* Campo de nome */}
        <div className="campo">
          <label htmlFor="nome" className="rotulo">Nome</label>{/* Identifica o campo */}
          <input
            id="nome" // Define id para o input
            type="text" // Define tipo de entrada
            className="entrada" // Aplica classe de estilo
            value={nome} // Liga ao estado controlado
            onChange={(e) => setNome(e.target.value)} // Atualiza estado
            required // Marca como obrigatório
          />{/* Fecha o input */}
        </div>{/* Fecha o bloco do campo */}

        {/* Campo de e-mail */}
        <div className="campo">
          <label htmlFor="email" className="rotulo">E-mail</label>{/* Rótulo do e-mail */}
          <input
            id="email" // Identifica input
            type="email" // Define tipo e-mail
            className="entrada" // Aplica estilo
            value={email} // Liga ao estado
            onChange={(e) => setEmail(e.target.value)} // Atualiza estado
            required // Torna obrigatório
          />{/* Fecha input */}
        </div>{/* Fecha bloco */}

        {/* Linha com senha e confirmar senha */}
        <div className="linha dois">{/* Cria linha com dois campos */}
          <div className="campo">{/* Campo de senha */}
            <label htmlFor="senha" className="rotulo">Senha</label>{/* Rótulo */}
            <input
              id="senha" // Id do campo
              type="password" // Tipo senha
              className="entrada" // Classe de estilo
              value={senha} // Estado controlado
              onChange={(e) => setSenha(e.target.value)} // Atualiza estado
              required // Obrigatório
            />{/* Fecha input */}
          </div>{/* Fecha campo de senha */}

          <div className="campo">{/* Campo confirmar senha */}
            <label htmlFor="confirmarSenha" className="rotulo">Confirmar senha</label>{/* Rótulo */}
            <input
              id="confirmarSenha" // Id do campo
              type="password" // Tipo senha
              className="entrada" // Classe de estilo
              value={confirmarSenha} // Liga ao estado
              onChange={(e) => setConfirmarSenha(e.target.value)} // Atualiza estado
              required // Obrigatório
            />{/* Fecha input */}
          </div>{/* Fecha campo confirmar */}
        </div>{/* Fecha linha dupla */}

        {/* Linha com perfil e DDI/DDD */}
        <div className="linha tres">{/* Cria linha com três colunas */}
          <div className="campo">{/* Campo perfil */}
            <label htmlFor="perfil" className="rotulo">Perfil</label>{/* Rótulo */}
            <select
              id="perfil" // Id do campo
              className="entrada" // Classe de estilo
              value={perfil} // Liga ao estado
              onChange={(e) => setPerfil(e.target.value)} // Atualiza estado
              required // Obrigatório
            >{/* Abre select */}
              <option value="professor">Professor</option>{/* Opção de professor */}
              <option value="coordenador">Coordenador</option>{/* Opção de coordenador */}
              <option value="direcao">Direção</option>{/* Opção de direção */}
            </select>{/* Fecha select */}
          </div>{/* Fecha campo */}

          <div className="campo curto">{/* Campo DDI */}
            <label htmlFor="ddi" className="rotulo">DDI</label>{/* Rótulo */}
            <input
              id="ddi" // Id do campo
              type="text" // Tipo texto
              className="entrada" // Classe de estilo
              value={ddi} // Liga ao estado
              onChange={(e) => setDdi(e.target.value)} // Atualiza estado
              required // Obrigatório
            />{/* Fecha input */}
          </div>{/* Fecha campo */}

          <div className="campo curto">{/* Campo DDD */}
            <label htmlFor="ddd" className="rotulo">DDD</label>{/* Rótulo */}
            <input
              id="ddd" // Id do campo
              type="text" // Tipo texto
              className="entrada" // Classe de estilo
              value={ddd} // Liga ao estado
              onChange={(e) => setDdd(e.target.value)} // Atualiza estado
              required // Obrigatório
            />{/* Fecha input */}
          </div>{/* Fecha campo */}
        </div>{/* Fecha linha tripla */}

        {/* Campo número de celular */}
        <div className="campo">
          <label htmlFor="numero" className="rotulo">Número de celular</label>{/* Rótulo */}
          <input
            id="numero" // Id do campo
            type="tel" // Tipo telefone
            className="entrada" // Classe de estilo
            value={numeroCelular} // Liga ao estado
            onChange={(e) => setNumeroCelular(e.target.value)} // Atualiza estado
            placeholder="Ex.: 991234567" // Dica de preenchimento
            required // Obrigatório conforme regra
          />{/* Fecha input */}
        </div>{/* Fecha bloco */}

        {/* Linha de ações */}
        <div className="acoes">{/* Container dos botões */}
          <button
            type="button" // Define tipo botão para não submeter
            className="btn secundario" // Aplica estilo secundário
            onClick={irParaConsulta} // Navega para consulta
          >{/* Abre o botão */}
            Consultar Usuários{/* Texto do botão */}
          </button>{/* Fecha botão */}

          <button
            type="submit" // Define tipo submit
            className="btn primario" // Aplica estilo primário
            disabled={enviando} // Desabilita durante envio
          >{/* Abre botão */}
            {enviando ? 'Enviando...' : 'Cadastrar'}{/* Alterna texto pelo estado */}
          </button>{/* Fecha botão */}
        </div>{/* Fecha container de ações */}
      </form>{/* Fecha formulário */}
    </div> // Fecha contêiner da página
  )
}

// Exporta o componente para uso na Home
export default CadastrarUsuario
