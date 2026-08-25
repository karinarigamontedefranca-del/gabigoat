import { Company } from "./types";
import { daysSince } from "./utils";

export type Situation =
  | "lead"
  | "contato_quente"
  | "contato_frio"
  | "proposta_quente"
  | "proposta_fria"
  | "negociacao_quente"
  | "negociacao_fria"
  | "ganho"
  | "perdido";

export const SITUATIONS: { key: Situation; label: string }[] = [
  { key: "lead", label: "Primeiro contato" },
  { key: "contato_quente", label: "Em conversa (recente)" },
  { key: "contato_frio", label: "Em conversa (esfriando)" },
  { key: "proposta_quente", label: "Proposta enviada (recente)" },
  { key: "proposta_fria", label: "Proposta enviada (esfriando)" },
  { key: "negociacao_quente", label: "Negociação (recente)" },
  { key: "negociacao_fria", label: "Negociação (esfriando)" },
  { key: "ganho", label: "Fechado — boas-vindas" },
  { key: "perdido", label: "Perdido — reconquista" },
];

// decide automaticamente a situação com base no estágio + tempo sem contato
export function detectSituation(company: Company): Situation {
  const days = daysSince(company.last_contact_at);
  const stale = days === null || days > 6;

  switch (company.stage) {
    case "lead":
      return "lead";
    case "contato":
      return stale ? "contato_frio" : "contato_quente";
    case "proposta":
      return stale ? "proposta_fria" : "proposta_quente";
    case "negociacao":
      return stale ? "negociacao_fria" : "negociacao_quente";
    case "ganho":
      return "ganho";
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
    contato_quente: [
      `Oi${v.contatoComVirgula}, tudo bem? Seguindo nossa conversa sobre o projeto de consultoria com a ${ORG_NAME} — fico à disposição pra qualquer dúvida que tenha surgido. O que achou até agora?`,
      `Oi${v.contatoComVirgula}! Passando pra dar continuidade ao que a gente tava alinhando. Consegue me contar quais são as principais dores da ${v.empresa} hoje pra eu já ir moldando a proposta?`,
      `Oi${v.contatoComVirgula}, tudo certo? Fico feliz com o andamento da nossa conversa. Quer que eu te mande um material com mais detalhes sobre nossos projetos pra vocês avaliarem com calma?`,
    ],
    contato_frio: [
      `Oi${v.contatoComVirgula}! Faz um tempinho que a gente não troca uma ideia rs. Ainda faz sentido pra ${v.empresa} conversarmos sobre o projeto de consultoria? Fico à disposição pra retomar quando for bom pra você.`,
      `Oi${v.contatoComVirgula}, tudo bem? Passando aqui pra saber se ficou alguma dúvida sobre a proposta de consultoria da ${ORG_NAME} ou se rolou alguma mudança de prioridade aí na ${v.empresa}. Sem pressa, só não queria deixar esfriar!`,
      `Oi${v.contatoComVirgula}! Sumi um pouco, mas segui pensando em como a ${ORG_NAME} pode ajudar a ${v.empresa}. Vale a pena retomarmos essa conversa?`,
    ],
    proposta_quente: [
      `Oi${v.contatoComVirgula}! Passando pra saber se conseguiu dar uma olhada na proposta de consultoria que te enviei. Fico à disposição pra qualquer ajuste que fizer sentido pra vocês.`,
      `Oi${v.contatoComVirgula}, tudo certo? Fico no aguardo do seu retorno sobre a proposta — qualquer ponto do escopo que quiser discutir, é só me chamar.`,
      `Oi${v.contatoComVirgula}! Só confirmando se a proposta da ${ORG_NAME} chegou certinho aí. Posso esclarecer algum detalhe do projeto antes de vocês decidirem?`,
    ],
    proposta_fria: [
      `Oi${v.contatoComVirgula}, tudo bem? Sei que a rotina é corrida — só passando pra saber se a proposta de consultoria ainda faz sentido pra ${v.empresa}, ou se posso ajustar o escopo pro momento de vocês agora.`,
      `Oi${v.contatoComVirgula}! Faz um tempo que te mandei a proposta e não quero deixar isso parado. Consigo te ajudar a decidir com mais alguma informação sobre o projeto?`,
      `Oi${v.contatoComVirgula}, tudo certo? Queria entender se a proposta ainda está no radar de vocês ou se mudou algo aí na ${v.empresa}. De qualquer forma, sigo à disposição.`,
    ],
    negociacao_quente: [
      `Oi${v.contatoComVirgula}! Como estamos ficando com a negociação do projeto? Quero muito fecharmos essa consultoria da melhor forma pra vocês — me conta o que falta pra avançarmos.`,
      `Oi${v.contatoComVirgula}, tudo bem? Sinto que estamos bem perto de fechar. Consigo te ajudar a resolver algum ponto do contrato ou do investimento que ainda esteja em aberto?`,
      `Oi${v.contatoComVirgula}! Seguimos alinhados pra fecharmos o projeto de consultoria com a ${ORG_NAME}? Fico à disposição pra ajustar o que for preciso.`,
    ],
    negociacao_fria: [
      `Oi${v.contatoComVirgula}, tudo certo? Ficamos paradas na negociação e não quero deixar isso esfriar. O que acha de marcarmos uma conversa rápida essa semana pra destravar?`,
      `Oi${v.contatoComVirgula}! Faz um tempo desde nossa última conversa sobre fecharmos a consultoria com a ${v.empresa}. Ainda faz sentido pra vocês? Se surgiu alguma dúvida sobre valores ou prazos, fico à vontade pra conversar.`,
      `Oi${v.contatoComVirgula}, tudo bem? Não quero ser insistente, só quero entender se ainda dá pra avançarmos com o projeto ou se é melhor eu retomar em outro momento.`,
    ],
    ganho: [
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
