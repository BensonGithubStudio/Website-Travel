window.App = window.App || {};

App.uid = function(){
  if(window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2,9);
};

App.esc = function(s){
  var d = document.createElement('div');
  d.textContent = s == null ? '' : s;
  return d.innerHTML;
};

App.showToast = function(msg){
  var toastEl = App.dom.toastEl;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(function(){ toastEl.classList.remove('show'); }, 2200);
};

App.formatDate = function(d){
  if(!d) return '';
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  if(!m) return d; // 舊資料若不是標準格式，原樣顯示
  return m[1] + '年' + parseInt(m[2],10) + '月' + parseInt(m[3],10) + '日';
};

App.metaLine = function(e){
  var parts = [];
  if(e.region) parts.push(e.region);
  if(e.date) parts.push(App.formatDate(e.date));
  if(e.companions) parts.push('與 ' + e.companions);
  return parts.join(' ・ ');
};

App.todayStr = function(){
  var d = new Date();
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var dd = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + mm + '-' + dd;
};

// 把後端回傳的日期值收斂成 <input type="date"> 能接受的 yyyy-MM-dd。
// 正常情況下 doGet 已經處理好；這裡是前端的防呆，避免舊版後端或未重新部署時整個表單壞掉。
App.toDateInputValue = function(v){
  if(!v) return '';
  var s = String(v).trim();
  if(!s) return '';
  var plain = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if(plain) return s;
  var d = new Date(s);
  if(isNaN(d.getTime())) return '';
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var dd = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + mm + '-' + dd;
};

// 後端 pinned 欄位可能是 true / 1 / '1' / 'TRUE' / 空白，統一轉成布林值
App.truthy = function(v){
  if(v === true) return true;
  var s = String(v == null ? '' : v).trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'y';
};

// ---------- 網址偵測（自動連結 / 相關連結卡片） ----------
App.URL_REGEX = /https?:\/\/[^\s<>"']+/g;

// 去掉網址結尾常見的標點（句子裡網址後面接的句號、逗號、括號等，不該算進網址本身）
App.stripTrailingPunct = function(url){
  return url.replace(/[)\]}>,.;:!?"'，。！？」』、]+$/, '');
};

// 傳入「已經過 App.esc 跳脫」的文字，把裡面的網址轉成可點擊的 <a> 連結
// 因為文字已跳脫，網址本身不會含有 <、>、" 等字元，可以安全地用正則比對與替換
App.linkify = function(escapedText){
  if(!escapedText) return escapedText;
  return escapedText.replace(App.URL_REGEX, function(raw){
    var url = App.stripTrailingPunct(raw);
    var trail = raw.slice(url.length); // 被截掉的結尾標點，要留在連結外面
    return '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="content-link">' + url + '</a>' + trail;
  });
};

// 傳入「已跳脫」的文字，把裡面的網址「加上連結樣式」但不做成可點擊的 <a>
// 用在列表頁（卡片／頭條）的摘要：讓使用者看得出裡面有連結，但要點進完整內容頁才能真的瀏覽
App.linkifyPreview = function(escapedText){
  if(!escapedText) return escapedText;
  return escapedText.replace(App.URL_REGEX, function(raw){
    var url = App.stripTrailingPunct(raw);
    var trail = raw.slice(url.length);
    return '<span class="content-link-preview">' + url + '</span>' + trail;
  });
};

// 從原始（未跳脫）文字中取出所有網址，並整理成 { url, domain } 的清單，用來顯示「相關連結」卡片
App.extractLinks = function(text){
  if(!text) return [];
  var matches = text.match(App.URL_REGEX) || [];
  var seen = {};
  var result = [];
  matches.forEach(function(raw){
    var url = App.stripTrailingPunct(raw);
    if(!url || seen[url]) return;
    seen[url] = true;
    var domain = url;
    try{ domain = new URL(url).hostname.replace(/^www\./, ''); }catch(e){}
    result.push({ url: url, domain: domain });
  });
  return result;
};

// 動作進行中把按鈕全部鎖住，避免重複送出；回傳解鎖函式
App.lockButtons = function(root){
  var scope = root || document.body;
  var btns = Array.prototype.slice.call(scope.querySelectorAll('button'));
  var prev = btns.map(function(b){ return b.disabled; });
  btns.forEach(function(b){ b.disabled = true; });
  return function(){
    btns.forEach(function(b, i){
      if(b.isConnected !== false) b.disabled = prev[i];
    });
  };
};
