const XLSX = require("xlsx");
const wb = XLSX.read(require("fs").readFileSync("template.xlsx"), { type: "buffer", cellDates: true, raw: false });
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });
console.log("Total baris:", rows.length);

// Logika SAMA dengan impor v2 terbaru (setelah patch deteksi + skip header 2)
let headerIdx = 0;
for (let i = 0; i < Math.min(rows.length, 10); i++) {
  const rs = rows[i].map(x => String(x || "").toUpperCase()).join("|");
  if (rs.includes("NIK") && (rs.includes("NAMA LENGKAP") || rs.includes("NO. KK") || rs.includes("NO KK"))) { headerIdx = i; break; }
}
console.log("Header terdeteksi di baris:", headerIdx);
console.log("Header:", JSON.stringify(rows[headerIdx].map(x => String(x).trim().substring(0, 18))));

const baris2 = rows[headerIdx + 1];
console.log("Baris setelah header (harus Ayah/Ibu → di-skip):", JSON.stringify(baris2.map(x => String(x).trim().substring(0, 15))));

let dataBaris = 0, lastNoKk = "";
const hasil = [];
for (let i = headerIdx + 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r || !r.some(x => String(x).trim())) continue;
  const rU = r.map(x => String(x).toUpperCase().trim());
  if (rU.includes("AYAH") || rU.includes("IBU")) continue;
  const nama = r[1]; const nik = String(r[2] ?? "").replace(/\D/g, "");
  if (!nama) continue;
  const kk = String(r[0] ?? "").replace(/\D/g, "");
  if (kk.length >= 8) lastNoKk = kk.padStart(16, "0").slice(-16);
  dataBaris++;
  if (hasil.length < 6) hasil.push({ nama: String(nama), nik: nik.substring(0, 16), kk: lastNoKk });
}
console.log("\n=== HASIL SIMULASI IMPOR ===");
console.log("Total baris data yang akan diproses:", dataBaris);
hasil.forEach(h => console.log("  ", JSON.stringify(h)));
