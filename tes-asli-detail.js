const XLSX = require("xlsx");
const fs = require("fs");
const f = "C:/Users/herman/Downloads/APLIKASI KEPENDUDUKAN EXCEL.xlsx";
const wb = XLSX.read(fs.readFileSync(f), { type: "buffer", cellDates: true, raw: false });
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });
console.log("Total baris:", rows.length, "| kolom max:", Math.max(...rows.map(r => r.length)));
for (let i = 0; i < Math.min(8, rows.length); i++) {
  console.log("\n=== BARIS " + i + " ===");
  rows[i].forEach((c, j) => { if (String(c).trim()) console.log("  kolom[" + j + "]:", JSON.stringify(String(c).trim().substring(0, 40))); });
}
// cari baris yang memuat NIK & nama lengkap pertama kali
for (let i = 0; i < rows.length; i++) {
  const j = JSON.stringify(rows[i]);
  if (j.includes("NIK") || j.includes("Nama Lengkap")) { console.log("\n>>> Header kemungkinan di baris " + i); break; }
}
