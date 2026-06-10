import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FinancialData } from "../types";
import { formatCurrency } from "./utils"; // we'll define formatCurrency in utils right now

export function exportToCSV(data: FinancialData) {
  const rows = [
    ["Categoria", "Valor"],
    ["Salário Base", data.salary.toString()],
    ["Investimento Mensal (20%)", data.monthlyInvestment.toString()],
    ["Despesas Fixas (50%)", data.fixedExpenses.toString()],
    ["Gastos Variáveis / Passar o mês (30%)", data.variableExpenses.toString()],
    ["Meta - Reserva (6x)", data.shortTermGoal.toString()],
    ["Meta - Independência (93x)", data.longTermGoal.toString()]
  ];

  let csvContent = "data:text/csv;charset=utf-8,";
  rows.forEach(function(rowArray) {
    let row = rowArray.join(",");
    csvContent += row + "\r\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "relatorio_financeiro.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(data: FinancialData) {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text("Relatório de Planejamento Financeiro", 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text("Resumo gerado automaticamente com base no seu salário", 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [['Indicador de Performance', 'Valor Alocado']],
    body: [
      ['Salário Declarado', formatCurrency(data.salary)],
      ['Investimento Mensal Recomendado (20%)', formatCurrency(data.monthlyInvestment)],
      ['Orçamento: Despesas Fixas (50%)', formatCurrency(data.fixedExpenses)],
      ['Orçamento: Variáveis / Lazer (30%)', formatCurrency(data.variableExpenses)],
      ['Meta: Reserva de Emergência (6 meses)', formatCurrency(data.shortTermGoal)],
      ['Meta: Independência Financeira (93 meses)', formatCurrency(data.longTermGoal)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [240, 240, 240] }
  });

  doc.save('relatorio_financeiro.pdf');
}
