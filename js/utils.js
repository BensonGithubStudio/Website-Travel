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
