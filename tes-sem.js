const XLSX = require("xlsx");
const fs = require("fs");
const f = "C:/Users/herman/Downloads/4dfa47e0-354b-4a17-958a-ed57eb756fee.xlsx";
const wb = XLSX.read(fs.readFileSync(f), { type: "buffer", cellDates: true, raw: false });
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });
console.log("Sheet:", wb.SheetNames, "| Total baris:", rows.length);
for (let i = 0; i < Math.min(8, rows.length); i++) {
  console.log("\n=== BARIS " + i + " ===");
  rows[i].forEach((c, j) => { if (String(c).trim()) console.log("  kolom[" + j + "]:", JSON.stringify(String(c).trim().substring(0, 35))); });
}
