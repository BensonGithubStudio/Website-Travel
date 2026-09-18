window.App = window.App || {};

App.LINK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.5-1.5"/></svg>';

// 若內容裡有網址，整理成「相關連結」卡片列表；沒有就回傳空字串
App.renderLinksHtml = function(content){
  var links = App.extractLinks(content);
  if(!links.length) return '';
  var items = links.map(function(l){
    return '<a class="link-chip" href="' + App.esc(l.url) + '" target="_blank" rel="noopener noreferrer">' +
      '<img class="link-favicon" src="https://www.google.com/s2/favicons?sz=32&domain=' + encodeURIComponent(l.domain) + '" alt="" loading="lazy">' +
      '<span class="link-domain">' + App.esc(l.domain) + '</span>' +
      '<span class="link-go">' + App.LINK_SVG + '</span>' +
    '</a>';
  }).join('');
  return '<div class="detail-links"><p class="detail-links-title">相關連結</p><div class="link-chip-row">' + items + '</div></div>';
};

// ---------- DETAIL ----------
App.openDetail = function(id){
  if(App.state.busy) return;
  var e = App.state.entries.find(function(x){ return x.id === id; });
  if(!e) return;
  App.state.deleteConfirmId = null;
  App.state.detailId = e.id;
  App.renderDetail(e);
  App.dom.detailOverlay.classList.add('open');
};

App.closeDetail = function(){
  if(App.state.busy) return; // 動作進行中不允許關閉
  App.dom.detailOverlay.classList.remove('open');
  App.state.deleteConfirmId = null;
  App.state.detailId = null;
};

App.renderDetail = function(e){
  var c = App.CATS[e.category] || App.CATS.customs;
  var isPinned = App.truthy(e.pinned);
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
        '<button type="button" class="btn-secondary' + (isPinned ? ' is-pinned' : '') + '" id="btnTogglePin">' + (isPinned ? '取消釘選' : '釘選') + '</button>' +
        '<button type="button" class="btn-secondary" id="btnEditEntry">編輯</button>' +
        '<button type="button" class="btn-danger" id="btnDeleteEntry">刪除</button>' +
      '</div>' +
      '<button type="button" class="btn-primary" id="btnCloseDetail">關閉</button>';
  }

  App.dom.detailSheet.innerHTML =
    '<span class="detail-kicker" style="background:' + c.hex + '">' + c.label + '</span>' +
    (isPinned ? '<span class="detail-pinned">' + App.PIN_SVG + '已釘選</span>' : '') +
    '<p class="detail-country">' + App.esc(e.country) + (e.region ? ' ・ ' + App.esc(e.region) : '') + '</p>' +
    '<h2 class="detail-title">' + App.esc(e.title) + '</h2>' +
    '<p class="detail-meta">' + App.esc([App.formatDate(e.date), e.companions ? '與 ' + e.companions : ''].filter(Boolean).join(' ・ ')) + '</p>' +
    '<p class="detail-body">' + (e.content ? App.linkify(App.esc(e.content)) : '還沒有寫下內容。') + '</p>' +
    App.renderLinksHtml(e.content) +
    '<div class="detail-footer">' + footerHtml + '</div>';

  var closeBtn = document.getElementById('btnCloseDetail');
  if(closeBtn) closeBtn.addEventListener('click', App.closeDetail);
  var pinBtn = document.getElementById('btnTogglePin');
  if(pinBtn) pinBtn.addEventListener('click', function(){
    if(App.state.busy) return;
    pinBtn.textContent = '處理中…';
    App.togglePin(e.id, pinBtn);
  });
  var editBtn = document.getElementById('btnEditEntry');
  if(editBtn) editBtn.addEventListener('click', function(){
    if(App.state.busy) return;
    App.lockButtons(App.dom.detailSheet);
    App.closeDetail();
    App.openForm(e);
  });
  var delBtn = document.getElementById('btnDeleteEntry');
  if(delBtn) delBtn.addEventListener('click', function(){
    if(App.state.busy) return;
    delBtn.disabled = true;
    App.state.deleteConfirmId = e.id;
    App.renderDetail(e);
  });
  var cancelDelBtn = document.getElementById('btnCancelDelete');
  if(cancelDelBtn) cancelDelBtn.addEventListener('click', function(){
    if(App.state.busy) return;
    cancelDelBtn.disabled = true;
    App.state.deleteConfirmId = null;
    App.renderDetail(e);
  });
  var confirmDelBtn = document.getElementById('btnConfirmDelete');
  if(confirmDelBtn) confirmDelBtn.addEventListener('click', async function(){
    if(App.state.busy) return;
    App.state.busy = true;
    var unlock = App.lockButtons(document.body);
    confirmDelBtn.disabled = true;
    confirmDelBtn.textContent = '刪除中…';
    try{
      await App.deleteEntryData(e.id);
      App.state.busy = false;
      App.closeDetail();
      await App.loadEntries(); // 重新向後端確認，畫面只顯示真正刪除成功後的內容
      App.showToast('已刪除這則日誌');
    }catch(err){
      App.showToast('刪除失敗：' + err.message);
      confirmDelBtn.textContent = '確定刪除';
    }finally{
      App.state.busy = false;
      unlock();
    }
  });
};

App.dom.detailOverlay.addEventListener('click', function(e){ if(e.target === App.dom.detailOverlay) App.closeDetail(); });
