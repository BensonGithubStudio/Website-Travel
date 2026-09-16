window.App = window.App || {};

// ---------- STORAGE (Google Sheet via Apps Script Web App) ----------
// 把「已部署的 Apps Script 網頁應用程式」網址貼在這裡（結尾是 /exec）
App.API_URL = 'https://script.google.com/macros/s/AKfycbzazYHRWD_DzyQUWvnMMqVa0SPTu0RZmMYH9jF1DuBqBiasnfg5P2dHMimq5uI82JUD/exec';

App.loadEntries = async function(){
  var content = App.dom.content;
  content.innerHTML = '<div class="loading">正在排版今天的頭條…</div>';
  try{
    var res = await fetch(App.API_URL);
    var json = await res.json();
    if(!json || !json.ok) throw new Error((json && json.error) ? json.error : '讀取失敗（後端未回傳錯誤訊息）');
    var entries = json.entries || [];
    entries.forEach(function(e){
      e.createdAt = Number(e.createdAt) || 0;
      e.pinned = App.truthy(e.pinned);
      e.date = App.toDateInputValue(e.date);
    });
    entries.sort(function(a,b){ return (b.createdAt||0) - (a.createdAt||0); });
    App.state.entries = entries;
    App.renderAll();
  }catch(e){
    content.innerHTML = '<div class="error-box"><span>資料讀取失敗：' + (e.message || '請確認 Google Sheet 後端網址是否已設定正確') + '</span><button id="retryLoad">重試</button></div>';
    var btn = document.getElementById('retryLoad');
    if(btn) btn.addEventListener('click', App.loadEntries);
  }
};

App.saveEntryData = async function(data, isUpdate){
  var res = await fetch(App.API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // 避免觸發 CORS 預檢，Apps Script 會自行解析 JSON
    body: JSON.stringify({ action: isUpdate ? 'update' : 'create', entry: data })
  });
  var json = await res.json();
  if(!json || !json.ok) throw new Error((json && json.error) ? json.error : '儲存失敗（後端未回傳錯誤訊息）');
  return json;
};

App.deleteEntryData = async function(id){
  var res = await fetch(App.API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'delete', id: id })
  });
  var json = await res.json();
  if(!json || !json.ok) throw new Error((json && json.error) ? json.error : '刪除失敗（後端未回傳錯誤訊息）');
  return json;
};

App.setPinnedData = async function(id, pinned){
  var res = await fetch(App.API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'pin', id: id, pinned: !!pinned })
  });
  var json = await res.json();
  if(!json || !json.ok) throw new Error((json && json.error) ? json.error : '釘選失敗（後端未回傳錯誤訊息）');
  return json;
};
