window.App = window.App || {};

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
    emptyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg> 投稿一則';
    emptyBtn.addEventListener('click', function(){ App.openForm(); });
    content.querySelector('.empty').appendChild(emptyBtn);
    return;
  }

  if(filtered.length === 0){
    content.innerHTML = '<div class="empty"><h3>這個版面還沒有稿子</h3><p>換個國家、分類或關鍵字看看。</p></div>';
    return;
  }

  var showLead = App.state.country === 'all' && App.state.category === 'all' && !App.state.search;
  var lead = showLead ? filtered[0] : null;
  var rest = lead ? filtered.slice(1) : filtered;

  var html = '';
  if(lead){
    var lc = App.CATS[lead.category] || App.CATS.customs;
    var leadCode = App.countryCode(lead.country);
    html += '<div class="lead" id="leadCard">' +
      '<div class="bar" style="background:' + lc.hex + '"></div>' +
      '<div>' +
        '<div class="lead-top">' +
          '<div>' +
            '<span class="latest-label">最新日誌</span>' +
            '<span class="lead-kicker" style="background:' + lc.hex + '">' + lc.label + ' ・ ' + App.esc(lead.country) + '</span>' +
          '</div>' +
          (leadCode ? '<img class="card-flag" src="https://flagcdn.com/96x72/' + leadCode + '.png" srcset="https://flagcdn.com/192x144/' + leadCode + '.png 2x" alt="' + App.esc(lead.country) + '" title="' + App.esc(lead.country) + '" loading="lazy">' : '') +
        '</div>' +
        '<h2>' + App.esc(lead.title) + '</h2>' +
        '<p class="meta">' + App.esc(App.metaLine(lead)) + '</p>' +
        '<p class="excerpt">' + App.esc((lead.content||'').slice(0,120)) + '</p>' +
      '</div>' +
    '</div>';
  }

  html += '<div class="grid" id="cardGrid"></div>';
  content.innerHTML = html;

  if(lead){
    document.getElementById('leadCard').addEventListener('click', function(){ App.openDetail(lead.id); });
  }

  var grid = document.getElementById('cardGrid');
  rest.forEach(function(e){
    grid.appendChild(App.renderCard(e));
  });
};

App.renderCard = function(e){
  var c = App.CATS[e.category] || App.CATS.customs;
  var code = App.countryCode(e.country);
  var card = document.createElement('div');
  card.className = 'card';
  card.style.borderLeftColor = c.hex;
  card.tabIndex = 0;
  card.setAttribute('role','button');
  card.innerHTML =
    '<div class="card-top">' +
      '<span class="card-kicker" style="background:' + c.hex + '">' + c.label + '</span>' +
      (code ? '<img class="card-flag" src="https://flagcdn.com/96x72/' + code + '.png" srcset="https://flagcdn.com/192x144/' + code + '.png 2x" alt="' + App.esc(e.country) + '" title="' + App.esc(e.country) + '" loading="lazy">' : '') +
    '</div>' +
    '<p class="country-line">' + App.esc(e.country) + (e.region ? ' ・ ' + App.esc(e.region) : '') + '</p>' +
    '<h3>' + App.esc(e.title) + '</h3>' +
    '<p class="excerpt">' + App.esc(e.content || '（還沒有寫下內容）') + '</p>' +
    '<p class="meta">' + App.esc([App.formatDate(e.date), e.companions ? '與 ' + e.companions : ''].filter(Boolean).join(' ・ ')) + '</p>';
  card.addEventListener('click', function(){ App.openDetail(e.id); });
  card.addEventListener('keydown', function(ev){ if(ev.key === 'Enter') App.openDetail(e.id); });
  return card;
};
