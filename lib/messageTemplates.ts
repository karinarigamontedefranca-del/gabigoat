import { Company } from "./types";
import { daysSince } from "./utils";

export type Situation =
  | "lead"
  | "conexao_quente"
  | "conexao_fria"
  | "apres_agendada"
  | "apres_realizada_quente"
  | "apres_realizada_fria"
  | "proposta_agendada"
  | "proposta_realizada_quente"
  | "proposta_realizada_fria"
  | "contrato"
  | "perdido";

export const SITUATIONS: { key: Situation; label: string }[] = [
  { key: "lead", label: "Primeiro contato" },
  { key: "conexao_quente", label: "Conversa em andamento (recente)" },
  { key: "conexao_fria", label: "Conversa em andamento (esfriando)" },
  { key: "apres_agendada", label: "Apresentação agendada — confirmar" },
  { key: "apres_realizada_quente", label: "Pós-apresentação (recente)" },
  { key: "apres_realizada_fria", label: "Pós-apresentação (esfriando)" },
  { key: "proposta_agendada", label: "Reunião de proposta agendada — confirmar" },
  { key: "proposta_realizada_quente", label: "Pós-proposta (recente)" },
  { key: "proposta_realizada_fria", label: "Pós-proposta (esfriando)" },
  { key: "contrato", label: "Contrato assinado — boas-vindas" },
  { key: "perdido", label: "Perdido — reconquista" },
];

// decide automaticamente a situação com base na fase do funil + tempo sem contato
export function detectSituation(company: Company): Situation {
  const days = daysSince(company.last_contact_at);
  const stale = days === null || days > 6;

  switch (company.stage) {
    case "lead":
      return "lead";
    case "conexao":
      return stale ? "conexao_fria" : "conexao_quente";
    case "apres_agendada":
      return "apres_agendada";
    case "apres_realizada":
      return stale ? "apres_realizada_fria" : "apres_realizada_quente";
    case "proposta_agendada":
      return "proposta_agendada";
    case "proposta_realizada":
      return stale ? "proposta_realizada_fria" : "proposta_realizada_quente";
    case "contrato":
      return "contrato";
    case "perdido":
    default:
      return "perdido";
  }
}

function firstName(name: string | null): string {
  if (!name) return "";
  return name.trim().split(" ")[0];
}

interface Vars {
  contato: string;
  contatoComVirgula: string; // ", {nome}" ou "" se não tiver nome
  empresa: string;
  segmento: string;
}

function buildVars(company: Company): Vars {
  const nome = firstName(company.contact_person);
  return {
    contato: nome || "tudo bem",
    contatoComVirgula: nome ? `, ${nome}` : "",
    empresa: company.name,
    segmento: company.segment || "o que vocês fazem",
  };
}

const ORG_NAME = "Skema Consultoria Júnior";

export function generateMessages(company: Company, situation: Situation): string[] {
  const v = buildVars(company);

  const templates: Record<Situation, string[]> = {
    lead: [
      `Oi${v.contatoComVirgula}! Tudo bem? Aqui é a Gabi, da ${ORG_NAME} 🙂 Somos uma empresa júnior formada por universitários e trabalhamos com projetos de consultoria pra negócios como a ${v.empresa}. Vi vocês e achei que podemos ajudar bastante com ${v.segmento} — posso te apresentar rapidinho como funciona?`,
      `Oi${v.contatoComVirgula}, tudo certo? Sou a Gabi, da ${ORG_NAME}. A gente desenvolve projetos de consultoria com preço acessível justamente pensando em negócios como o de vocês. Queria entender melhor os desafios da ${v.empresa} hoje — topa uma conversa rápida essa semana?`,
      `Olá${v.contatoComVirgula}! Aqui é a Gabi, representando a ${ORG_NAME}, empresa júnior de consultoria. Estive conhecendo a ${v.empresa} e enxerguei oportunidades interessantes em ${v.segmento}. Posso te mandar mais detalhes sobre como a gente trabalha?`,
    ],
    conexao_quente: [
      `Oi${v.contatoComVirgula}, tudo bem? Que bom falar com você! Fico à disposição pra qualquer dúvida sobre a ${ORG_NAME}. Topa marcarmos uma apresentação rapidinha sobre como podemos ajudar a ${v.empresa}?`,
      `Oi${v.contatoComVirgula}! Passando pra dar continuidade à nossa conversa. Consegue me contar quais são as principais dores da ${v.empresa} hoje? Assim já vejo o melhor jeito de apresentar nosso trabalho.`,
      `Oi${v.contatoComVirgula}, tudo certo? Fico feliz com o contato! Que tal agendarmos uns 20 minutinhos essa semana pra eu te mostrar como a ${ORG_NAME} pode ajudar?`,
    ],
    conexao_fria: [
      `Oi${v.contatoComVirgula}! Faz um tempinho que a gente não troca uma ideia rs. Ainda faz sentido marcarmos aquela conversa sobre a ${v.empresa}? Fico à disposição pra retomar quando for bom pra você.`,
      `Oi${v.contatoComVirgula}, tudo bem? Passando aqui pra saber se ainda faz sentido conversarmos sobre um projeto de consultoria com a ${ORG_NAME}. Sem pressa, só não queria deixar esfriar!`,
      `Oi${v.contatoComVirgula}! Sumi um pouco, mas segui pensando em como a ${ORG_NAME} pode ajudar a ${v.empresa}. Vale a pena marcarmos aquela apresentação?`,
    ],
    apres_agendada: [
      `Oi${v.contatoComVirgula}! Só confirmando nosso papo sobre a apresentação da ${ORG_NAME} — segue de pé? Qualquer imprevisto, me avisa que a gente reagenda numa boa.`,
      `Oi${v.contatoComVirgula}, tudo certo? Passando pra lembrar da nossa apresentação combinada. Fico animada pra te mostrar como podemos ajudar a ${v.empresa}!`,
      `Oi${v.contatoComVirgula}! Confirmando por aqui nosso horário da apresentação. Precisa de mais alguma informação antes da nossa conversa?`,
    ],
    apres_realizada_quente: [
      `Oi${v.contatoComVirgula}! Foi ótimo apresentar o trabalho da ${ORG_NAME} pra vocês. Fico à disposição pra qualquer dúvida — topamos marcar a reunião de proposta?`,
      `Oi${v.contatoComVirgula}, tudo bem? Obrigada pela atenção na nossa apresentação! O que achou até agora? Posso já ir preparando a proposta pra ${v.empresa}.`,
      `Oi${v.contatoComVirgula}! Fico no aguardo do seu retorno sobre a apresentação. Quer que eu já agende nossa próxima conversa pra falarmos de proposta?`,
    ],
    apres_realizada_fria: [
      `Oi${v.contatoComVirgula}, tudo bem? Faz um tempo desde nossa apresentação e não quero deixar esfriar. Ainda faz sentido pra ${v.empresa} seguirmos com a proposta?`,
      `Oi${v.contatoComVirgula}! Sei que a rotina é corrida — só passando pra saber se ficou alguma dúvida da nossa apresentação ou se posso já seguir com a proposta.`,
      `Oi${v.contatoComVirgula}, tudo certo? Não quero ser insistente, só quero entender se ainda faz sentido darmos continuidade depois da nossa apresentação.`,
    ],
    proposta_agendada: [
      `Oi${v.contatoComVirgula}! Confirmando nossa reunião de proposta — segue de pé o horário combinado?`,
      `Oi${v.contatoComVirgula}, tudo certo? Passando pra lembrar da nossa conversa sobre a proposta. Já estou preparando tudo com carinho pra ${v.empresa}!`,
      `Oi${v.contatoComVirgula}! Só confirmando nosso encontro pra apresentar a proposta. Precisa de mais alguma informação antes?`,
    ],
    proposta_realizada_quente: [
      `Oi${v.contatoComVirgula}! Como estamos ficando com a proposta? Quero muito fecharmos essa consultoria da melhor forma pra vocês — me conta o que falta pra avançarmos.`,
      `Oi${v.contatoComVirgula}, tudo bem? Sinto que estamos bem perto de fechar. Consigo te ajudar a resolver algum ponto do contrato ou do investimento que ainda esteja em aberto?`,
      `Oi${v.contatoComVirgula}! Seguimos alinhados pra fecharmos o projeto de consultoria com a ${ORG_NAME}? Fico à disposição pra ajustar o que for preciso.`,
    ],
    proposta_realizada_fria: [
      `Oi${v.contatoComVirgula}, tudo certo? Ficamos paradas depois da proposta e não quero deixar isso esfriar. O que acha de marcarmos uma conversa rápida essa semana pra destravar?`,
      `Oi${v.contatoComVirgula}! Faz um tempo desde nossa última conversa sobre fecharmos com a ${v.empresa}. Ainda faz sentido pra vocês? Se surgiu alguma dúvida sobre valores ou prazos, fico à vontade pra conversar.`,
      `Oi${v.contatoComVirgula}, tudo bem? Não quero ser insistente, só quero entender se ainda dá pra avançarmos com o projeto ou se é melhor eu retomar em outro momento.`,
    ],
    contrato: [
      `Oi${v.contatoComVirgula}! Que alegria ter a ${v.empresa} como cliente da ${ORG_NAME} agora 🎉 Nosso time já vai começar a se organizar pro projeto. Qualquer coisa, estou por aqui!`,
      `Oi${v.contatoComVirgula}, tudo certo? Muito feliz em fechar essa consultoria com vocês! Vamos alinhar os próximos passos e a equipe do projeto quando for bom pra você?`,
      `Oi${v.contatoComVirgula}! Obrigada pela confiança na ${ORG_NAME}. Sejam muito bem-vindos — qualquer dúvida no início do projeto, é só me chamar por aqui.`,
    ],
    perdido: [
      `Oi${v.contatoComVirgula}, tudo bem? Faz um tempo que não conversamos, e sei que muita coisa muda numa empresa. Será que faz sentido retomarmos aquela conversa sobre consultoria com a ${ORG_NAME}? Sem compromisso, só queria saber como andam as coisas na ${v.empresa}.`,
      `Oi${v.contatoComVirgula}! Lembrei de vocês da ${v.empresa} e fiquei pensando se o momento mudou por aí. A ${ORG_NAME} continua à disposição se quiserem retomar a conversa sobre o projeto.`,
      `Oi${v.contatoComVirgula}, tudo certo? Sei que da última vez não rolou, mas gostaria muito de entender se hoje faz mais sentido pra vocês. Posso te contar sobre novos projetos que fizemos desde então?`,
    ],
  };

  return templates[situation];
}
