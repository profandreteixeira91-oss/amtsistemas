import { createFileRoute } from "@tanstack/react-router";

import { SiteShell } from "@/components/site/layout";
import { Container, Eyebrow } from "@/components/site/primitives";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — AMT Sistemas" },
      {
        name: "description",
        content: "Política de Privacidade da AMT Sistemas em conformidade com a LGPD.",
      },
      { property: "og:title", content: "Política de Privacidade — AMT Sistemas" },
      { property: "og:description", content: "Como coletamos, usamos e protegemos seus dados." },
    ],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <SiteShell>
      <section
        className="border-b border-[var(--border)]"
        style={{ background: "var(--section-alt)" }}
      >
        <Container className="max-w-3xl py-12 sm:py-16">
          <Eyebrow>Privacidade</Eyebrow>
          <h1 className="mt-4 text-3xl font-extrabold text-[var(--brand-navy)] sm:text-4xl">
            Política de Privacidade
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Última atualização: 10 de julho de 2026
          </p>
        </Container>
      </section>
      <Container className="max-w-3xl py-12 sm:py-16">
        <article className="legal">
          <p>
            Esta Política de Privacidade descreve como a <strong>AMT Sistemas</strong> ("nós")
            coleta, utiliza, armazena e protege as informações pessoais dos usuários ("você") de
            nossos sistemas (AMT Clinic, AMT Hotel, AMT Restaurant, AMT Vet, AMT Custom) e do site
            <a href="https://amtsistemas.com.br"> amtsistemas.com.br</a>, em conformidade com a Lei
            Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
          </p>

          <h2 className="text-2xl font-semibold">1. Dados que coletamos</h2>
          <ul className="list-disc pl-6">
            <li>
              <strong>Cadastro:</strong> nome, e-mail, telefone, CPF/CNPJ, empresa.
            </li>
            <li>
              <strong>Autenticação:</strong> credenciais e dados providos por login social (Google).
            </li>
            <li>
              <strong>Uso:</strong> logs de acesso, endereço IP, navegador, páginas visitadas.
            </li>
            <li>
              <strong>Operacionais:</strong> dados inseridos por você em seu sistema (clientes,
              agendamentos, financeiro).
            </li>
          </ul>

          <h2 className="text-2xl font-semibold">2. Como utilizamos os dados</h2>
          <ul className="list-disc pl-6">
            <li>Fornecer, manter e melhorar nossos sistemas.</li>
            <li>Autenticar acessos e garantir a segurança da conta.</li>
            <li>Emitir cobranças e comprovantes fiscais.</li>
            <li>Enviar comunicações operacionais e, mediante consentimento, comerciais.</li>
            <li>Cumprir obrigações legais e regulatórias.</li>
          </ul>

          <h2 className="text-2xl font-semibold">3. Compartilhamento</h2>
          <p>
            Não vendemos seus dados. Compartilhamos apenas com provedores essenciais para a operação
            (hospedagem, processamento de pagamentos, e-mail transacional, autenticação) sob
            contrato e sob obrigação de confidencialidade, ou quando exigido por lei.
          </p>

          <h2 className="text-2xl font-semibold">4. Login com Google</h2>
          <p>
            Ao usar "Entrar com Google", recebemos seu nome, e-mail e foto de perfil, exclusivamente
            para criar e autenticar sua conta. Não acessamos seus contatos, e-mails ou arquivos.
          </p>

          <h2 className="text-2xl font-semibold">5. Cookies</h2>
          <p>
            Utilizamos cookies essenciais para sessão e preferências, e cookies analíticos para
            entender o uso do site. Você pode gerenciá-los nas configurações do seu navegador.
          </p>

          <h2 className="text-2xl font-semibold">6. Retenção</h2>
          <p>
            Retemos seus dados enquanto sua conta estiver ativa e pelo período necessário para
            cumprir obrigações legais (fiscais, contábeis e regulatórias).
          </p>

          <h2 className="text-2xl font-semibold">7. Seus direitos (LGPD)</h2>
          <p>
            Você pode solicitar a qualquer momento: confirmação de tratamento, acesso, correção,
            anonimização, portabilidade, eliminação e revogação de consentimento, através do e-mail
            <a href="mailto:contato@amtsistemas.com.br"> contato@amtsistemas.com.br</a>.
          </p>

          <h2 className="text-2xl font-semibold">8. Segurança</h2>
          <p>
            Aplicamos medidas técnicas e organizacionais (criptografia em trânsito, controle de
            acesso, backups) para proteger seus dados contra acesso não autorizado, perda ou
            alteração.
          </p>

          <h2 className="text-2xl font-semibold">9. Alterações</h2>
          <p>
            Podemos atualizar esta política periodicamente. A versão vigente estará sempre
            disponível nesta página, com data de atualização no topo.
          </p>

          <h2 className="text-2xl font-semibold">10. Contato</h2>
          <p>
            <strong>Encarregado de Dados (DPO):</strong> André Teixeira
            <br />
            <strong>E-mail:</strong>{" "}
            <a href="mailto:contato@amtsistemas.com.br">contato@amtsistemas.com.br</a>
            <br />
            <strong>Site:</strong> <a href="https://amtsistemas.com.br">amtsistemas.com.br</a>
          </p>
        </article>
      </Container>
    </SiteShell>
  );
}
