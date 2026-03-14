const pool = require("../db");

async function saveBudget(telefone, dadosExtraidos) {
  const query = `
    INSERT INTO budgets (telefone, dados_json)
    VALUES ($1, $2::jsonb)
    RETURNING *;
  `;

  const values = [telefone, JSON.stringify(dadosExtraidos)];

  const result = await pool.query(query, values);

  return result.rows[0];
}

module.exports = saveBudget;