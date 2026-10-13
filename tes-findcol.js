const XLSX = require("xlsx");
const wb = XLSX.read(require("fs").readFileSync("tes-sem.xlsx"), { type: "buffer", cellDates: true, raw: false });
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });
let headerIdx = 0;
for (let i = 0; i < Math.min(rows.length, 10); i++) {
  const rs = rows[i].map(x => String(x || "").toUpperCase()).join("|");
  if (rs.includes("NIK")) { headerIdx = i; break; }
}
const head1 = (rows[headerIdx] || []).map(x => String(x || "").toUpperCase().trim());
const head2 = (rows[headerIdx + 1] || []).map(x => String(x || "").toUpperCase().trim());
console.log("headerIdx:", headerIdx);
console.log("head1:", JSON.stringify(head1));
console.log("head2:", JSON.stringify(head2));
function findColS(head1, head2, ...names) {
  for (const n of names) {
    const i1 = head1.indexOf(n); if (i1 >= 0) return i1;
    const i2 = head2.indexOf(n); if (i2 >= 0) return i2;
  }
  for (const n of names) {
    const i1 = head1.findIndex(h => h.includes(n)); if (i1 >= 0) return i1;
    const i2 = head2.findIndex(h => h.includes(n)); if (i2 >= 0) return i2;
  }
  return -1;
}
console.log("--- HASIL PENCARIAN ---");
console.log("AYAH:", findColS(head1, head2, "AYAH"));
console.log("IBU:", findColS(head1, head2, "IBU"));
console.log("TEMPAT:", findColS(head1, head2, "TEMPAT", "TEMPAT LAHIR"));
console.log("TGL LAHIR:", findColS(head1, head2, "TGL LAHIR", "TANGGAL LAHIR"));
console.log("STATUS WARGA:", findColS(head1, head2, "STATUS WARGA"));
console.log("PANGGILAN:", findColS(head1, head2, "PANGGILAN"));
console.log("KETERANGAN:", findColS(head1, head2, "KETERANGAN"));
