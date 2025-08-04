-- Criação das tabelas principais do Portal do Professor
-- Script pronto para rodar no PostgreSQL (ex: Neon)

-- 1. Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    senha_hash VARCHAR(256) NOT NULL,
    tipo_perfil VARCHAR(30) NOT NULL, -- master, diretor, secretaria, coordenador, professor, aluno, responsavel
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Tabela de Turmas
CREATE TABLE IF NOT EXISTS turma (
    id_turma SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    descricao TEXT,
    ano_letivo VARCHAR(10) NOT NULL,
    id_diretor INTEGER NOT NULL REFERENCES usuario(id_usuario)
);

-- 3. Tabela de Disciplinas
CREATE TABLE IF NOT EXISTS disciplina (
    id_disciplina SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    descricao TEXT
);

-- 4. Tabela intermediária Professor/Disciplina/Turma (N:N:N)
CREATE TABLE IF NOT EXISTS professor_disciplina_turma (
    id_prof_disc_turma SERIAL PRIMARY KEY,
    id_professor INTEGER NOT NULL REFERENCES usuario(id_usuario),
    id_disciplina INTEGER NOT NULL REFERENCES disciplina(id_disciplina),
    id_turma INTEGER NOT NULL REFERENCES turma(id_turma)
);

-- 5. Tabela de Alunos
CREATE TABLE IF NOT EXISTS aluno (
    id_aluno SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario),
    matricula VARCHAR(40) NOT NULL,
    id_turma INTEGER REFERENCES turma(id_turma) -- pode ser NULL (aluno sem turma)
);

-- 6. Tabela de Responsáveis
CREATE TABLE IF NOT EXISTS responsavel (
    id_responsavel SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario)
);

-- 7. Tabela de vínculo Aluno x Responsável (N:N)
CREATE TABLE IF NOT EXISTS aluno_responsavel (
    id_aluno_responsavel SERIAL PRIMARY KEY,
    id_aluno INTEGER NOT NULL REFERENCES aluno(id_aluno),
    id_responsavel INTEGER NOT NULL REFERENCES responsavel(id_responsavel),
    tipo_vinculo VARCHAR(40) NOT NULL -- Ex: pai, mãe, avó
);

-- 8. Tabela de Plano de Aula
CREATE TABLE IF NOT EXISTS planoaula (
    id_plano SERIAL PRIMARY KEY,
    id_prof_disc_turma INTEGER NOT NULL REFERENCES professor_disciplina_turma(id_prof_disc_turma),
    descricao TEXT NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 9. Tabela de Lançamentos (notas, frequência, parecer)
CREATE TABLE IF NOT EXISTS lancamento (
    id_lancamento SERIAL PRIMARY KEY,
    id_prof_disc_turma INTEGER NOT NULL REFERENCES professor_disciplina_turma(id_prof_disc_turma),
    id_aluno INTEGER NOT NULL REFERENCES aluno(id_aluno),
    tipo VARCHAR(40) NOT NULL, -- nota, frequência, parecer
    valor VARCHAR(40) NOT NULL,
    data_lancamento TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 10. Tabela de Recados do Professor
CREATE TABLE IF NOT EXISTS recado (
    id_recado SERIAL PRIMARY KEY,
    id_professor INTEGER NOT NULL REFERENCES usuario(id_usuario),
    id_aluno INTEGER REFERENCES aluno(id_aluno),
    id_responsavel INTEGER REFERENCES responsavel(id_responsavel),
    mensagem TEXT NOT NULL,
    data_envio TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 11. Tabela de Mensagens entre Usuários
CREATE TABLE IF NOT EXISTS mensagem (
    id_mensagem SERIAL PRIMARY KEY,
    id_remetente INTEGER NOT NULL REFERENCES usuario(id_usuario),
    id_destinatario INTEGER NOT NULL REFERENCES usuario(id_usuario),
    mensagem TEXT NOT NULL,
    data_envio TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 12. Tabela de Sessão (controle de login)
CREATE TABLE IF NOT EXISTS sessao (
    id_sessao SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario),
    token_jwt VARCHAR(256) NOT NULL,
    data_login TIMESTAMP NOT NULL DEFAULT NOW(),
    data_expiracao TIMESTAMP NOT NULL,
    ip_origem VARCHAR(50),
    user_agent TEXT,
    manter_conectado BOOLEAN NOT NULL DEFAULT FALSE,
    data_logout TIMESTAMP,
    status VARCHAR(20) NOT NULL -- ativo, encerrada, expirada
);

-- 13. Tabela de Histórico de Sessão
CREATE TABLE IF NOT EXISTS historico_sessao (
    id_historico_sessao SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario),
    id_sessao INTEGER REFERENCES sessao(id_sessao),
    acao VARCHAR(40) NOT NULL, -- login_sucesso, login_falha, logout, expirou, bloqueado, tentativa_acesso
    data_evento TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_origem VARCHAR(50),
    user_agent TEXT,
    detalhe TEXT
);

-- 14. Tabela de Log de Auditoria
CREATE TABLE IF NOT EXISTS logauditoria (
    id_log SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario),
    acao VARCHAR(50) NOT NULL,
    entidade VARCHAR(80) NOT NULL,
    id_referencia INTEGER,
    descricao TEXT,
    data_evento TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_origem VARCHAR(50),
    user_agent TEXT
);
