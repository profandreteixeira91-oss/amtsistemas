import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Serviço — AMT Sistemas" },
      { name: "description", content: "Termos e condições de uso dos sistemas e serviços da AMT Sistemas." },
      { property: "og:title", content: "Termos de Serviço — AMT Sistemas" },
      { property: "og:description", content: "Regras de uso dos sistemas AMT." },
    ],
  }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <h1 className="mb-2 text-4xl font-bold">Termos de Serviço</h1>
      <p className="mb-8 text-sm text-muted-foreground">Última atualização: 10 de julho de 2026</p>

      <section className="prose prose-invert max-w-none space-y-6">
        <p>
          Estes Termos regem o uso dos sistemas e serviços oferecidos pela
          <strong> AMT Sistemas</strong> ("nós"), incluindo AMT Clinic, AMT Hotel, AMT Restaurant,
          AMT Vet e AMT Custom, disponíveis em <a href="https://amtsistemas.com.br">amtsistemas.com.br</a>.
          Ao criar uma conta ou utilizar qualquer serviço, você ("Cliente") concorda integralmente com estes Termos.
        </p>

        <h2 className="text-2xl font-semibold">1. Objeto</h2>
        <p>
          A AMT Sistemas fornece software como serviço (SaaS) para gestão de negócios em nichos
          específicos (clínicas, hotéis, restaurantes, veterinárias e projetos customizados),
          mediante assinatura mensal ou anual.
        </p>

        <h2 className="text-2xl font-semibold">2. Cadastro e conta</h2>
        <ul className="list-disc pl-6">
          <li>Você deve fornecer dados verdadeiros, completos e atualizados.</li>
          <li>É responsável pela guarda de suas credenciais e por toda atividade em sua conta.</li>
          <li>Deve ter capacidade legal para contratar (18 anos ou representante legal).</li>
        </ul>

        <h2 className="text-2xl font-semibold">3. Planos, pagamentos e trial</h2>
        <ul className="list-disc pl-6">
          <li>Os planos e preços vigentes estão publicados na página de cada sistema.</li>
          <li>Assinaturas são cobradas de forma recorrente até cancelamento.</li>
          <li>Períodos gratuitos de teste (trial), quando oferecidos, não geram cobrança; ao término, a assinatura é iniciada automaticamente, salvo cancelamento.</li>
          <li>Atrasos superiores a 5 dias podem resultar em suspensão do acesso.</li>
        </ul>

        <h2 className="text-2xl font-semibold">4. Cancelamento e reembolso</h2>
        <p>
          Você pode cancelar a qualquer momento pelo painel do sistema. Conforme o Código de Defesa
          do Consumidor (art. 49), há direito de arrependimento em até 7 dias após a primeira contratação,
          com reembolso integral. Após esse prazo, não há reembolso proporcional de mensalidades já pagas.
        </p>

        <h2 className="text-2xl font-semibold">5. Uso aceitável</h2>
        <p>Você concorda em não:</p>
        <ul className="list-disc pl-6">
          <li>Utilizar os sistemas para fins ilícitos, fraudulentos ou que violem direitos de terceiros.</li>
          <li>Tentar acessar áreas restritas, engenharia reversa ou explorar vulnerabilidades.</li>
          <li>Enviar spam, malware ou conteúdo ofensivo através das ferramentas de comunicação.</li>
          <li>Revender ou redistribuir o serviço sem autorização escrita.</li>
        </ul>

        <h2 className="text-2xl font-semibold">6. Propriedade intelectual</h2>
        <p>
          Todo o software, marca, layout e conteúdo dos sistemas AMT são de propriedade exclusiva
          da AMT Sistemas. Os dados operacionais inseridos por você permanecem de sua propriedade.
        </p>

        <h2 className="text-2xl font-semibold">7. Disponibilidade e suporte</h2>
        <p>
          Empenhamo-nos em manter alta disponibilidade, mas não garantimos operação ininterrupta.
          Manutenções programadas serão comunicadas com antecedência sempre que possível.
          O suporte é prestado nos canais oficiais em horário comercial.
        </p>

        <h2 className="text-2xl font-semibold">8. Limitação de responsabilidade</h2>
        <p>
          Na máxima extensão permitida por lei, a AMT Sistemas não responde por lucros cessantes,
          perda de dados por causas externas (invasões, força maior) ou danos indiretos.
          A responsabilidade total fica limitada ao valor pago pelo Cliente nos últimos 12 meses.
        </p>

        <h2 className="text-2xl font-semibold">9. Privacidade</h2>
        <p>
          O tratamento de dados pessoais segue nossa <a href="/privacidade">Política de Privacidade</a>,
          parte integrante destes Termos.
        </p>

        <h2 className="text-2xl font-semibold">10. Alterações</h2>
        <p>
          Podemos alterar estes Termos periodicamente. Alterações relevantes serão comunicadas
          com no mínimo 15 dias de antecedência. O uso continuado após a vigência configura aceite.
        </p>

        <h2 className="text-2xl font-semibold">11. Foro</h2>
        <p>
          Fica eleito o foro da comarca do domicílio do Cliente, com renúncia a qualquer outro.
        </p>

        <h2 className="text-2xl font-semibold">12. Contato</h2>
        <p>
          <strong>AMT Sistemas</strong><br />
          E-mail: <a href="mailto:contato@amtsistemas.com.br">contato@amtsistemas.com.br</a><br />
          Site: <a href="https://amtsistemas.com.br">amtsistemas.com.br</a>
        </p>
      </section>
    </main>
  );
}
