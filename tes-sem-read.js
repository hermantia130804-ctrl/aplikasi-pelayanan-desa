const XLSX = require("xlsx");
const wb = XLSX.read(require("fs").readFileSync("tes-sem.xlsx"), { type: "buffer", cellDates: true, raw: false });
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });
console.log("Sheet:", wb.SheetNames, "| Total baris:", rows.length);
for (let i = 0; i < Math.min(8, rows.length); i++) {
  console.log("\n=== BARIS " + i + " ===");
  rows[i].forEach((c, j) => { if (String(c).trim()) console.log("  kolom[" + j + "]:", JSON.stringify(String(c).trim().substring(0, 35))); });
}
