import dataNota from "./data_lama.json"; // data ribuan nota lu
import { calculatePoints, calculateGrandTotalPerPenerima } from "./datalamaconverter";

const rekapPerBulan = calculatePoints(dataNota);
const grandTotal = calculateGrandTotalPerPenerima(rekapPerBulan);

console.log(JSON.stringify(rekapPerBulan, null, 2));
console.log(JSON.stringify(grandTotal, null, 2));