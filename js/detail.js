window.App = window.App || {};

// ---------- DETAIL ----------
App.openDetail = function(id){
  var e = App.state.entries.find(function(x){ return x.id === id; });
  if(!e) return;
  App.state.deleteConfirmId = null;
  App.renderDetail(e);
  App.dom.detailOverlay.classList.add('open');
};

App.closeDetail = function(){
  App.dom.detailOverlay.classList.remove('open');
  App.state.deleteConfirmId = null;
};

App.renderDetail = function(e){
  var c = App.CATS[e.category] || App.CATS.customs;
  var footerHtml;
  if(App.state.deleteConfirmId === e.id){
    footerHtml =
      '<div class="confirm-row">確定要刪除這則日誌嗎？' +
        '<button type="button" class="btn-danger" id="btnConfirmDelete">確定刪除</button>' +
        '<button type="button" class="btn-secondary" id="btnCancelDelete">再想想</button>' +
      '</div><div></div>';
  } else {
    footerHtml =
      '<div class="left-actions">' +
        '<button type="button" class="btn-secondary" id="btnEditEntry">編輯</button>' +
        '<button type="button" class="btn-danger" id="btnDeleteEntry">刪除</button>' +
      '</div>' +
      '<button type="button" class="btn-primary" id="btnCloseDetail">關閉</button>';
  }

  App.dom.detailSheet.innerHTML =
    '<span class="detail-kicker" style="background:' + c.hex + '">' + c.label + '</span>' +
    '<p class="detail-country">' + App.esc(e.country) + (e.region ? ' ・ ' + App.esc(e.region) : '') + '</p>' +
    '<h2 class="detail-title">' + App.esc(e.title) + '</h2>' +
    '<p class="detail-meta">' + App.esc([App.formatDate(e.date), e.companions ? '與 ' + e.companions : ''].filter(Boolean).join(' ・ ')) + '</p>' +
    '<p class="detail-body">' + App.esc(e.content || '還沒有寫下內容。') + '</p>' +
    '<div class="detail-footer">' + footerHtml + '</div>';

  var closeBtn = document.getElementById('btnCloseDetail');
  if(closeBtn) closeBtn.addEventListener('click', App.closeDetail);
  var editBtn = document.getElementById('btnEditEntry');
  if(editBtn) editBtn.addEventListener('click', function(){ App.closeDetail(); App.openForm(e); });
  var delBtn = document.getElementById('btnDeleteEntry');
  if(delBtn) delBtn.addEventListener('click', function(){ App.state.deleteConfirmId = e.id; App.renderDetail(e); });
  var cancelDelBtn = document.getElementById('btnCancelDelete');
  if(cancelDelBtn) cancelDelBtn.addEventListener('click', function(){ App.state.deleteConfirmId = null; App.renderDetail(e); });
  var confirmDelBtn = document.getElementById('btnConfirmDelete');
  if(confirmDelBtn) confirmDelBtn.addEventListener('click', async function(){
    confirmDelBtn.disabled = true;
    confirmDelBtn.textContent = '刪除中…';
    try{
      await App.deleteEntryData(e.id);
      App.closeDetail();
      await App.loadEntries(); // 重新向後端確認，畫面只顯示真正刪除成功後的內容
      App.showToast('已刪除這則日誌');
    }catch(err){
      App.showToast('刪除失敗：' + err.message);
      confirmDelBtn.disabled = false;
      confirmDelBtn.textContent = '確定刪除';
    }
  });
};

App.dom.detailOverlay.addEventListener('click', function(e){ if(e.target === App.dom.detailOverlay) App.closeDetail(); });
