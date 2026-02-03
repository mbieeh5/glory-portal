export const BankSeparator = (bank:string) => {
    const bankBCA = bank.match(/BCA(?!.*DIGITAL)(?!.*SYARIAH)/i) ? "BCA" : null;
    const bankBRI = bank.match(/BRI/i) ? "BRI" : null;
    const bankBNI = bank.match(/BNI/i) ? "BNI" : null;
    const bankMandiri = bank.match(/MANDIRI(?!.*1)(?!.*TASPEN)/i) ? "MANDIRI" : null;
    const bankDanamonQr = bank.match(/DANAMON QR/i) ? "DANAMONQR" : null;
    const bankDanamon = bank ? "DANAMON" : null;
    const sanitizerBank = bankBCA || bankBRI || bankBNI || bankMandiri || bankDanamonQr || bankDanamon;
    return sanitizerBank
}