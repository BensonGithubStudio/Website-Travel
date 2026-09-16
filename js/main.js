window.App = window.App || {};

document.getElementById('todayLine').textContent = new Intl.DateTimeFormat('zh-TW', { year:'numeric', month:'long', day:'numeric', weekday:'long' }).format(new Date());

// ---------- SEARCH ----------
document.getElementById('searchInput').addEventListener('input', function(e){
  App.state.search = e.target.value.trim();
  App.renderContent();
});

document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){
    if(App.dom.formOverlay.classList.contains('open')) App.closeForm();
    if(App.dom.detailOverlay.classList.contains('open')) App.closeDetail();
  }
});

App.loadEntries();
