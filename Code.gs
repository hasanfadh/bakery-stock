// ============================================================
// BAKERY STOCK MANAGEMENT - Google Apps Script Backend
// ============================================================

const SHEET_BAHAN = "Master_Bahan";
const SHEET_RESEP = "Master_Resep";
const SHEET_BOM = "BOM_Resep";
const SHEET_LOG = "Log_Transaksi";
// Setengah Jadi
const SHEET_SETENGAH_JADI = "Master_SetengahJadi";
const SHEET_LOG_SETENGAH_JADI = "Log_SetengahJadi";

const COL_BAHAN = { id: 0, nama: 1, satuan: 2, stok: 3, min_stok: 4 };
const COL_RESEP = { id: 0, nama: 1, stok: 2 };
const COL_BOM = { id_resep: 0, nama_resep: 1, id_bahan: 2, nama_bahan: 3, qty: 4 };
const COL_LOG = { tanggal: 0, tipe: 1, id_item: 2, qty: 3, user: 4, ref_no: 5 };
// ✨ NEW
const COL_SJ = { id: 0, nama: 1, stok: 2 };
const COL_LOG_SJ = { tanggal: 0, id_item: 1, nama: 2, delta: 3, stok_sebelum: 4, stok_sesudah: 5, user: 6, ref_no: 7 };

// ============================================================
// Helper response
// ============================================================
function makeResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// doGet
// ============================================================
function doGet(e) {
  try {
    const action = e && e.parameter && e.parameter.action;
    if (!action) {
      return makeResponse({ status: "ok", message: "Bakery Stock API running" });
    }
    if (action === "getMasterData") {
      return makeResponse(getMasterData());
    }
    // ✨ NEW
    if (action === "getSetengahJadi") {
      return makeResponse(getSetengahJadi());
    }
    return makeResponse({ error: "Unknown action: " + action });
  } catch (err) {
    return makeResponse({ error: err.message });
  }
}

// ============================================================
// doPost
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
    } else if (action == "bahanKeluar") {
      result = bahanKeluar(body);
    } else if (action === "koreksiStok") {
      result = koreksiStok(body);
    // ✨ NEW
    } else if (action === "koreksiSetengahJadi") {
      result = koreksiSetengahJadi(body);
    } else {
      result = { error: "Unknown action: " + action };
    }

    return makeResponse(result);
  } catch (err) {
    return makeResponse({ error: err.message, stack: err.stack });
  }
}

// ============================================================
// Helper: getNextEmptyRow
// ============================================================
function getNextEmptyRow(sheet) {
  const colA = sheet.getRange("A:A").getValues();
  for (let i = colA.length - 1; i >= 0; i--) {
    if (colA[i][0] !== "") return i + 2;
  }
  return 1;
}

// ============================================================
// Helper: generateRefNo  TRX-YYYYMMDD-XXX
// ============================================================
function generateRefNo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(SHEET_LOG);
  const today = new Date();
  const dateStr = Utilities.formatDate(today, Session.getScriptTimeZone(), "yyyyMMdd");
  const prefix = "TRX-" + dateStr + "-";

  const data = logSheet.getDataRange().getValues();
  let counter = 0;
  for (let i = 1; i < data.length; i++) {
    const refNo = data[i][COL_LOG.ref_no];
    if (refNo && refNo.toString().startsWith(prefix)) counter++;
  }
  counter++;
  return prefix + counter.toString().padStart(3, "0");
}

// ============================================================
// Helper: insertLogs
// ============================================================
function insertLogs(logs) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(SHEET_LOG);
  const now = new Date();
  const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");

  logs.forEach(function(log) {
    const nextRow = getNextEmptyRow(logSheet);
    logSheet.getRange(nextRow, 1, 1, 6).setValues([[
      dateStr, log.tipe, log.id_item, log.qty, log.user, log.ref_no
    ]]);
  });
}

// ============================================================
// getMasterData
// ============================================================
function getMasterData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const bahanData = ss.getSheetByName(SHEET_BAHAN).getDataRange().getValues();
  const bahan = bahanData.slice(1).map(function(row) {
    return {
      id_bahan: row[COL_BAHAN.id],
      nama_bahan: row[COL_BAHAN.nama],
      satuan: row[COL_BAHAN.satuan],
      stok_gudang: Number(row[COL_BAHAN.stok]) || 0,
      minimum_stok: Number(row[COL_BAHAN.min_stok]) || 0
    };
  }).filter(function(b) { return b.id_bahan !== ""; });

  const resepData = ss.getSheetByName(SHEET_RESEP).getDataRange().getValues();
  const resep = resepData.slice(1).map(function(row) {
    return {
      id_resep: row[COL_RESEP.id],
      nama_resep: row[COL_RESEP.nama],
      stok_resepan: Number(row[COL_RESEP.stok]) || 0
    };
  }).filter(function(r) { return r.id_resep !== ""; });

  const bomData = ss.getSheetByName(SHEET_BOM).getDataRange().getValues();
  const bom = bomData.slice(1).map(function(row) {
    return {
      id_resep: row[COL_BOM.id_resep],
      nama_resep: row[COL_BOM.nama_resep],
      id_bahan: row[COL_BOM.id_bahan],
      nama_bahan: row[COL_BOM.nama_bahan],
      qty_per_resep: Number(row[COL_BOM.qty]) || 0
    };
  }).filter(function(b) { return b.id_resep !== ""; });

  return { bahan, resep, bom };
}

// ============================================================
// bahanMasuk
// ============================================================
function bahanMasuk(body) {
  const { user, items } = body;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bahanSheet = ss.getSheetByName(SHEET_BAHAN);
  const bahanData = bahanSheet.getDataRange().getValues();
  const refNo = generateRefNo();
  const logs = [];

  items.forEach(function(item) {
    for (let i = 1; i < bahanData.length; i++) {
      if (bahanData[i][COL_BAHAN.id] == item.id_bahan) {
        const newStok = (Number(bahanData[i][COL_BAHAN.stok]) || 0) + Number(item.qty);
        bahanSheet.getRange(i + 1, COL_BAHAN.stok + 1).setValue(newStok);
        bahanData[i][COL_BAHAN.stok] = newStok;
        break;
      }
    }
    logs.push({ tipe: "bahan_masuk", id_item: item.id_bahan, qty: Number(item.qty), user, ref_no: refNo });
  });

  insertLogs(logs);
  return { success: true, ref_no: refNo, processed: items.length };
}

// ============================================================
// bahanKeluar
// ============================================================
function bahanKeluar(body) {
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
        const newStok = currentStok - Number(qty);
        bahanSheet.getRange(i + 1, COL_BAHAN.stok + 1).setValue(newStok);
        bahanData[i][COL_BAHAN.stok] = newStok;
        break;
      }
    }
    logs.push({ tipe: "bahan_keluar", id_item: id_bahan, qty: Number(qty), user, ref_no: refNo });
  });
 
  insertLogs(logs);
  return { success: true, ref_no: refNo, processed: items.length };
}

// ============================================================
// resepMasuk
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

  let namaResep = "";
  for (let i = 1; i < resepData.length; i++) {
    if (resepData[i][COL_RESEP.id] == id_resep) {
      namaResep = resepData[i][COL_RESEP.nama];
      const newStok = (Number(resepData[i][COL_RESEP.stok]) || 0) + Number(batch);
      resepSheet.getRange(i + 1, COL_RESEP.stok + 1).setValue(newStok);
      break;
    }
  }

  logs.push({ tipe: "resep_masuk", id_item: id_resep, qty: Number(batch), user, ref_no: refNo });

  for (let i = 1; i < bomData.length; i++) {
    if (bomData[i][COL_BOM.id_resep] == id_resep) {
      const idBahan = bomData[i][COL_BOM.id_bahan];
      const totalQty = (Number(bomData[i][COL_BOM.qty]) || 0) * Number(batch);

      for (let j = 1; j < bahanData.length; j++) {
        if (bahanData[j][COL_BAHAN.id] == idBahan) {
          const newStok = (Number(bahanData[j][COL_BAHAN.stok]) || 0) - totalQty;
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
// resepKeluar
// ============================================================
function resepKeluar(body) {
  const { user, items } = body;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const resepSheet = ss.getSheetByName(SHEET_RESEP);
  const resepData = resepSheet.getDataRange().getValues();
  const refNo = generateRefNo();
  const logs = [];

  items.forEach(function(item) {
    for (let i = 1; i < resepData.length; i++) {
      if (resepData[i][COL_RESEP.id] == item.id_resep) {
        const newStok = (Number(resepData[i][COL_RESEP.stok]) || 0) - Number(item.batch);
        resepSheet.getRange(i + 1, COL_RESEP.stok + 1).setValue(newStok);
        resepData[i][COL_RESEP.stok] = newStok;
        break;
      }
    }
    logs.push({ tipe: "resep_keluar", id_item: item.id_resep, qty: Number(item.batch), user, ref_no: refNo });
  });

  insertLogs(logs);
  return { success: true, ref_no: refNo, processed: items.length };
}

// ============================================================
// koreksiStok
// ============================================================
function koreksiStok(body) {
  const { user, tipe, items } = body;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const refNo = generateRefNo();
  const logs = [];

  if (tipe === "koreksi_bahan") {
    const bahanSheet = ss.getSheetByName(SHEET_BAHAN);
    const bahanData = bahanSheet.getDataRange().getValues();
    items.forEach(function(item) {
      for (let i = 1; i < bahanData.length; i++) {
        if (bahanData[i][COL_BAHAN.id] == item.id) {
          const newStok = (Number(bahanData[i][COL_BAHAN.stok]) || 0) + Number(item.delta);
          bahanSheet.getRange(i + 1, COL_BAHAN.stok + 1).setValue(newStok);
          bahanData[i][COL_BAHAN.stok] = newStok;
          break;
        }
      }
      logs.push({ tipe: "koreksi_bahan", id_item: item.id, qty: Number(item.delta), user, ref_no: refNo });
    });

  } else if (tipe === "koreksi_resep") {
    const resepSheet = ss.getSheetByName(SHEET_RESEP);
    const resepData = resepSheet.getDataRange().getValues();
    items.forEach(function(item) {
      for (let i = 1; i < resepData.length; i++) {
        if (resepData[i][COL_RESEP.id] == item.id) {
          const newStok = (Number(resepData[i][COL_RESEP.stok]) || 0) + Number(item.delta);
          resepSheet.getRange(i + 1, COL_RESEP.stok + 1).setValue(newStok);
          resepData[i][COL_RESEP.stok] = newStok;
          break;
        }
      }
      logs.push({ tipe: "koreksi_resep", id_item: item.id, qty: Number(item.delta), user, ref_no: refNo });
    });
  }

  insertLogs(logs);
  return { success: true, ref_no: refNo, processed: items.length };
}

// ============================================================
// getSetengahJadi
// ============================================================
function getSetengahJadi() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_SETENGAH_JADI);
  const data = sheet.getDataRange().getValues();

  const setengah_jadi = data.slice(1).map(function(row) {
    return {
      id_setengah_jadi: row[COL_SJ.id],
      nama: row[COL_SJ.nama],
      stok: Number(row[COL_SJ.stok]) || 0
    };
  }).filter(function(item) { return item.id_setengah_jadi !== ""; });

  return { setengah_jadi };
}


// ============================================================
// koreksiSetengahJadi
// Menerima `aktual` (stok hasil hitung fisik), delta dihitung di sini
// ============================================================
function koreksiSetengahJadi(body) {
  const { user, items } = body;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_SETENGAH_JADI);
  const logSheet = ss.getSheetByName(SHEET_LOG_SETENGAH_JADI);
  const data = sheet.getDataRange().getValues();
  const refNo = generateRefNo();
  const now = new Date();
  const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");

  items.forEach(function(item) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][COL_SJ.id] == item.id) {
        const stokSebelum = Number(data[i][COL_SJ.stok]) || 0;
        const stokSesudah = Number(item.aktual); // langsung set ke nilai aktual
        const delta = stokSesudah - stokSebelum;  // hitung selisih di GAS
        const nama = data[i][COL_SJ.nama];

        // Update stok di Master_SetengahJadi
        sheet.getRange(i + 1, COL_SJ.stok + 1).setValue(stokSesudah);
        data[i][COL_SJ.stok] = stokSesudah;

        // Catat ke Log_SetengahJadi (simpan stok_sebelum, stok_aktual, delta)
        const nextRow = getNextEmptyRow(logSheet);
        logSheet.getRange(nextRow, 1, 1, 8).setValues([[
          dateStr,
          item.id,
          nama,
          stokSebelum,
          stokSesudah,
          delta,
          user,
          refNo
        ]]);
        break;
      }
    }
  });

  return { success: true, ref_no: refNo, processed: items.length };
}
