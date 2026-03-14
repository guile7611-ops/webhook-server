const client = require("../openai");

function extractJsonFromText(text) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const possibleJson = cleaned.slice(firstBrace, lastBrace + 1);
      return JSON.parse(possibleJson);
    }

    throw new Error("A OpenAI não retornou um JSON válido.");
  }
}

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
- quantidade deve ser número inteiro ou null.

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
`
  });

  const text = response.output_text?.trim();

  if (!text) {
    throw new Error("A OpenAI retornou uma resposta vazia.");
  }

  const parsed = extractJsonFromText(text);

  return {
    cliente_nome: parsed.cliente_nome ?? null,
    servico: parsed.servico ?? null,
    quantidade:
      typeof parsed.quantidade === "number"
        ? parsed.quantidade
        : parsed.quantidade && !Number.isNaN(Number(parsed.quantidade))
        ? Number(parsed.quantidade)
        : null,
    detalhes: parsed.detalhes ?? null,
    observacoes: parsed.observacoes ?? null
  };
}

module.exports = { extractBudgetData };
