const XLSX = require("xlsx");
const fs = require("fs");
const f = "C:/Users/herman/Downloads/f765dba3-08ea-4571-8e53-fd73bfb21bf7.xlsx";

const wb = XLSX.read(fs.readFileSync(f), { type: "buffer", cellDates: true, raw: false });
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });
console.log("Total baris:", rows.length);

// Temukan header & kolom TGL LAHIR
let hIdx = 0;
for (let i = 0; i < Math.min(rows.length, 10); i++) {
  const rs = rows[i].map(x => String(x || "").toUpperCase()).join("|");
  if (rs.includes("NO. KK") || rs.includes("NIK")) { hIdx = i; break; }
}
const head = rows[hIdx].map(x => String(x || "").toUpperCase().trim());
const colTgl = head.findIndex(h => h.includes("LAHIR"));
const colNama = head.findIndex(h => h.includes("NAMA"));
console.log("Header baris:", hIdx, "| kolom TGL LAHIR:", colTgl, "| kolom NAMA:", colNama);

// Tampilkan 8 nilai tanggal pertama dengan TIPE lengkap
let n = 0;
for (let i = hIdx + 1; i < rows.length && n < 8; i++) {
  const nama = rows[i][colNama];
  const tgl = rows[i][colTgl];
  if (!String(nama || "").trim()) continue;
  n++;
  console.log(`${String(nama).trim()}:`);
  console.log(`   typeof: ${typeof tgl} | instanceof Date: ${tgl instanceof Date} | nilai: ${JSON.stringify(tgl)}`);
}
