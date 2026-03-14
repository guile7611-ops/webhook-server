const client = require("../openai");

async function extractBudgetData(conversationText) {
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: `
Analise a conversa de WhatsApp abaixo e extraia dados para geração de orçamento.

Conversa:
${conversationText}

Retorne apenas JSON no formato:

{
  "cliente_nome": null,
  "servico": null,
  "quantidade": null,
  "detalhes": null,
  "observacoes": null
}
`,
  });

  return response.output_text;
}

module.exports = { extractBudgetData };