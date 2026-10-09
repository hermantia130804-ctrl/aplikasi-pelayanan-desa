const XLSX = require("xlsx");
const fs = require("fs");
const f = "C:/Users/herman/Downloads/APLIKASI KEPENDUDUKAN EXCEL.xlsx";
const wb = XLSX.read(fs.readFileSync(f), { type: "buffer", cellDates: true, raw: false });
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });

// Cari baris yang memuat kata kunci header/data
for (let i = 0; i < Math.min(rows.length, 30); i++) {
  const j = rows[i].map(c => String(c).trim()).join("|").toUpperCase();
  if (j.includes("NIK") || j.includes("NAMA LENGKAP") || j.includes("NO. KK") || j.includes("NAMA ORANG TUA")) {
    console.log(">>> BARIS " + i + " (kandidat header/awal data):");
    rows[i].forEach((c, k) => { if (String(c).trim()) console.log("   kolom[" + k + "]:", JSON.stringify(String(c).trim().substring(0, 40))); });
  }
}
console.log("\n=== BARIS 8-20 UTUH ===");
for (let i = 8; i < Math.min(21, rows.length); i++) {
  console.log("-- baris " + i + ":", JSON.stringify(rows[i].map(c => String(c).trim().substring(0, 22)).filter(x => x)));
}
