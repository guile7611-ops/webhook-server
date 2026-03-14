const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const dotenv = require("dotenv");
const { extractBudgetData } = require("./services/extractBudgetData");
const saveBudget = require("./services/saveBudget");
const pool = require("./db");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());



async function createTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        telefone TEXT,
        mensagem TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Tabela conversations pronta");
  } catch (error) {
    console.error("Erro ao criar tabela:", error.message);
  }
}

createTable();

console.log("Chave OpenAI carregada:", !!process.env.OPENAI_API_KEY);

app.get("/", (req, res) => {
  res.send("Webhook server online");
});

app.post("/webhook", async (req, res) => {
  try {
    const data = req.body;

    const numero = data?.data?.key?.remoteJid || null;
    const mensagem =
      data?.data?.message?.conversation ||
      data?.data?.message?.extendedTextMessage?.text ||
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
    

    return res.status(200).json({ status: "received" });
  } catch (error) {
    console.error("Erro no webhook:", error.message);
    return res.status(500).json({ error: "internal_error" });
  }
});

app.get("/conversations/:telefone", async (req, res) => {
  try {
    const { telefone } = req.params;

    const result = await pool.query(
      "SELECT * FROM conversations WHERE telefone = $1 ORDER BY created_at ASC",
      [telefone]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar conversas:", error.message);
    return res.status(500).json({ error: "internal_error" });
  }
});

app.post("/generate-budget", async (req, res) => {
  try {

    const { telefone } = req.body;

    const messagesResult = await pool.query(
      `
      SELECT * FROM conversations
      WHERE telefone = $1
      ORDER BY created_at ASC
      `,
      [telefone]
    );

    const mensagens = messagesResult.rows;

    const conversationText = mensagens
      .map((msg) => msg.mensagem)
      .join("\n");

    const dadosExtraidos = await extractBudgetData(conversationText);

    // NOVA LINHA (salva no banco)
    const budgetSalvo = await saveBudget(telefone, dadosExtraidos);

    res.json({
      telefone,
      total_mensagens: mensagens.length,
      dados_extraidos: dadosExtraidos,
      budget_salvo: budgetSalvo
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      erro: "Erro ao gerar orçamento"
    });
  }
});

const PORT = process.env.PORT || 3000;
app.get("/budgets/:telefone", async (req, res) => {
  try {
    const { telefone } = req.params;

    const result = await pool.query(
      `
      SELECT * FROM budgets
      WHERE telefone = $1
      ORDER BY created_at DESC
      `,
      [telefone]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar orçamentos:", error);
    res.status(500).json({
      error: "Erro interno ao buscar orçamentos"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});