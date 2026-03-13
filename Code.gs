// ============================================================
// BAKERY STOCK MANAGEMENT - Google Apps Script Backend
// ============================================================

const SHEET_BAHAN = "Master_Bahan";
const SHEET_RESEP = "Master_Resep";
const SHEET_BOM = "BOM_Resep";
const SHEET_LOG = "Log_Transaksi";

// Kolom index (0-based)
const COL_BAHAN = { id: 0, nama: 1, satuan: 2, stok: 3, min_stok: 4 };
const COL_RESEP = { id: 0, nama: 1, stok: 2 };
const COL_BOM = { id_resep: 0, nama_resep: 1, id_bahan: 2, nama_bahan: 3, qty: 4 };
const COL_LOG = { tanggal: 0, tipe: 1, id_item: 2, qty: 3, user: 4, ref_no: 5 };

// ============================================================
// CORS Headers
// ============================================================
function setCorsHeaders(output) {
  return output
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ============================================================
// doGet - Handle GET requests
// ============================================================
function doGet(e) {
  try {
    const action = e.parameter.action;
    let result;

    if (action === "getMasterData") {
      result = getMasterData();
    } else {
      result = { error: "Unknown action: " + action };
    }

    const output = ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
    return setCorsHeaders(output);

  } catch (err) {
    const output = ContentService.createTextOutput(
      JSON.stringify({ error: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
    return setCorsHeaders(output);
  }
}

// ============================================================
// doPost - Handle POST requests
// ============================================================
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    let result;

    if (action === "bahanMasuk") {
      result = bahanMasuk(body);
    } else if (action === "resepMasuk") {
      result = resepMasuk(body);
    } else if (action === "resepKeluar") {
      result = resepKeluar(body);
    } else if (action === "koreksiStok") {
      result = koreksiStok(body);
    } else {
      result = { error: "Unknown action: " + action };
    }

    const output = ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
    return setCorsHeaders(output);

  } catch (err) {
    const output = ContentService.createTextOutput(
      JSON.stringify({ error: err.message, stack: err.stack })
    ).setMimeType(ContentService.MimeType.JSON);
    return setCorsHeaders(output);
  }
}

// ============================================================
// Helper: Get sheet data as array of objects
// ============================================================
function getSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

// ============================================================
// Helper: Get next empty row (reliable method)
// ============================================================
function getNextEmptyRow(sheet) {
  const colA = sheet.getRange("A:A").getValues();
  for (let i = colA.length - 1; i >= 0; i--) {
    if (colA[i][0] !== "") return i + 2; // 1-based + next row
  }
  return 1;
}

// ============================================================
// Helper: Generate ref_no (TRX-YYYYMMDD-XXX)
// ============================================================
function generateRefNo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(SHEET_LOG);
  const today = new Date();
  const dateStr = Utilities.formatDate(today, Session.getScriptTimeZone(), "yyyyMMdd");
  const prefix = "TRX-" + dateStr + "-";

  // Count today's transactions
  const data = logSheet.getDataRange().getValues();
  let counter = 0;
  for (let i = 1; i < data.length; i++) {
    const refNo = data[i][COL_LOG.ref_no];
    if (refNo && refNo.toString().startsWith(prefix)) {
      counter++;
    }
  }
  counter++;
  return prefix + counter.toString().padStart(3, "0");
}

// ============================================================
// Helper: Insert log rows
// ============================================================
function insertLogs(logs) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(SHEET_LOG);
  const now = new Date();
  const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");

  logs.forEach(log => {
    const nextRow = getNextEmptyRow(logSheet);
    logSheet.getRange(nextRow, 1, 1, 6).setValues([[
      dateStr,
      log.tipe,
      log.id_item,
      log.qty,
      log.user,
      log.ref_no
    ]]);
  });
}

// ============================================================
// GET: getMasterData
// ============================================================
function getMasterData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const bahanSheet = ss.getSheetByName(SHEET_BAHAN);
  const bahanData = bahanSheet.getDataRange().getValues();
  const bahan = bahanData.slice(1).map(row => ({
    id_bahan: row[COL_BAHAN.id],
    nama_bahan: row[COL_BAHAN.nama],
    satuan: row[COL_BAHAN.satuan],
    stok_gudang: Number(row[COL_BAHAN.stok]) || 0,
    minimum_stok: Number(row[COL_BAHAN.min_stok]) || 0
  })).filter(b => b.id_bahan !== "");

  const resepSheet = ss.getSheetByName(SHEET_RESEP);
  const resepData = resepSheet.getDataRange().getValues();
  const resep = resepData.slice(1).map(row => ({
    id_resep: row[COL_RESEP.id],
    nama_resep: row[COL_RESEP.nama],
    stok_resepan: Number(row[COL_RESEP.stok]) || 0
  })).filter(r => r.id_resep !== "");

  const bomSheet = ss.getSheetByName(SHEET_BOM);
  const bomData = bomSheet.getDataRange().getValues();
  const bom = bomData.slice(1).map(row => ({
    id_resep: row[COL_BOM.id_resep],
    nama_resep: row[COL_BOM.nama_resep],
    id_bahan: row[COL_BOM.id_bahan],
    nama_bahan: row[COL_BOM.nama_bahan],
    qty_per_resep: Number(row[COL_BOM.qty]) || 0
  })).filter(b => b.id_resep !== "");

  return { bahan, resep, bom };
}

// ============================================================
// POST: bahanMasuk
// ============================================================
function bahanMasuk(body) {
  const { user, items } = body;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bahanSheet = ss.getSheetByName(SHEET_BAHAN);
  const bahanData = bahanSheet.getDataRange().getValues();
  const refNo = generateRefNo();
  const logs = [];

  items.forEach(item => {
    const { id_bahan, qty } = item;
    for (let i = 1; i < bahanData.length; i++) {
      if (bahanData[i][COL_BAHAN.id] == id_bahan) {
        const currentStok = Number(bahanData[i][COL_BAHAN.stok]) || 0;
        const newStok = currentStok + Number(qty);
        bahanSheet.getRange(i + 1, COL_BAHAN.stok + 1).setValue(newStok);
        bahanData[i][COL_BAHAN.stok] = newStok; // update local cache
        break;
      }
    }
    logs.push({ tipe: "bahan_masuk", id_item: id_bahan, qty: Number(qty), user, ref_no: refNo });
  });

  insertLogs(logs);
  return { success: true, ref_no: refNo, processed: items.length };
}

// ============================================================
// POST: resepMasuk
// ============================================================
function resepMasuk(body) {
  const { user, id_resep, batch } = body;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const resepSheet = ss.getSheetByName(SHEET_RESEP);
  const bahanSheet = ss.getSheetByName(SHEET_BAHAN);
  const resepData = resepSheet.getDataRange().getValues();
  const bahanData = bahanSheet.getDataRange().getValues();
  const bomData = ss.getSheetByName(SHEET_BOM).getDataRange().getValues();
  const refNo = generateRefNo();
  const logs = [];

  // Update stok resep
  let namaResep = "";
  for (let i = 1; i < resepData.length; i++) {
    if (resepData[i][COL_RESEP.id] == id_resep) {
      namaResep = resepData[i][COL_RESEP.nama];
      const currentStok = Number(resepData[i][COL_RESEP.stok]) || 0;
      resepSheet.getRange(i + 1, COL_RESEP.stok + 1).setValue(currentStok + Number(batch));
      break;
    }
  }

  // Log resep_masuk
  logs.push({ tipe: "resep_masuk", id_item: id_resep, qty: Number(batch), user, ref_no: refNo });

  // Loop BOM, kurangi stok bahan
  for (let i = 1; i < bomData.length; i++) {
    if (bomData[i][COL_BOM.id_resep] == id_resep) {
      const idBahan = bomData[i][COL_BOM.id_bahan];
      const qtyPerResep = Number(bomData[i][COL_BOM.qty]) || 0;
      const totalQty = qtyPerResep * Number(batch);

      for (let j = 1; j < bahanData.length; j++) {
        if (bahanData[j][COL_BAHAN.id] == idBahan) {
          const currentStok = Number(bahanData[j][COL_BAHAN.stok]) || 0;
          const newStok = currentStok - totalQty;
          bahanSheet.getRange(j + 1, COL_BAHAN.stok + 1).setValue(newStok);
          bahanData[j][COL_BAHAN.stok] = newStok;
          break;
        }
      }

      logs.push({ tipe: "bahan_keluar", id_item: idBahan, qty: totalQty, user, ref_no: refNo });
    }
  }

  insertLogs(logs);
  return { success: true, ref_no: refNo, nama_resep: namaResep };
}

// ============================================================
// POST: resepKeluar
// ============================================================
function resepKeluar(body) {
  const { user, items } = body;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const resepSheet = ss.getSheetByName(SHEET_RESEP);
  const resepData = resepSheet.getDataRange().getValues();
  const refNo = generateRefNo();
  const logs = [];

  items.forEach(item => {
    const { id_resep, batch } = item;
    for (let i = 1; i < resepData.length; i++) {
      if (resepData[i][COL_RESEP.id] == id_resep) {
        const currentStok = Number(resepData[i][COL_RESEP.stok]) || 0;
        const newStok = currentStok - Number(batch);
        resepSheet.getRange(i + 1, COL_RESEP.stok + 1).setValue(newStok);
        resepData[i][COL_RESEP.stok] = newStok;
        break;
      }
    }
    logs.push({ tipe: "resep_keluar", id_item: id_resep, qty: Number(batch), user, ref_no: refNo });
  });

  insertLogs(logs);
  return { success: true, ref_no: refNo, processed: items.length };
}

// ============================================================
// POST: koreksiStok
// ============================================================
function koreksiStok(body) {
  const { user, tipe, items } = body;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const refNo = generateRefNo();
  const logs = [];

  if (tipe === "koreksi_bahan") {
    const bahanSheet = ss.getSheetByName(SHEET_BAHAN);
    const bahanData = bahanSheet.getDataRange().getValues();

    items.forEach(item => {
      const { id, delta } = item;
      for (let i = 1; i < bahanData.length; i++) {
        if (bahanData[i][COL_BAHAN.id] == id) {
          const currentStok = Number(bahanData[i][COL_BAHAN.stok]) || 0;
          const newStok = currentStok + Number(delta);
          bahanSheet.getRange(i + 1, COL_BAHAN.stok + 1).setValue(newStok);
          bahanData[i][COL_BAHAN.stok] = newStok;
          break;
        }
      }
      logs.push({ tipe: "koreksi_bahan", id_item: id, qty: Number(delta), user, ref_no: refNo });
    });

  } else if (tipe === "koreksi_resep") {
    const resepSheet = ss.getSheetByName(SHEET_RESEP);
    const resepData = resepSheet.getDataRange().getValues();

    items.forEach(item => {
      const { id, delta } = item;
      for (let i = 1; i < resepData.length; i++) {
        if (resepData[i][COL_RESEP.id] == id) {
          const currentStok = Number(resepData[i][COL_RESEP.stok]) || 0;
          const newStok = currentStok + Number(delta);
          resepSheet.getRange(i + 1, COL_RESEP.stok + 1).setValue(newStok);
          resepData[i][COL_RESEP.stok] = newStok;
          break;
        }
      }
      logs.push({ tipe: "koreksi_resep", id_item: id, qty: Number(delta), user, ref_no: refNo });
    });
  }

  insertLogs(logs);
  return { success: true, ref_no: refNo, processed: items.length };
}
