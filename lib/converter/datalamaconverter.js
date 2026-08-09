/**
 * pointEngine.js
 * ---------------------------------------------
 * Engine buat ngitung point Penerima berdasarkan nota
 * yang statusnya "sudah diambil" DAN punya TglKeluar terisi.
 *
 * Rule:
 * - 1 nota valid = 5000 point
 * - Dikelompokkan per Penerima
 * - Dikelompokkan lagi per bulan (format YYYY-MM)
 *
 * Input : objek data nota (key = NoNota, value = detail nota)
 * Output: JSON hasil rekap
 */

const POINT_PER_NOTA = 5000;

/**
 * Cek apakah 1 nota valid untuk dihitung point-nya
 */
function isNotaValid(nota) {
  const statusOk = nota.status === "sudah diambil";
  const tglKeluarOk = typeof nota.TglKeluar === "string" && nota.TglKeluar.trim() !== "";
  return statusOk && tglKeluarOk;
}

/**
 * Ambil string bulan (YYYY-MM) dari TglKeluar
 */
function getBulanKey(tglKeluar) {
  // TglKeluar formatnya "2025-05-05T21:45" -> ambil "2025-05"
  return tglKeluar.slice(0, 7);
}

/**
 * Nama bulan versi Indonesia buat label yang lebih enak dibaca
 */
const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function formatLabelBulan(bulanKey) {
  const [tahun, bulan] = bulanKey.split("-");
  const idx = parseInt(bulan, 10) - 1;
  return `${NAMA_BULAN[idx]} ${tahun}`;
}

/**
 * Fungsi utama: hitung point per Penerima, per bulan
 *
 * @param {Object} dataNota - objek nota (key: NoNota, value: detail)
 * @returns {Object} rekap dalam bentuk JSON
 */
export function calculatePoints(dataNota) {
  const rekap = {}; 

  Object.values(dataNota).forEach((nota) => {
    if (!isNotaValid(nota)) return;

    const penerima = nota.Penerima || "Unknown";
    const bulanKey = getBulanKey(nota.TglKeluar);

    if (!rekap[penerima]) rekap[penerima] = {};
    if (!rekap[penerima][bulanKey]) {
      rekap[penerima][bulanKey] = {
        label: formatLabelBulan(bulanKey),
        totalNota: 0,
        totalPoint: 0,
        notaList: [],
      };
    }

    rekap[penerima][bulanKey].totalNota += 1;
    rekap[penerima][bulanKey].totalPoint += POINT_PER_NOTA;
  });

  return rekap;
}

/**
 * Bonus: rekap total keseluruhan per Penerima (semua bulan digabung)
 * Berguna buat bikin leaderboard total point.
 */
export function calculateGrandTotalPerPenerima(rekapPerBulan) {
  const grandTotal = {};

  for (const [penerima, bulanData] of Object.entries(rekapPerBulan)) {
    let totalNota = 0;
    let totalPoint = 0;

    for (const detail of Object.values(bulanData)) {
      totalNota += detail.totalNota;
      totalPoint += detail.totalPoint;
    }

    grandTotal[penerima] = { totalNota, totalPoint };
  }

  return grandTotal;
}

/* ---------------------------------------------
 * CONTOH PEMAKAIAN
 * ---------------------------------------------

const dataNota = require("./dataNota.json"); // data ribuan nota lu
const { calculatePoints, calculateGrandTotalPerPenerima } = require("./pointEngine");

const rekapPerBulan = calculatePoints(dataNota);
const grandTotal = calculateGrandTotalPerPenerima(rekapPerBulan);

console.log(JSON.stringify(rekapPerBulan, null, 2));
console.log(JSON.stringify(grandTotal, null, 2));

*/