const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const pool = require("./db");
const { extractBudgetData } = require("./services/extractBudgetData");
const saveBudget = require("./services/saveBudget");
const generateBudgetHTML = require("./services/generateBudgetHTML");

dotenv.config();

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(cors());

async function createTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        telefone TEXT,
        mensagem TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        telefone TEXT NOT NULL,
        dados_json JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Tabelas prontas");
  } catch (error) {
    console.error("Erro ao criar tabelas:", error.message);
  }
}

createTables();

console.log("Chave OpenAI carregada:", !!process.env.OPENAI_API_KEY);

app.get("/", (req, res) => {
  return res.status(200).send("Webhook server online");
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Erro no healthcheck:", error.message);
    return res.status(500).json({ status: "error" });
  }
});

app.post("/webhook", async (req, res) => {
  try {
    const data = req.body;

    const numero = data?.data?.key?.remoteJid || null;
    const mensagem =
      data?.data?.message?.conversation ||
      data?.data?.message?.extendedTextMessage?.text ||
      data?.data?.message?.imageMessage?.caption ||
      data?.data?.message?.videoMessage?.caption ||
      null;

    console.log("Mensagem recebida");
    console.log("Número:", numero);
    console.log("Mensagem:", mensagem);

    if (numero && mensagem) {
      await pool.query(
        "INSERT INTO conversations (telefone, mensagem) VALUES ($1, $2)",
        [numero, mensagem]
      );

      console.log("Mensagem salva no banco");
    }

    return res.status(200).json({
      status: "received"
    });
  } catch (error) {
    console.error("Erro no webhook:", error.message);

    return res.status(500).json({
      error: "internal_error"
    });
  }
});

app.get("/conversations/:telefone", async (req, res) => {
  try {
    const { telefone } = req.params;

    const result = await pool.query(
      "SELECT * FROM conversations WHERE telefone = $1 ORDER BY created_at ASC, id ASC",
      [telefone]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar conversas:", error.message);

    return res.status(500).json({
      error: "internal_error"
    });
  }
});

app.post("/generate-budget", async (req, res) => {
  try {
    const { telefone } = req.body;

    if (!telefone) {
      return res.status(400).json({
        error: "Telefone é obrigatório"
      });
    }

    const messagesResult = await pool.query(
      `
      SELECT * FROM conversations
      WHERE telefone = $1
      ORDER BY created_at ASC, id ASC
      `,
      [telefone]
    );

    const mensagens = messagesResult.rows;

    if (mensagens.length === 0) {
      return res.status(404).json({
        error: "Nenhuma conversa encontrada para este telefone"
      });
    }

    const conversationText = mensagens
      .map((msg) => msg.mensagem)
      .filter(Boolean)
      .join("\n");

    if (!conversationText.trim()) {
      return res.status(400).json({
        error: "A conversa encontrada não possui mensagens válidas"
      });
    }

    const dadosExtraidos = await extractBudgetData(conversationText);
    const budgetSalvo = await saveBudget(telefone, dadosExtraidos);

    return res.status(200).json({
      telefone,
      total_mensagens: mensagens.length,
      dados_extraidos: dadosExtraidos,
      budget_salvo: budgetSalvo,
      links: {
        api: `/budget/${budgetSalvo.id}`,
        visualizar_html: `/budget/${budgetSalvo.id}/view`
      }
    });
  } catch (error) {
    console.error("Erro ao gerar orçamento:", error.message);

    return res.status(500).json({
      error: "Erro ao gerar orçamento",
      details: error.message
    });
  }
});

app.get("/budgets/:telefone", async (req, res) => {
  try {
    const { telefone } = req.params;

    const result = await pool.query(
      `
      SELECT * FROM budgets
      WHERE telefone = $1
      ORDER BY created_at DESC, id DESC
      `,
      [telefone]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar orçamentos:", error.message);

    return res.status(500).json({
      error: "Erro interno ao buscar orçamentos"
    });
  }
});

app.get("/budget/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM budgets WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Orçamento não encontrado"
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao buscar orçamento:", error.message);

    return res.status(500).json({
      error: "Erro interno ao buscar orçamento"
    });
  }
});

app.get("/budget/:id/view", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM budgets WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("<h1>Orçamento não encontrado</h1>");
    }

    const budget = result.rows[0];
    const html = generateBudgetHTML(budget);

    return res.status(200).type("html").send(html);
  } catch (error) {
    console.error("Erro ao renderizar orçamento HTML:", error.message);

    return res.status(500).send("<h1>Erro ao renderizar orçamento</h1>");
  }
});

app.get("/budget/:id/html", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM budgets WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Orçamento não encontrado"
      });
    }

    const budget = result.rows[0];
    const html = generateBudgetHTML(budget);

    return res.status(200).json({
      id: budget.id,
      telefone: budget.telefone,
      html
    });
  } catch (error) {
    console.error("Erro ao gerar HTML do orçamento:", error.message);

    return res.status(500).json({
      error: "Erro ao gerar HTML do orçamento"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
