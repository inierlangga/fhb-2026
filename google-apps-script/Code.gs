// =========================================================================
// SCRIPT BACKEND GOOGLE APPS SCRIPT - PENDAFTARAN FHB 2026
// =========================================================================
// PANDUAN PENGGUNAAN:
// 1. Ganti SPREADSHEET_ID dengan ID Spreadsheet Anda.
// 2. Ganti FOLDER_ID dengan ID Folder Google Drive untuk menyimpan bukti bayar.
// 3. Klik "Deploy" > "New deployment".
// 4. Pilih "Web app".
// 5. Execute as: "Me", Who has access: "Anyone".
// 6. Copy URL Web App yang dihasilkan dan paste ke file js/main.js & js/admin.js di project Anda.

const SPREADSHEET_ID = 'GANTI_DENGAN_SPREADSHEET_ID_ANDA';
const FOLDER_ID = 'GANTI_DENGAN_FOLDER_ID_DRIVE_ANDA';
const SHEET_NAME = 'Sheet1';

function setup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  // Setup headers if empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp', 
      'ID Pendaftaran', 
      'Nama', 
      'NIM/NPM',
      'Email', 
      'WhatsApp', 
      'Institusi', 
      'Lomba', 
      'Anggota Tim', 
      'URL Bukti Bayar', 
      'Status'
    ]);
    sheet.getRange(1, 1, 1, 11).setFontWeight('bold');
  }
}

// POST endpoint untuk menerima form pendaftaran atau update status
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;

    if (action === 'register') {
      return handleRegistration(postData);
    } else if (action === 'update_status') {
      return handleUpdateStatus(postData);
    } else {
      return createJsonResponse({status: 'error', message: 'Action not valid'}, 400);
    }
  } catch (error) {
    return createJsonResponse({status: 'error', message: error.toString()}, 500);
  }
}

// GET endpoint untuk mengecek status pendaftaran atau mengambil semua data
function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === 'check_status') {
      const nim = e.parameter.nim;
      if (!nim) return createJsonResponse({status: 'error', message: 'NIM missing'});
      return handleCheckStatus(nim);
    } else if (action === 'get_all') {
      return handleGetAll();
    } else {
      // Endpoint test
      return ContentService.createTextOutput("FHB 2026 API is running.");
    }
  } catch (error) {
    return createJsonResponse({status: 'error', message: error.toString()}, 500);
  }
}

// --- Handlers ---

function handleRegistration(data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const folder = DriveApp.getFolderById(FOLDER_ID);
  
  // 1. Upload File
  const fileBlob = Utilities.newBlob(Utilities.base64Decode(data.fileBase64), data.mimeType, data.fileName);
  const file = folder.createFile(fileBlob);
  const fileUrl = file.getUrl();
  
  // 2. Generate ID
  const id = 'FHB-' + Math.random().toString(36).substr(2, 5).toUpperCase();
  
  // 3. Pastikan Header Ada
  if (sheet.getLastRow() === 0 || sheet.getRange(1, 1).getValue() !== 'Timestamp') {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, 11).setValues([['Timestamp', 'ID Pendaftaran', 'Nama', 'NIM/NPM', 'Email', 'WhatsApp', 'Institusi', 'Lomba', 'Anggota Tim', 'URL Bukti Bayar', 'Status']]);
    sheet.getRange(1, 1, 1, 11).setFontWeight('bold');
  }

  // 4. Simpan ke Sheets
  const timestamp = new Date();
  const status = 'Menunggu Verifikasi';
  
  sheet.appendRow([
    timestamp,
    id,
    data.nama,
    data.nim,
    data.email,
    data.whatsapp,
    data.institusi,
    data.lomba,
    data.anggota_tim || '-',
    fileUrl,
    status
  ]);
  
  return createJsonResponse({status: 'success', id: id});
}

function handleCheckStatus(nim) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  // Jika baris 1 bukan header (misal data langsung), mulai dari 0. Jika header, mulai dari 1.
  const startIndex = (data.length > 0 && data[0][0] === 'Timestamp') ? 1 : 0;
  
  for (let i = startIndex; i < data.length; i++) {
    const ketuaNim = data[i][3]; // Index 3 adalah NIM/NPM Ketua
    const anggotaString = data[i][8] || ''; // Index 8 adalah Anggota Tim
    
    // Cek apakah NIM cocok dengan Ketua ATAU ada di dalam daftar Anggota (format: Nama (NIM))
    if (ketuaNim == nim || anggotaString.includes('(' + nim + ')')) {
      return createJsonResponse({
        status: 'success',
        data: {
          id: data[i][1],
          nama: data[i][2],
          nim: data[i][3],
          lomba: data[i][7],
          status: data[i][10]
        }
      });
    }
  }
  
  return createJsonResponse({status: 'error', message: 'NIM tidak ditemukan'});
}

function handleGetAll() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  if (data.length === 0) {
    return createJsonResponse({status: 'success', data: []});
  }
  
  // Jika baris 1 bukan header, buat header buatan agar tidak error
  let headers = data[0];
  let startIndex = 1;
  if (headers[0] !== 'Timestamp') {
    headers = ['Timestamp', 'ID Pendaftaran', 'Nama', 'NIM/NPM', 'Email', 'WhatsApp', 'Institusi', 'Lomba', 'Anggota Tim', 'URL Bukti Bayar', 'Status'];
    startIndex = 0;
  }
  
  const result = [];
  
  for (let i = startIndex; i < data.length; i++) {
    let rowObj = {};
    for (let j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = data[i][j];
    }
    // Simpan nomor baris untuk mempermudah update
    rowObj['RowIndex'] = i + 1;
    result.push(rowObj);
  }
  
  // Urutkan dari yang terbaru (bawah) ke terlama (atas)
  result.reverse();
  
  return createJsonResponse({status: 'success', data: result});
}

function handleUpdateStatus(data) {
  const id = data.id;
  const newStatus = data.newStatus;
  
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const values = sheet.getDataRange().getValues();
  
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][1] === id) { // Index 1 adalah ID Pendaftaran
      rowIndex = i + 1; // Google Sheets row 1-indexed
      break;
    }
  }
  
  if (rowIndex !== -1) {
    sheet.getRange(rowIndex, 11).setValue(newStatus); // Kolom 11 adalah Status
    return createJsonResponse({status: 'success', message: 'Status berhasil diperbarui'});
  } else {
    return createJsonResponse({status: 'error', message: 'ID tidak ditemukan'});
  }
}

// --- Utils ---

function createJsonResponse(data, code = 200) {
  // Penting untuk CORS jika diakses dari web
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Enable CORS OPTIONS request handling
function doOptions(e) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
  return ContentService.createTextOutput("OK")
    .setMimeType(ContentService.MimeType.TEXT);
}
