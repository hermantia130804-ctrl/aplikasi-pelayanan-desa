const XLSX = require("xlsx");
const wb = XLSX.read(require("fs").readFileSync("tes-impor.xlsx"), { type: "buffer", cellDates: true, raw: false });
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
console.log("Total baris:", rows.length);
for (let i = 0; i < Math.min(6, rows.length); i++) {
  console.log(`\n=== BARIS ${i} (${rows[i].length} kolom) ===`);
  rows[i].forEach((c, j) => { if (String(c).trim()) console.log(`  kolom[${j}]:`, JSON.stringify(String(c).trim().substring(0, 40))); });
}
