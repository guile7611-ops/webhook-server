const client = require("../openai");

async function extractBudgetData(conversationText) {
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: `
Analise a conversa de WhatsApp abaixo e extraia dados para geração de orçamento.

Regras:
- Não invente informações.
- Se não souber, use null.
- Retorne somente um JSON puro.
- Não use bloco de código.
- Não use markdown.

Conversa:
${conversationText}

Formato esperado:
{
  "cliente_nome": null,
  "servico": null,
  "quantidade": null,
  "detalhes": null,
  "observacoes": null
}
`,
  });

  let text = response.output_text.trim();

  text = text.replace(/```json/g, "").replace(/```/g, "").trim();

  return JSON.parse(text);
}

module.exports = { extractBudgetData };