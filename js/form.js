window.App = window.App || {};

// ---------- FORM ----------
App.openForm = function(entry){
  App.state.editingId = entry ? entry.id : null;
  document.getElementById('formTitle').textContent = entry ? '編輯這則日誌' : '投稿一則日誌';
  document.getElementById('fCountry').value = entry ? entry.country || '' : '';
  document.getElementById('fRegion').value = entry ? entry.region || '' : '';
  document.getElementById('fTitle').value = entry ? entry.title || '' : '';
  document.getElementById('fContent').value = entry ? entry.content || '' : '';
  document.getElementById('fDate').value = entry ? (entry.date || '') : App.todayStr();
  document.getElementById('fCompanions').value = entry ? entry.companions || '' : '';
  App.setFormCategory(entry ? entry.category : 'customs');
  App.dom.formOverlay.classList.add('open');
  setTimeout(function(){ document.getElementById('fCountry').focus(); }, 50);
};

App.closeForm = function(){
  App.dom.formOverlay.classList.remove('open');
  App.dom.entryForm.reset();
  App.state.editingId = null;
};

document.getElementById('btnAdd').addEventListener('click', function(){ App.openForm(); });
document.getElementById('btnCloseFormTop').addEventListener('click', App.closeForm);
App.dom.formOverlay.addEventListener('click', function(e){ if(e.target === App.dom.formOverlay) App.closeForm(); });

App.dom.entryForm.addEventListener('submit', async function(e){
  e.preventDefault();
  var country = document.getElementById('fCountry').value.trim();
  var title = document.getElementById('fTitle').value.trim();
  if(!country){ document.getElementById('fCountry').focus(); return; }
  if(!title){ document.getElementById('fTitle').focus(); return; }

  var submitBtn = App.dom.entryForm.querySelector('.btn-primary');
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
    App.closeForm();
    await App.loadEntries(); // 重新向後端確認最新資料，畫面只顯示真正寫入成功的內容
    App.showToast(existing ? '已更新這則日誌' : '已發布新的日誌');
  }catch(err){
    App.showToast('儲存失敗：' + err.message);
  }finally{
    submitBtn.disabled = false;
    submitBtn.textContent = '發布';
  }
});
