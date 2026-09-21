"use client"
import { PermohonanKTP } from '@/generated/prisma';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

// Font.register({ family: 'Arial', src: ... }) // (opsional, jika ingin font khusus)

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    fontFamily: 'Helvetica',
    position: 'relative',
  },
  f121Box: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#000',
    padding: 6,
    fontWeight: 'bold',
    fontSize: 12,
    minWidth: 54,
    textAlign: 'center',
  },
  header: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 10,
    marginTop: 8,
  },
  box: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#000',
    padding: 8,
    marginBottom: 10,
  },
  boxTitle: {
    fontStyle: 'italic',
    fontSize: 9,
    marginBottom: 2,
  },
  boxList: {
    fontSize: 9,
    marginLeft: 8,
    marginBottom: 1,
  },
  wilayahRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  wilayahLabel: {
    width: 120,
    fontSize: 10,
    marginRight: 4,
  },
  wilayahGrid: {
    flexDirection: 'row',
    gap: 0,
  },
  wilayahCell: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#000',
    width: 16,
    height: 16,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 10,
    marginRight: 2,
    display: 'flex',
  },
  jenisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  jenisLabel: {
    fontStyle: 'italic',
    fontSize: 10,
    marginRight: 8,
    minWidth: 90,
  },
  jenisBox: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#000',
    padding: 4,
    minWidth: 90,
    alignItems: 'center',
    marginRight: 8,
  },
  jenisText: {
    fontSize: 10,
    marginTop: 2,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dataLabel: {
    width: 60,
    fontSize: 10,
    marginRight: 4,
  },
  dataGrid: {
    flexDirection: 'row',
    gap: 0,
    flex: 1,
  },
  dataCell: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#000',
    width: 16,
    height: 16,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 10,
    marginRight: 2,
    display: 'flex',
  },
  alamatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  alamatLabel: {
    width: 60,
    fontSize: 10,
    marginRight: 4,
  },
  alamatGrid: {
    flexDirection: 'row',
    gap: 0,
    flex: 1,
  },
  alamatCell: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#000',
    width: 16,
    height: 16,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 10,
    marginRight: 2,
    display: 'flex',
  },
  kodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  kodeLabel: {
    fontSize: 10,
    marginRight: 4,
  },
  kodeGrid: {
    flexDirection: 'row',
    gap: 0,
  },
  kodeCell: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#000',
    width: 16,
    height: 16,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 10,
    marginRight: 2,
    display: 'flex',
  },
  photoSection: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 12,
  },
  photoBox: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#000',
    width: 110,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    marginRight: 2,
    position: 'relative',
  },
  oval: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#000',
    width: 50,
    height: 70,
    borderRadius: 35,
    position: 'absolute',
    left: 28,
    top: 10,
  },
  capBox: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#000',
    width: 60,
    height: 90,
    alignItems: 'center',
    justifyContent: 'flex-start',
    display: 'flex',
    marginRight: 2,
    paddingTop: 8,
  },
  capText: {
    fontSize: 9,
    marginTop: 60,
  },
  specimenBox: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#000',
    flex: 1,
    height: 90,
    alignItems: 'center',
    justifyContent: 'flex-end',
    display: 'flex',
    paddingBottom: 8,
  },
  specimenLine: {
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderColor: '#000',
    width: '80%',
    marginBottom: 4,
  },
  specimenLabel: {
    fontSize: 9,
    marginBottom: 2,
  },
  ttdRow: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 8,
  },
  ttdCol: {
    flex: 1,
    alignItems: 'center',
    display: 'flex',
  },
  ttdLine: {
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderColor: '#000',
    width: 120,
    marginTop: 24,
    marginBottom: 2,
  },
  ttdLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  ttdBold: {
    fontWeight: 'bold',
    fontSize: 11,
    marginTop: 2,
  },
  ttdSmall: {
    fontSize: 9,
    marginTop: 2,
  },
});

function renderGridAngka(text: string, length: number) {
  // Hanya angka, satu per kotak
  const chars = (text || '').padEnd(length).slice(0, length).split('');
  return (
    <View style={styles.wilayahGrid}>
      {chars.map((c, i) => (
        <View style={styles.wilayahCell} key={i}>
          <Text>{c}</Text>
        </View>
      ))}
    </View>
  );
}
function renderGrid(text: string, length: number) {
  // Huruf/angka, satu per kotak
  const chars = (text || '').padEnd(length).slice(0, length).split('');
  return (
    <View style={styles.dataGrid}>
      {chars.map((c, i) => (
        <View style={styles.dataCell} key={i}>
          <Text>{c}</Text>
        </View>
      ))}
    </View>
  );
}
function renderAlamatGrid(text: string, length: number) {
  const chars = (text || '').padEnd(length).slice(0, length).split('');
  return (
    <View style={styles.alamatGrid}>
      {chars.map((c, i) => (
        <View style={styles.alamatCell} key={i}>
          <Text>{c}</Text>
        </View>
      ))}
    </View>
  );
}
function renderKodeGrid(text: string, length: number) {
  const chars = (text || '').padEnd(length).slice(0, length).split('');
  return (
    <View style={styles.kodeGrid}>
      {chars.map((c, i) => (
        <View style={styles.kodeCell} key={i}>
          <Text>{c}</Text>
        </View>
      ))}
    </View>
  );
}

export function PermohonanKtpPdfTemplate({ data }: { data: PermohonanKTP }) {
  // Contoh kode wilayah (harusnya dari data, di-hardcode dulu)
  const kodeProv = '32'; // Jawa Barat
  const kodeKab = '01'; // Bogor
  const kodeKec = '16'; // Cibungbulang
  const kodeDesa = '2013'; // Sukamaju
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Box F-1.21 */}
        <View style={styles.f121Box}><Text>F-1.21</Text></View>
        {/* Header */}
        <Text style={styles.header}>FORMULIR PERMOHONAN KARTU TANDA PENDUDUK (KTP) WARGA NEGARA INDONESIA</Text>
        {/* Box Perhatian */}
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Perhatian</Text>
          <Text style={styles.boxList}>1   Harap diisi dengan huruf cetak dan menggunakan tinta hitam</Text>
          <Text style={styles.boxList}>2   Untuk kolom pilihan, harap memberi tanda silang (X) pada kolom pilihan</Text>
          <Text style={styles.boxList}>3   Setelah formulir ini diisi dan ditandatangani, harap diserahkan kembali ke kantor Desa/Kelurahan</Text>
        </View>
        {/* Grid Wilayah */}
        <View style={styles.wilayahRow}>
          <Text style={styles.wilayahLabel}>PEMERINTAH PROPINSI</Text>
          <Text style={{marginRight: 4}}>: </Text>
          {renderGridAngka(kodeProv, 2)}
          {renderGrid('JAWA BARAT', 10)}
        </View>
        <View style={styles.wilayahRow}>
          <Text style={styles.wilayahLabel}>PEMERINTAH KABUPATEN/KOTA</Text>
          <Text style={{marginRight: 4}}>: </Text>
          {renderGridAngka(kodeKab, 2)}
          {renderGrid('BOGOR', 10)}
        </View>
        <View style={styles.wilayahRow}>
          <Text style={styles.wilayahLabel}>KECAMATAN</Text>
          <Text style={{marginRight: 4}}>: </Text>
          {renderGridAngka(kodeKec, 2)}
          {renderGrid('CIBUNGBULANG', 10)}
        </View>
        <View style={styles.wilayahRow}>
          <Text style={styles.wilayahLabel}>KELURAHAN/DESA</Text>
          <Text style={{marginRight: 4}}>: </Text>
          {renderGridAngka(kodeDesa, 4)}
          {renderGrid('SUKAMAJU', 10)}
        </View>
        {/* Jenis Permohonan */}
        <View style={styles.jenisRow}>
          <Text style={styles.jenisLabel}><Text style={{fontStyle:'italic'}}>PERMOHONAN KTP</Text></Text>
          <View style={styles.jenisBox}>
            <Text>A. Baru</Text>
            <Text style={styles.jenisText}>{data.jenisPermohonanKTP === 'BARU' ? 'X' : ''}</Text>
          </View>
          <View style={styles.jenisBox}>
            <Text>B. Perpanjangan</Text>
            <Text style={styles.jenisText}>{data.jenisPermohonanKTP === 'PERUBAHAN' ? 'X' : ''}</Text>
          </View>
          <View style={styles.jenisBox}>
            <Text>C. Pergantian</Text>
            <Text style={styles.jenisText}>{data.jenisPermohonanKTP === 'PENGGANTIAN' ? 'X' : ''}</Text>
          </View>
        </View>
        {/* Data Diri */}
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>1 Nama Lengkap</Text>
          {renderGrid(data.nama || '', 32)}
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>2 No. KK</Text>
          {renderGrid('', 16)}
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>3 NIK</Text>
          {renderGrid(data.nik || '', 16)}
        </View>
        <View style={styles.alamatRow}>
          <Text style={styles.alamatLabel}>4 Alamat</Text>
          {renderAlamatGrid(data.alamat || '', 32)}
        </View>
        {/* RT/RW/Kode Pos */}
        <View style={styles.kodeRow}>
          <Text style={styles.kodeLabel}>RT</Text>
          {renderKodeGrid(data.rt || '', 3)}
          <Text style={styles.kodeLabel}>RW</Text>
          {renderKodeGrid(data.rw || '', 3)}
          <Text style={styles.kodeLabel}>Kode Pos</Text>
          {renderKodeGrid(data.kodePos || '', 5)}
        </View>
        {/* Pas Photo, Cap Jempol, Specimen Tanda Tangan */}
        <View style={styles.photoSection}>
          <View style={styles.photoBox}>
            <View style={styles.oval} />
            <Text style={{fontSize:9, marginTop:74}}>Pas Photo (2 x 3)</Text>
          </View>
          <View style={styles.capBox}>
            <Text style={{fontSize:9}}>Cap Jempol</Text>
            <Text style={{fontSize:8, marginTop:8}}>Atau ---&gt;</Text>
            <Text style={styles.capText}>Ket : Cap Jempol</Text>
          </View>
          <View style={styles.specimenBox}>
            <Text style={styles.specimenLabel}>Specimen Tanda Tangan</Text>
            <View style={styles.specimenLine} />
          </View>
        </View>
        {/* Tanda Tangan & Footer */}
        <View style={styles.ttdRow}>
          <View style={styles.ttdCol}>
            <Text style={styles.ttdLabel}>Camat Cibungbulang</Text>
            <View style={styles.ttdLine} />
            <Text style={styles.ttdSmall}>NIP.</Text>
          </View>
          <View style={styles.ttdCol}>
            <Text style={styles.ttdLabel}>Sukamaju,</Text>
            <Text style={styles.ttdLabel}>Pemohon</Text>
            <View style={styles.ttdLine} />
          </View>
          <View style={styles.ttdCol}>
            <Text style={styles.ttdLabel}>AN Kepala Desa/Lurah Sukamaju</Text>
            <Text style={styles.ttdBold}>(ZULFI IRFANI)</Text>
            <Text style={styles.ttdSmall}>NIP.</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
} 