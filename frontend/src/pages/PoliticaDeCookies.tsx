import React from 'react';

const PoliticaDeCookies: React.FC = () => (
  <div className="pp-app-shell">
    <main className="pp-page pp-page--policy">
      <section className="pp-page__content">
        <h1>Política de Cookies — Portal do Professor</h1>

        <h2>1. O que são cookies</h2>
        <p>
          Cookies são pequenos arquivos colocados no seu dispositivo para permitir o correto
          funcionamento do sistema e melhorar a segurança.
        </p>

        <h2>2. Quais cookies utilizamos</h2>
        <p>
          Usamos apenas cookies estritamente necessários ao funcionamento do Portal do Professor,
          como os de autenticação de sessão após o login. Não utilizamos cookies para fins de
          marketing, publicidade ou rastreamento sem o seu consentimento.
        </p>

        <h2>3. Finalidade dos cookies essenciais</h2>
        <p>Manter sua sessão ativa e protegida, permitir autenticação e prevenir uso indevido.</p>

        <h2>4. Base legal</h2>
        <p>
          Tratamento fundamentado na execução de contrato e/ou legítimo interesse previstos na LGPD
          para viabilizar o funcionamento e a segurança do serviço.
        </p>

        <h2>5. Prazo de retenção</h2>
        <p>
          O cookie de sessão expira conforme a política de segurança do sistema (por exemplo, ao
          encerrar a sessão, ao expirar o tempo configurado ou quando você realiza logout).
        </p>

        <h2>6. Gestão de cookies pelo usuário</h2>
        <p>
          Você pode gerenciar cookies nas configurações do seu navegador. A desativação de cookies
          essenciais pode afetar o funcionamento do sistema.
        </p>

        <h2>7. Contato do encarregado (DPO)</h2>
        <p>Para dúvidas sobre dados pessoais, contate: dpo@portaldoprofessor.example</p>

        <h2>8. Atualizações</h2>
        <p>
          Podemos atualizar esta política para refletir melhorias no sistema. Data da última
          atualização: (inserir data do deploy).
        </p>
      </section>
    </main>
  </div>
);

export default PoliticaDeCookies;
