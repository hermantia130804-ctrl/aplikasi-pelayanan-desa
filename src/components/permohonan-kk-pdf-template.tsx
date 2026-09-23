"use client"
import { PermohonanKK } from '@/generated/prisma';
import { Document, Page, StyleSheet, Text, View, Image } from '@react-pdf/renderer';
import { LOGO_KAB_BOGOR_BASE64 } from '../assets/logo-kab-bogor.base64';

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    fontFamily: 'Times-Roman',
  },
  kopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoBox: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    width: 62,
    height: 62,
    objectFit: 'contain',
  },
  kopCenter: {
    flex: 1,
    alignItems: 'center',
  },
  kop1: { fontSize: 13, fontFamily: 'Times-Bold' },
  kop2: { fontSize: 12, fontFamily: 'Times-Bold' },
  kop3: { fontSize: 14, fontFamily: 'Times-Bold' },
  kopAlamat: { fontSize: 9, marginTop: 2 },
  garisTebal: {
    borderBottomWidth: 3,
    borderBottomStyle: 'solid',
    borderColor: '#000',
    marginBottom: 2,
  },
  garisTipis: {
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderColor: '#000',
    marginBottom: 16,
  },
  judulSurat: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Times-Bold',
    textDecoration: 'underline',
    marginBottom: 2,
  },
  nomorSurat: {
    textAlign: 'center',
    fontSize: 11,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: { width: 30, fontSize: 11 },
  col1: { width: 150, fontSize: 11 },
  titik: { width: 12, fontSize: 11 },
  value: { fontSize: 11, fontFamily: 'Times-Bold' },
  paragrafPembuka: {
    fontSize: 11,
    textAlign: 'justify',
    marginBottom: 10,
    lineHeight: 1.5,
  },
  paragrafIsi: {
    fontSize: 11,
    textAlign: 'justify',
    marginBottom: 10,
    lineHeight: 1.5,
  },
  paragrafPenutup: {
    fontSize: 11,
    textAlign: 'justify',
    marginBottom: 24,
  },
  ttdRow: {
    flexDirection: 'row',
  },
  ttdKiri: {
    flex: 1,
    fontSize: 11,
  },
  ttdKanan: {
    flex: 1,
    alignItems: 'center',
  },
  ttdJabatan: { fontSize: 11, marginBottom: 48 },
  ttdNama: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    textDecoration: 'underline',
  },
  ttdNip: { fontSize: 10 },
});

export function PermohonanKKPdfTemplate({ data, namaKepalaDesa }: { data: PermohonanKK; namaKepalaDesa?: string }) {
  const tanggalSurat = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const nomorSurat = data.nomorPermohonan
    ? `${data.nomorPermohonan}/01-SK/KK/IX/2026`
    : "-/01-SK/KK/IX/2026";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* KOP SURAT */}
        <View style={styles.kopRow}>
          <View style={styles.logoBox}>
            <Image style={styles.logoImg} src={LOGO_KAB_BOGOR_BASE64} />
          </View>
          <View style={styles.kopCenter}>
            <Text style={styles.kop1}>PEMERINTAH KABUPATEN BOGOR</Text>
            <Text style={styles.kop2}>KECAMATAN CIBUNGBULANG</Text>
            <Text style={styles.kop3}>DESA SUKAMAJU</Text>
            <Text style={styles.kopAlamat}>Alamat: Desa Sukamaju, Kec. Cibungbulang, Kab. Bogor, Jawa Barat</Text>
          </View>
          <View style={styles.logoBox} />
        </View>
        <View style={styles.garisTebal} />
        <View style={styles.garisTipis} />

        {/* JUDUL */}
        <Text style={styles.judulSurat}>SURAT KETERANGAN</Text>
        <Text style={styles.nomorSurat}>Nomor: {nomorSurat}</Text>

        {/* PEMBUKA */}
        <Text style={styles.paragrafPembuka}>
          Yang bertanda tangan di bawah ini Kepala Desa Sukamaju, Kecamatan
          Cibungbulang, Kabupaten Bogor, dengan ini menerangkan bahwa:
        </Text>

        {/* DATA PEMOHON */}
        <View style={styles.row}>
          <Text style={styles.label}>1.</Text>
          <Text style={styles.col1}>Nama</Text>
          <Text style={styles.titik}>:</Text>
          <Text style={styles.value}>{data.nama}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>2.</Text>
          <Text style={styles.col1}>NIK</Text>
          <Text style={styles.titik}>:</Text>
          <Text style={styles.value}>{data.nik}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>3.</Text>
          <Text style={styles.col1}>Alamat</Text>
          <Text style={styles.titik}>:</Text>
          <Text style={styles.value}>{data.alamat} RT {data.rt}/RW {data.rw}, Desa {data.desa}</Text>
        </View>

        {/* ISI SURAT */}
        <Text style={styles.paragrafIsi}>
          Berdasarkan keterangan yang bersangkutan kepada kami, bahwa nama tersebut di atas
          adalah benar-benar warga Desa Sukamaju, Kecamatan Cibungbulang, Kabupaten Bogor,
          dan berdasarkan data yang tersedia pada kami, data tersebut adalah benar.
        </Text>
        <Text style={styles.paragrafIsi}>
          Surat keterangan ini dibuat untuk keperluan: {data.alasanPermohonan === 'BARU' ? 'Pengajuan Kartu Keluarga Baru' : data.alasanPermohonan === 'PERUBAHAN_DATA' ? 'Perubahan Data Kartu Keluarga' : data.alasanPermohonan === 'PENGGANTIAN' ? 'Penggantian Kartu Keluarga' : 'Pemisahan Kartu Keluarga'}.
        </Text>

        {/* PENUTUP */}
        <Text style={styles.paragrafPenutup}>
          Demikian Surat Keterangan ini dibuat dengan sebenar-benarnya untuk dapat
          dipergunakan sebagaimana mestinya.
        </Text>

        {/* TANDA TANGAN */}
        <View style={styles.ttdRow}>
          <View style={styles.ttdKiri} />
          <View style={styles.ttdKanan}>
            <Text style={styles.ttdJabatan}>Sukamaju, {tanggalSurat}</Text>
            <Text style={styles.ttdJabatan}>Kepala Desa Sukamaju</Text>
            <Text style={styles.ttdNama}>{namaKepalaDesa ?? '................................'}</Text>
            <Text style={styles.ttdNip}>{namaKepalaDesa ? 'NIP.' : ''}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
