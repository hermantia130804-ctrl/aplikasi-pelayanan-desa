const XLSX = require("xlsx");
const fs = require("fs");
const files = [
  "C:/Users/herman/Downloads/data-penduduk-2026-05-08.xlsx",
  "C:/Users/herman/Downloads/Data Penduduk_update data EDIT.xlsx",
  "C:/Users/herman/Downloads/Data Penduduk_update data.xlsx",
  "C:/Users/herman/Downloads/APLIKASI KEPENDUDUKAN EXCEL.xlsx",
];
for (const f of files) {
  try {
    const wb = XLSX.read(fs.readFileSync(f), { type: "buffer", cellDates: true, raw: false });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });
    console.log("\n######## " + f.split("/").pop() + " | baris: " + rows.length + " | kolom: " + (rows[0]?.length ?? 0));
    for (let i = 0; i < Math.min(3, rows.length); i++) {
      console.log("-- baris " + i + ":", JSON.stringify(rows[i].map(c => String(c).trim().substring(0, 25))));
    }
  } catch (e) { console.log("\n######## " + f.split("/").pop() + " GAGAL: " + e.message); }
}
