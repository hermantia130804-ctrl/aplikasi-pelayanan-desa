"use client"
import { Document, Page, StyleSheet, Text, View, Image } from '@react-pdf/renderer';
import { LOGO_KAB_BOGOR_BASE64 } from '../assets/logo-kab-bogor.base64';

// ===== DATA RESMI DESA =====
const NAMA_KEPALA_DESA = "Hj. CUCUM RATNA SUMINAR";
const ALAMAT_KANTOR = "Jl. K.H Abdul Hamid, Desa Sukamaju, Kec. Cibungbulang, Kab. Bogor 16630";
// ===========================

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: 'Times-Roman' },
  kopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  logoBox: { width: 70, height: 70, alignItems: 'center', justifyContent: 'center' },
  logoImg: { width: 62, height: 62, objectFit: 'contain' },
  kopCenter: { flex: 1, alignItems: 'center' },
  kop1: { fontSize: 13, fontFamily: 'Times-Bold' },
  kop2: { fontSize: 12, fontFamily: 'Times-Bold' },
  kop3: { fontSize: 14, fontFamily: 'Times-Bold' },
  kopAlamat: { fontSize: 9, marginTop: 2 },
  garisTebal: { borderBottomWidth: 3, borderBottomStyle: 'solid', borderColor: '#000', marginBottom: 2 },
  garisTipis: { borderBottomWidth: 1, borderBottomStyle: 'solid', borderColor: '#000', marginBottom: 16 },
  judulSurat: { textAlign: 'center', fontSize: 12, fontFamily: 'Times-Bold', textDecoration: 'underline', marginBottom: 2 },
  nomorSurat: { textAlign: 'center', fontSize: 11, marginBottom: 16 },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 30, fontSize: 11 },
  col1: { width: 160, fontSize: 11 },
  titik: { width: 12, fontSize: 11 },
  value: { fontSize: 11, fontFamily: 'Times-Bold', flex: 1 },
  paragraf: { fontSize: 11, textAlign: 'justify', marginBottom: 10, lineHeight: 1.5 },
  paragrafPenutup: { fontSize: 11, textAlign: 'justify', marginBottom: 24 },
  ttdRow: { flexDirection: 'row' },
  ttdKiri: { flex: 1, fontSize: 11 },
  ttdKanan: { flex: 1, alignItems: 'center' },
  ttdJabatan: { fontSize: 11, marginBottom: 48 },
  ttdNama: { fontSize: 11, fontFamily: 'Times-Bold', textDecoration: 'underline' },
});

type DataRow = { label: string; value: string };
type SuratConfig = {
  judul: string;
  jenis: string;
  pembuka: string;
  dataRows: DataRow[];
  isi: string[];
};

function SuratKeteranganDocument({ config }: { config: SuratConfig }) {
  const tanggalSurat = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const nomorSurat = config.nomor
    ? `${config.nomor}/01-SK/${config.jenis}/IX/2026`
    : "-/01-SK/" + config.jenis + "/IX/2026";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.kopRow}>
          <View style={styles.logoBox}>
            <Image style={styles.logoImg} src={LOGO_KAB_BOGOR_BASE64} />
          </View>
          <View style={styles.kopCenter}>
            <Text style={styles.kop1}>PEMERINTAH KABUPATEN BOGOR</Text>
            <Text style={styles.kop2}>KECAMATAN CIBUNGBULANG</Text>
            <Text style={styles.kop3}>DESA SUKAMAJU</Text>
            <Text style={styles.kopAlamat}>Alamat: {ALAMAT_KANTOR}</Text>
          </View>
          <View style={styles.logoBox} />
        </View>
        <View style={styles.garisTebal} />
        <View style={styles.garisTipis} />

        <Text style={styles.judulSurat}>{config.judul}</Text>
        <Text style={styles.nomorSurat}>Nomor: {nomorSurat}</Text>

        <Text style={styles.paragraf}>{config.pembuka}</Text>

        {config.dataRows.map((r, i) => (
          <View style={styles.row} key={i}>
            <Text style={styles.label}>{i + 1}.</Text>
            <Text style={styles.col1}>{r.label}</Text>
            <Text style={styles.titik}>:</Text>
            <Text style={styles.value}>{r.value}</Text>
          </View>
        ))}

        {config.isi.map((p, i) => (
          <Text style={styles.paragraf} key={i}>{p}</Text>
        ))}

        <Text style={styles.paragrafPenutup}>
          Demikian Surat Keterangan ini dibuat dengan sebenar-benarnya untuk dapat
          dipergunakan sebagaimana mestinya.
        </Text>

        <View style={styles.ttdRow}>
          <View style={styles.ttdKiri} />
          <View style={styles.ttdKanan}>
            <Text style={styles.ttdJabatan}>Sukamaju, {tanggalSurat}</Text>
            <Text style={styles.ttdJabatan}>Kepala Desa Sukamaju,</Text>
            <Text style={styles.ttdNama}>{NAMA_KEPALA_DESA}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ===== FORMAT TANGGAL HELPER =====
const tgl = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";

// ===== 1. SURAT KETERANGAN KELAHIRAN (SKL) =====
export function SuratSKLDocument({ data }: { data: any }) {
  return (
    <SuratKeteranganDocument
      config={{
        judul: "SURAT KETERANGAN KELAHIRAN",
        nomor: data.nomorPermohonan,
        jenis: "SKL",
        pembuka: "Yang bertanda tangan di bawah ini Kepala Desa Sukamaju, Kecamatan Cibungbulang, Kabupaten Bogor, dengan ini menerangkan bahwa:",
        dataRows: [
          { label: "Nama Anak", value: data.nama },
          { label: "Tempat/Tanggal Lahir", value: `${data.tempatLahir}, ${tgl(data.tanggalLahir)}` },
          { label: "Jenis Kelamin", value: data.jenisKelamin },
          { label: "Nama Ayah", value: data.namaAyah },
          { label: "NIK Ayah", value: data.nikAyah },
          { label: "Nama Ibu", value: data.namaIbu },
          { label: "NIK Ibu", value: data.nikIbu },
          { label: "Alamat", value: data.alamat },
        ],
        isi: [
          "Berdasarkan keterangan yang bersangkutan kepada kami, bahwa benar telah lahir seorang anak dari pasangan tersebut di atas yang merupakan warga Desa Sukamaju, Kecamatan Cibungbulang, Kabupaten Bogor.",
          "Surat keterangan ini dibuat untuk keperluan administrasi yang bersangkutan.",
        ],
      }}
    />
  );
}

// ===== 2. SURAT KETERANGAN TIDAK MAMPU (SKTM) =====
export function SuratSKTMDocument({ data }: { data: any }) {
  return (
    <SuratKeteranganDocument
      config={{
        judul: "SURAT KETERANGAN TIDAK MAMPU",
        nomor: data.nomorPermohonan,
        jenis: "SKTM",
        pembuka: "Yang bertanda tangan di bawah ini Kepala Desa Sukamaju, Kecamatan Cibungbulang, Kabupaten Bogor, dengan ini menerangkan bahwa:",
        dataRows: [
          { label: "Nama", value: data.nama },
          { label: "NIK", value: data.nik },
          { label: "Tempat/Tanggal Lahir", value: `${data.tempatLahir}, ${tgl(data.tanggalLahir)}` },
          { label: "Jenis Kelamin", value: data.jenisKelamin },
          { label: "Agama", value: data.agama },
          { label: "Alamat", value: data.alamat },
        ],
        isi: [
          `Berdasarkan pengamatan dan keterangan dari aparat desa setempat, bahwa yang bersangkutan benar-benar termasuk keluarga kurang mampu/dalam kondisi tidak mampu secara ekonomi.`,
          `Adapun keterangan tambahan: ${data.keterangan ?? "-"}`,
          "Surat keterangan ini dibuat untuk memenuhi keperluan yang bersangkutan.",
        ],
      }}
    />
  );
}

// ===== 3. SURAT KETERANGAN KEMATIAN (SKK) =====
export function SuratSKKDocument({ data }: { data: any }) {
  return (
    <SuratKeteranganDocument
      config={{
        judul: "SURAT KETERANGAN KEMATIAN",
        nomor: data.nomorPermohonan,
        jenis: "SKK",
        pembuka: "Yang bertanda tangan di bawah ini Kepala Desa Sukamaju, Kecamatan Cibungbulang, Kabupaten Bogor, dengan ini menerangkan bahwa:",
        dataRows: [
          { label: "Nama", value: data.nama },
          { label: "NIK", value: data.nik },
          { label: "Umur", value: `${data.umur} tahun` },
          { label: "Agama", value: data.agama },
          { label: "Alamat", value: data.alamat },
          { label: "Hari/Tanggal Meninggal", value: data.tanggalMeninggal ? tgl(data.tanggalMeninggal) : "-" },
          { label: "Tempat Meninggal", value: data.tempatMeninggal ?? "-" },
        ],
        isi: [
          "Berdasarkan keterangan yang bersangkutan kepada kami, bahwa benar yang bersangkutan tersebut di atas telah meninggal dunia.",
          "Surat keterangan ini dibuat untuk keperluan administrasi dan pengurusan dokumen kematian.",
        ],
      }}
    />
  );
}

// ===== 4. SURAT KETERANGAN USAHA (SKU) =====
export function SuratSKUDocument({ data }: { data: any }) {
  return (
    <SuratKeteranganDocument
      config={{
        judul: "SURAT KETERANGAN USAHA",
        nomor: data.nomorPermohonan,
        jenis: "SKU",
        pembuka: "Yang bertanda tangan di bawah ini Kepala Desa Sukamaju, Kecamatan Cibungbulang, Kabupaten Bogor, dengan ini menerangkan bahwa:",
        dataRows: [
          { label: "Nama", value: data.nama },
          { label: "NIK", value: data.nik },
          { label: "Tempat/Tanggal Lahir", value: `${data.tempatLahir}, ${tgl(data.tanggalLahir)}` },
          { label: "Jenis Kelamin", value: data.jenisKelamin },
          { label: "Alamat", value: data.alamat },
          { label: "Jenis Usaha", value: data.jenisUsaha },
          { label: "Tahun Berdiri", value: String(data.tahunBerdiriUsaha) },
          { label: "Lokasi Usaha", value: data.lokasiUsaha },
        ],
        isi: [
          "Berdasarkan keterangan yang bersangkutan kepada kami, bahwa yang bersangkutan benar-benar memiliki dan menjalankan usaha tersebut di atas yang berlokasi di Desa Sukamaju, Kecamatan Cibungbulang, Kabupaten Bogor.",
          "Usaha tersebut berjalan dan digeluti secara serius untuk memenuhi kebutuhan hidup sehari-hari.",
          "Surat keterangan ini dibuat untuk memenuhi keperluan yang bersangkutan.",
        ],
      }}
    />
  );
}

// ===== 5. SURAT KETERANGAN DOMISILI (SKD) =====
export function SuratSKDDocument({ data }: { data: any }) {
  return (
    <SuratKeteranganDocument
      config={{
        judul: "SURAT KETERANGAN DOMISILI",
        nomor: data.nomorPermohonan,
        jenis: "SKD",
        pembuka: "Yang bertanda tangan di bawah ini Kepala Desa Sukamaju, Kecamatan Cibungbulang, Kabupaten Bogor, dengan ini menerangkan bahwa:",
        dataRows: [
          { label: "Nama", value: data.nama },
          { label: "NIK", value: data.nik },
          { label: "Tempat/Tanggal Lahir", value: `${data.tempatLahir}, ${tgl(data.tanggalLahir)}` },
          { label: "Jenis Kelamin", value: data.jenisKelamin },
          { label: "Agama", value: data.agama },
          { label: "Kewarganegaraan", value: data.wargaNegara },
          { label: "Alamat Sesuai KTP", value: data.alamatKTP },
          { label: "Alamat Domisili", value: data.alamatDomisili },
        ],
        isi: [
          "Berdasarkan keterangan yang bersangkutan kepada kami, bahwa yang bersangkutan benar-benar berdomisili/berktempat tinggal di wilayah Desa Sukamaju, Kecamatan Cibungbulang, Kabupaten Bogor pada alamat tersebut di atas.",
          "Surat keterangan ini dibuat untuk memenuhi keperluan yang bersangkutan.",
        ],
      }}
    />
  );
}
