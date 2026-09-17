function getSheetName(){
  var prop = PropertiesService.getScriptProperties().getProperty('SHEET_NAME');
  return prop || 'Entries';
}

// 新增 pinned 欄位：1 = 已釘選，空白 = 未釘選
const HEADERS = ['id','category','country','region','title','content','date','companions','createdAt','pinned'];

function doGet(e) {
  try {
    var sheet = getSheet();
    var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    var data = sheet.getDataRange().getValues();
    var headers = data.shift();
    var rows = data.map(function(row){
      var obj = {};
      headers.forEach(function(h, i){ obj[h] = row[i]; });
      obj.pinned = isTruthy(obj.pinned);
      // 「日期」欄位在 Sheet 裡若被存成日期型別，讀出來會是 Date 物件；
      // 統一轉回 yyyy-MM-dd 純字串，否則前端 <input type="date"> 會拒收帶時間/時區的值
      if (obj.date instanceof Date) {
        obj.date = Utilities.formatDate(obj.date, tz, 'yyyy-MM-dd');
      }
      return obj;
    });
    return jsonOut({ ok: true, entries: rows });
  } catch (err) {
    Logger.log('doGet error: ' + err.message + '\n' + err.stack);
    return jsonOut({ ok: false, error: err.message, stack: err.stack });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // 避免多個請求同時寫入造成資料錯亂/遺失
    var gotLock = lock.tryLock(10000);
    if (!gotLock) {
      throw new Error('系統忙碌中，無法取得寫入鎖，請稍後再試');
    }

    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('沒有收到任何 POST 資料 (e.postData.contents 是空的)');
    }

    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      throw new Error('POST 內容不是合法的 JSON：' + parseErr.message);
    }

    var sheet = getSheet();

    if (body.action === 'create' || body.action === 'update') {
      if (!body.entry || !body.entry.id) {
        throw new Error('缺少 entry 或 entry.id，無法寫入');
      }
      var result = upsertRow(sheet, body.entry);
      return jsonOut({ ok: true, action: body.action, id: body.entry.id, wroteToRow: result.row, wasUpdate: result.wasUpdate });

    } else if (body.action === 'pin') {
      if (!body.id) {
        throw new Error('缺少 id，無法更新釘選狀態');
      }
      var pinned = !!body.pinned;
      var done = setPinned(sheet, body.id, pinned);
      if (!done) {
        throw new Error('找不到 id=' + body.id + ' 的資料，釘選失敗');
      }
      return jsonOut({ ok: true, action: 'pin', id: body.id, pinned: pinned });

    } else if (body.action === 'delete') {
      if (!body.id) {
        throw new Error('缺少 id，無法刪除');
      }
      var deleted = deleteRow(sheet, body.id);
      if (!deleted) {
        throw new Error('找不到 id=' + body.id + ' 的資料，刪除失敗');
      }
      return jsonOut({ ok: true, action: 'delete', id: body.id });
    } else {
      throw new Error('未知的 action：' + body.action);
    }

  } catch (err) {
    Logger.log('doPost error: ' + err.message + '\n' + err.stack);
    return jsonOut({ ok: false, error: err.message, stack: err.stack });
  } finally {
    lock.releaseLock();
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function isTruthy(v){
  if (v === true) return true;
  var s = String(v === undefined || v === null ? '' : v).trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'y';
}

function getSheet(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('SpreadsheetApp.getActiveSpreadsheet() 回傳空值——這個指令碼可能沒有綁定到任何 Google Sheet，請改用 SpreadsheetApp.openById(表單ID) 明確指定');
  }
  var name = getSheetName();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(HEADERS);
    setDateColumnAsText(sheet);
    SpreadsheetApp.flush();
    return sheet;
  }
  ensureHeaders(sheet);
  setDateColumnAsText(sheet);
  return sheet;
}

// 把「date」欄位設成純文字格式，避免 Sheets 自動把 yyyy-MM-dd 字串轉成日期型別
// （轉成日期型別後 doGet 讀回來會帶時間與時區，讓 <input type="date"> 拒收）
function setDateColumnAsText(sheet){
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return;
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var dateCol = headers.indexOf('date');
  if (dateCol === -1) return;
  sheet.getRange(1, dateCol + 1, Math.max(sheet.getMaxRows(), 2), 1).setNumberFormat('@');
}

// 舊試算表沒有 pinned 欄位時，自動補上標題，不動到既有資料
function ensureHeaders(sheet){
  var lastCol = sheet.getLastColumn();
  if (sheet.getLastRow() === 0 || lastCol === 0) {
    sheet.appendRow(HEADERS);
    SpreadsheetApp.flush();
    return;
  }
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var missing = HEADERS.filter(function(h){ return headers.indexOf(h) === -1; });
  if (missing.length) {
    sheet.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
    SpreadsheetApp.flush();
  }
}

function upsertRow(sheet, entry) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  if (idCol === -1) {
    throw new Error('工作表標題列找不到 "id" 欄位，請確認第一列標題是否正確：' + headers.join(', '));
  }
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(entry.id)) {
      // 前端沒有送出的欄位（例如 pinned）保留原值，不會被清空
      var rowVals = headers.map(function(h, i){
        if (entry[h] === undefined) return data[r][i];
        return h === 'pinned' ? (isTruthy(entry[h]) ? 1 : '') : entry[h];
      });
      sheet.getRange(r + 1, 1, 1, headers.length).setValues([rowVals]);
      SpreadsheetApp.flush();
      return { row: r + 1, wasUpdate: true };
    }
  }
  var newRow = headers.map(function(h){
    if (h === 'pinned') return isTruthy(entry[h]) ? 1 : '';
    return entry[h] !== undefined ? entry[h] : '';
  });
  sheet.appendRow(newRow);
  SpreadsheetApp.flush();
  return { row: sheet.getLastRow(), wasUpdate: false };
}

function setPinned(sheet, id, pinned) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  var pinCol = headers.indexOf('pinned');
  if (idCol === -1) {
    throw new Error('工作表標題列找不到 "id" 欄位');
  }
  if (pinCol === -1) {
    throw new Error('工作表標題列找不到 "pinned" 欄位，請重新整理頁面再試一次');
  }
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(id)) {
      sheet.getRange(r + 1, pinCol + 1).setValue(pinned ? 1 : '');
      SpreadsheetApp.flush();
      return true;
    }
  }
  return false;
}

function deleteRow(sheet, id) {
  var data = sheet.getDataRange().getValues();
  var idCol = data[0].indexOf('id');
  if (idCol === -1) {
    throw new Error('工作表標題列找不到 "id" 欄位');
  }
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(id)) {
      sheet.deleteRow(r + 1);
      SpreadsheetApp.flush();
      return true;
    }
  }
  return false;
}
