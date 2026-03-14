const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

async function generateBudgetPDF(budget){

  const filePath = path.join(__dirname,"../pdfs",`orcamento-${budget.id}.pdf`);

  const doc = new PDFDocument();

  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).text("ORÇAMENTO");

  doc.moveDown();
  doc.text(`Cliente: ${budget.dados_json.cliente_nome}`);
  doc.text(`Serviço: ${budget.dados_json.servico}`);
  doc.text(`Quantidade: ${budget.dados_json.quantidade}`);
  doc.text(`Detalhes: ${budget.dados_json.detalhes}`);

  doc.end();

  return filePath;
}

module.exports = generateBudgetPDF;