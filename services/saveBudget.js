const pool = require("../db");

async function saveBudget(telefone, dados) {
  const result = await pool.query(
    "INSERT INTO budgets (telefone, dados_json) VALUES ($1, $2::jsonb) RETURNING *",
    [telefone, JSON.stringify(dados)]
  );

  return result.rows[0];
}

module.exports = saveBudget;
