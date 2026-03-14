const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

async function generateBudgetPDF(budget) {

  const fileName = `orcamento-${budget.id}.pdf`;
  const filePath = path.join(__dirname, `../pdfs/${fileName}`);

  const doc = new PDFDocument();

  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).text("ORÇAMENTO", { align: "center" });

  doc.moveDown();

  doc.fontSize(14).text(`Cliente: ${budget.dados_json.cliente_nome || "-"}`);
  doc.text(`Serviço: ${budget.dados_json.servico || "-"}`);
  doc.text(`Quantidade: ${budget.dados_json.quantidade || "-"}`);

  doc.moveDown();

  doc.text(`Detalhes: ${budget.dados_json.detalhes || "-"}`);

  doc.moveDown();

  doc.text(`Observações: ${budget.dados_json.observacoes || "-"}`);

  doc.moveDown();

  doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`);

  doc.end();

  return filePath;
}

module.exports = generateBudgetPDF;