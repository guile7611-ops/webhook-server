const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const dotenv = require("dotenv");
const { extractBudgetData } = require("./services/extractBudgetData");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

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

    if (!telefone) {
      return res.status(400).json({
        error: "telefone_obrigatorio",
        message: "Envie o telefone no body da requisição",
      });
    }

    const result = await pool.query(
      "SELECT mensagem, created_at FROM conversations WHERE telefone = $1 ORDER BY created_at ASC",
      [telefone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "conversa_nao_encontrada",
        message: "Nenhuma conversa encontrada para esse telefone",
      });
    }

    const conversationText = result.rows
      .filter((row) => row.mensagem && row.mensagem.trim() !== "")
      .map((row, index) => `[${index + 1}] ${row.mensagem}`)
      .join("\n");

    const dadosExtraidos = await extractBudgetData(conversationText);

    return res.status(200).json({
      telefone,
      total_mensagens: result.rows.length,
      dados_extraidos: dadosExtraidos,
    });
  } catch (error) {
    console.error("Erro ao gerar orçamento:", error.message);

    return res.status(500).json({
      error: "internal_error",
      message: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});