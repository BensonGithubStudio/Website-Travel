window.App = window.App || {};

// ---------- FORM ----------
var FORM_FIELD_IDS = ['fCountry', 'fRegion', 'fTitle', 'fContent', 'fDate', 'fCompanions'];

// 讀取目前表單的所有欄位（分類＋6 個文字欄位），用來和原始內容比對
App.readFormState = function(){
  var s = { category: App.state.formCategory || '' };
  FORM_FIELD_IDS.forEach(function(id){
    s[id] = document.getElementById(id).value.trim();
  });
  return s;
};

// 只有「編輯模式」才需要比對；新增模式永遠可以發布
App.isFormDirty = function(){
  if(!App.state.editingId || !App.state.formSnapshot) return true;
  var now = App.readFormState();
  var snap = App.state.formSnapshot;
  return Object.keys(snap).some(function(k){ return snap[k] !== now[k]; });
};

App.updateSubmitState = function(){
  if(App.state.busy) return; // 送出中由 lockButtons 控制
  var submitBtn = App.dom.entryForm.querySelector('.btn-primary');
  submitBtn.disabled = !App.isFormDirty();
};

App.openForm = function(entry){
  if(App.state.busy) return;
  App.state.editingId = entry ? entry.id : null;
  document.getElementById('formTitle').textContent = entry ? '編輯這則日誌' : '投稿一則日誌';
  document.getElementById('fCountry').value = entry ? entry.country || '' : '';
  document.getElementById('fRegion').value = entry ? entry.region || '' : '';
  document.getElementById('fTitle').value = entry ? entry.title || '' : '';
  document.getElementById('fContent').value = entry ? entry.content || '' : '';
  document.getElementById('fDate').value = entry ? (entry.date || '') : App.todayStr();
  document.getElementById('fCompanions').value = entry ? entry.companions || '' : '';
  App.setFormCategory(entry ? entry.category : 'customs');

  // 欄位都填好之後拍快照：編輯時以此為「原本的內容」
  App.state.formSnapshot = entry ? App.readFormState() : null;
  App.updateSubmitState();

  App.dom.formOverlay.classList.add('open');
  setTimeout(function(){ document.getElementById('fCountry').focus(); }, 50);
};

App.closeForm = function(){
  if(App.state.busy) return; // 送出中不允許關閉
  App.dom.formOverlay.classList.remove('open');
  App.dom.entryForm.reset();
  App.state.editingId = null;
  App.state.formSnapshot = null;
  App.dom.entryForm.querySelector('.btn-primary').disabled = false;
};

document.getElementById('btnAdd').addEventListener('click', function(){ App.openForm(); });
document.getElementById('btnCloseFormTop').addEventListener('click', App.closeForm);
App.dom.formOverlay.addEventListener('click', function(e){ if(e.target === App.dom.formOverlay) App.closeForm(); });

// 任何欄位輸入或變更，都重新比對
App.dom.entryForm.addEventListener('input', App.updateSubmitState);
App.dom.entryForm.addEventListener('change', App.updateSubmitState);
// 分類切換：等分類按鈕自己的處理跑完（state 更新後）再比對
document.getElementById('catToggle').addEventListener('click', function(){
  setTimeout(App.updateSubmitState, 0);
});

App.dom.entryForm.addEventListener('submit', async function(e){
  e.preventDefault();
  if(App.state.busy) return;
  if(!App.isFormDirty()) return; // 編輯時內容沒變就不送出（例如按 Enter）
  var country = document.getElementById('fCountry').value.trim();
  var title = document.getElementById('fTitle').value.trim();
  if(!country){ document.getElementById('fCountry').focus(); return; }
  if(!title){ document.getElementById('fTitle').focus(); return; }

  var submitBtn = App.dom.entryForm.querySelector('.btn-primary');
  App.state.busy = true;
  var unlock = App.lockButtons(document.body);
  submitBtn.disabled = true;
  submitBtn.textContent = '發布中…';

  var existing = App.state.editingId ? App.state.entries.find(function(x){ return x.id === App.state.editingId; }) : null;
  var data = {
    id: App.state.editingId || App.uid(),
    category: App.state.formCategory,
    country: country,
    region: document.getElementById('fRegion').value.trim(),
    title: title,
    content: document.getElementById('fContent').value.trim(),
    date: document.getElementById('fDate').value.trim(),
    companions: document.getElementById('fCompanions').value.trim(),
    createdAt: existing ? existing.createdAt : Date.now()
  };

  try{
    await App.saveEntryData(data, !!existing);
    App.state.busy = false;
    App.closeForm();
    await App.loadEntries(); // 重新向後端確認最新資料，畫面只顯示真正寫入成功的內容
    App.showToast(existing ? '已更新這則日誌' : '已發布新的日誌');
  }catch(err){
    App.showToast('儲存失敗：' + err.message);
  }finally{
    App.state.busy = false;
    unlock();
    submitBtn.textContent = '發布';
    App.updateSubmitState(); // 依目前是否有修改決定按鈕狀態（失敗時表單仍開著）
  }
});
