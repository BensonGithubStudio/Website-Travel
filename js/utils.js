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
