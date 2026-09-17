window.App = window.App || {};

App.PIN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 3h5l-.9 6 3.4 2.6V14H7v-2.4L10.4 9z"/><path d="M12 14v7"/></svg>';

App.pinBtnHtml = function(e){
  var on = App.truthy(e.pinned);
  var label = on ? '取消釘選' : '釘選到最上面';
  return '<button type="button" class="btn-pin' + (on ? ' is-pinned' : '') + '" data-pin-id="' + App.esc(e.id) + '"' +
    ' aria-pressed="' + on + '" aria-label="' + label + '" title="' + label + '">' + App.PIN_SVG + '</button>';
};

App.bindPinBtns = function(root){
  Array.prototype.forEach.call(root.querySelectorAll('[data-pin-id]'), function(btn){
    btn.addEventListener('click', function(ev){
      ev.stopPropagation();
      App.togglePin(btn.dataset.pinId, btn);
    });
  });
};

App.togglePin = async function(id, btn){
  if(App.state.busy) return;
  var entry = App.state.entries.find(function(x){ return String(x.id) === String(id); });
  if(!entry) return;
  var next = !App.truthy(entry.pinned);
  App.state.busy = true;
  if(btn) btn.disabled = true;
  var unlock = App.lockButtons(document.body);
  App.showToast(next ? '釘選中…' : '取消釘選中…');
  try{
    await App.setPinnedData(entry.id, next);
    entry.pinned = next;
    App.renderContent();
    if(App.dom.detailOverlay.classList.contains('open') && String(App.state.detailId) === String(entry.id)){
      App.renderDetail(entry);
    }
    App.showToast(next ? '已釘選，會固定在最上面' : '已取消釘選');
  }catch(err){
    App.showToast('釘選沒有成功：' + err.message);
    if(App.dom.detailOverlay.classList.contains('open') && String(App.state.detailId) === String(entry.id)){
      App.renderDetail(entry); // 還原按鈕文字
    }
  }finally{
    App.state.busy = false;
    unlock();
  }
};

App.uniqueCountries = function(){
  var seen = {};
  var list = [];
  App.state.entries.forEach(function(e){
    var c = (e.country||'').trim();
    if(c && !seen[c]){ seen[c] = true; list.push(c); }
  });
  list.sort(function(a,b){ return a.localeCompare('zh-Hant'); });
  return list;
};

App.renderAll = function(){
  App.renderStatStrip();
  App.renderCountryRow();
  App.renderContent();
  document.getElementById('countLine').textContent = '共 ' + App.state.entries.length + ' 則日誌';
};

App.renderStatStrip = function(){
  var counts = { exit:0, customs:0, precaution:0, reflection:0 };
  App.state.entries.forEach(function(e){ if(counts.hasOwnProperty(e.category)) counts[e.category]++; });
  var strip = document.getElementById('statStrip');
  strip.innerHTML = App.CAT_ORDER.map(function(key){
    var c = App.CATS[key];
    return '<span class="item"><span class="dot" style="background:' + c.hex + '"></span>' + c.label + ' ' + counts[key] + '</span>';
  }).join('');
};

App.renderCountryRow = function(){
  var row = document.getElementById('countryRow');
  var countries = App.uniqueCountries();
  var html = '<button class="pill' + (App.state.country === 'all' ? ' active' : '') + '" data-country="all">全部國家</button>';
  countries.forEach(function(c){
    html += '<button class="pill' + (App.state.country === c ? ' active' : '') + '" data-country="' + App.esc(c) + '">' + App.esc(c) + '</button>';
  });
  row.innerHTML = html;
  Array.from(row.children).forEach(function(btn){
    btn.addEventListener('click', function(){
      App.state.country = btn.dataset.country;
      App.renderCountryRow();
      App.renderContent();
    });
  });
};

App.matches = function(e){
  if(App.state.country !== 'all' && (e.country||'').trim() !== App.state.country) return false;
  if(App.state.category !== 'all' && e.category !== App.state.category) return false;
  if(App.state.search){
    var q = App.state.search.toLowerCase();
    var hay = [e.country, e.region, e.title, e.content, e.companions].join(' ').toLowerCase();
    if(hay.indexOf(q) === -1) return false;
  }
  return true;
};

App.renderContent = function(){
  var content = App.dom.content;
  var filtered = App.state.entries.filter(App.matches);

  if(App.state.entries.length === 0){
    content.innerHTML =
      '<div class="empty">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h4"/></svg>' +
        '<h3>版面還是空的</h3>' +
        '<p>投稿第一則日誌，之後每趟旅行都能翻出來看。</p>' +
      '</div>';
    var emptyBtn = document.createElement('button');
    emptyBtn.className = 'btn-add';
    emptyBtn.style.margin = '0 auto';
    emptyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg><span class="btn-label">投稿一則</span>';
    emptyBtn.addEventListener('click', function(){ App.openForm(); });
    content.querySelector('.empty').appendChild(emptyBtn);
    return;
  }

  if(filtered.length === 0){
    content.innerHTML = '<div class="empty"><h3>這個版面還沒有稿子</h3><p>換個國家、分類或關鍵字看看。</p></div>';
    return;
  }

  var pinnedList = filtered.filter(function(e){ return App.truthy(e.pinned); });
  var others = filtered.filter(function(e){ return !App.truthy(e.pinned); });

  var showLead = App.state.country === 'all' && App.state.category === 'all' && !App.state.search;
  var lead = (showLead && others.length) ? others[0] : null;
  var rest = lead ? others.slice(1) : others;

  var html = '';

  if(pinnedList.length){
    html += '<div class="section-head">' + App.PIN_SVG + '釘選的日誌<span class="section-count">' + pinnedList.length + '</span></div>';
    html += '<div class="grid" id="pinnedGrid"></div>';
  }

  if(lead){
    var lc = App.CATS[lead.category] || App.CATS.customs;
    var leadCode = App.countryCode(lead.country);
    html += '<div class="lead" id="leadCard">' +
      '<div class="bar" style="background:' + lc.hex + '"></div>' +
      '<div>' +
        '<div class="lead-top">' +
          '<div class="lead-top-left">' +
            App.pinBtnHtml(lead) +
            '<div class="lead-labels">' +
              '<span class="latest-label">最新日誌</span>' +
              '<span class="lead-kicker" style="background:' + lc.hex + '">' + lc.label + ' ・ ' + App.esc(lead.country) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="card-top-right">' +
            (leadCode ? '<img class="card-flag" src="https://flagcdn.com/96x72/' + leadCode + '.png" srcset="https://flagcdn.com/192x144/' + leadCode + '.png 2x" alt="' + App.esc(lead.country) + '" title="' + App.esc(lead.country) + '" loading="lazy">' : '') +
          '</div>' +
        '</div>' +
        '<h2>' + App.esc(lead.title) + '</h2>' +
        '<p class="meta">' + App.esc(App.metaLine(lead)) + '</p>' +
        '<p class="excerpt">' + App.esc((lead.content||'').slice(0,120)) + '</p>' +
      '</div>' +
    '</div>';
  }

  if(rest.length){
    html += '<div class="grid" id="cardGrid"></div>';
  }
  content.innerHTML = html;

  if(lead){
    document.getElementById('leadCard').addEventListener('click', function(){ App.openDetail(lead.id); });
  }

  if(pinnedList.length){
    var pinnedGrid = document.getElementById('pinnedGrid');
    pinnedList.forEach(function(e){ pinnedGrid.appendChild(App.renderCard(e)); });
  }

  if(rest.length){
    var grid = document.getElementById('cardGrid');
    rest.forEach(function(e){ grid.appendChild(App.renderCard(e)); });
  }

  App.bindPinBtns(content);
};

App.renderCard = function(e){
  var c = App.CATS[e.category] || App.CATS.customs;
  var code = App.countryCode(e.country);
  var card = document.createElement('div');
  card.className = 'card' + (App.truthy(e.pinned) ? ' is-pinned' : '');
  card.style.borderLeftColor = c.hex;
  card.tabIndex = 0;
  card.setAttribute('role','button');
  card.innerHTML =
    '<div class="card-top">' +
      '<div class="card-top-left">' +
        App.pinBtnHtml(e) +
        '<span class="card-kicker" style="background:' + c.hex + '">' + c.label + '</span>' +
      '</div>' +
      '<div class="card-top-right">' +
        (code ? '<img class="card-flag" src="https://flagcdn.com/96x72/' + code + '.png" srcset="https://flagcdn.com/192x144/' + code + '.png 2x" alt="' + App.esc(e.country) + '" title="' + App.esc(e.country) + '" loading="lazy">' : '') +
      '</div>' +
    '</div>' +
    '<p class="country-line">' + App.esc(e.country) + (e.region ? ' ・ ' + App.esc(e.region) : '') + '</p>' +
    '<h3>' + App.esc(e.title) + '</h3>' +
    '<p class="excerpt">' + App.esc(e.content || '（還沒有寫下內容）') + '</p>' +
    '<p class="meta">' + App.esc([App.formatDate(e.date), e.companions ? '與 ' + e.companions : ''].filter(Boolean).join(' ・ ')) + '</p>';
  card.addEventListener('click', function(){ App.openDetail(e.id); });
  card.addEventListener('keydown', function(ev){ if(ev.key === 'Enter') App.openDetail(e.id); });
  return card;
};
