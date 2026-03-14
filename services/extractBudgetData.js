const client = require("../openai");

async function extractBudgetData(conversationText) {
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: `
Você é um assistente especializado em analisar conversas de WhatsApp e extrair dados para geração de orçamento.

Sua tarefa é ler a conversa e retornar apenas os dados estruturados do pedido do cliente.

Regras:
- Não invente informações.
- Se não souber algum campo, use null.
- Identifique o serviço principal solicitado.
- Identifique quantidade, detalhes e observações quando existirem.
- Retorne somente os campos definidos no schema.
        `.trim(),
      },
      {
        role: "user",
        content: `Conversa:\n\n${conversationText}`,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "orcamento_extraido",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            cliente_nome: { type: ["string", "null"] },
            servico: { type: ["string", "null"] },
            quantidade: { type: ["number", "null"] },
            detalhes: { type: ["string", "null"] },
            observacoes: { type: ["string", "null"] },
          },
          required: [
            "cliente_nome",
            "servico",
            "quantidade",
            "detalhes",
            "observacoes",
          ],
        },
      },
    },
  });

  return JSON.parse(response.output_text);
}

module.exports = { extractBudgetData };