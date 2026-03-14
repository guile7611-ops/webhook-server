function escapeHtml(value) {
  if (value === null || value === undefined) return "—";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return escapeHtml(value);

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

function generateBudgetHTML(budget) {
  const dados = budget?.dados_json || {};

  const cliente = escapeHtml(dados.cliente_nome || "Não informado");
  const servico = escapeHtml(dados.servico || "Não informado");
  const quantidade = escapeHtml(dados.quantidade ?? "Não informado");
  const detalhes = escapeHtml(dados.detalhes || "Não informado");
  const observacoes = escapeHtml(dados.observacoes || "Sem observações");
  const telefone = escapeHtml(budget.telefone || "Não informado");
  const criadoEm = formatDate(budget.created_at);
  const id = escapeHtml(budget.id);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Orçamento #${id}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      background: linear-gradient(135deg, #0f172a, #1e293b 45%, #334155);
      color: #0f172a;
      padding: 24px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    .card {
      background: #ffffff;
      border-radius: 24px;
      padding: 32px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      overflow: hidden;
    }
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      background: #dbeafe;
      color: #1d4ed8;
      padding: 8px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 14px;
    }
    h1 {
      margin: 0;
      font-size: 34px;
      line-height: 1.1;
    }
    .subtitle {
      margin-top: 10px;
      color: #475569;
      font-size: 15px;
    }
    .meta {
      text-align: right;
      min-width: 220px;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 16px;
    }
    .meta-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }
    .meta-value {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 14px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      margin-top: 28px;
    }
    .item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 20px;
    }
    .item.full {
      grid-column: 1 / -1;
    }
    .label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 8px;
      font-weight: 700;
    }
    .value {
      font-size: 18px;
      color: #0f172a;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .footer {
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 14px;
    }
    .actions {
      margin-top: 24px;
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .button {
      text-decoration: none;
      border-radius: 14px;
      padding: 12px 18px;
      font-weight: 700;
      font-size: 14px;
      border: 1px solid #cbd5e1;
      color: #0f172a;
      background: #ffffff;
    }
    .button.primary {
      background: #0f172a;
      color: #ffffff;
      border-color: #0f172a;
    }
    @media (max-width: 700px) {
      body { padding: 14px; }
      .card { padding: 20px; border-radius: 20px; }
      .grid { grid-template-columns: 1fr; }
      .meta { text-align: left; width: 100%; }
      h1 { font-size: 28px; }
      .value { font-size: 16px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="topbar">
        <div>
          <div class="badge">Orçamento automático</div>
          <h1>Orçamento #${id}</h1>
          <div class="subtitle">Visual gerado a partir da conversa do WhatsApp.</div>
        </div>
        <div class="meta">
          <div class="meta-box">
            <div class="meta-label">Telefone</div>
            <div class="meta-value">${telefone}</div>
            <div class="meta-label">Criado em</div>
            <div class="meta-value">${criadoEm}</div>
          </div>
        </div>
      </div>

      <div class="grid">
        <div class="item">
          <div class="label">Cliente</div>
          <div class="value">${cliente}</div>
        </div>

        <div class="item">
          <div class="label">Quantidade</div>
          <div class="value">${quantidade}</div>
        </div>

        <div class="item full">
          <div class="label">Serviço</div>
          <div class="value">${servico}</div>
        </div>

        <div class="item full">
          <div class="label">Detalhes</div>
          <div class="value">${detalhes}</div>
        </div>

        <div class="item full">
          <div class="label">Observações</div>
          <div class="value">${observacoes}</div>
        </div>
      </div>

      <div class="actions">
        <a class="button primary" href="/budget/${id}">Ver JSON</a>
        <a class="button" href="/budgets/${telefone}">Ver outros orçamentos do telefone</a>
      </div>

      <div class="footer">
        Este HTML já pode ser usado como página de orçamento. No próximo passo, dá para adicionar valor total, itens, prazo, condições de pagamento e botão para enviar no WhatsApp.
      </div>
    </div>
  </div>
</body>
</html>`;
}

module.exports = generateBudgetHTML;
