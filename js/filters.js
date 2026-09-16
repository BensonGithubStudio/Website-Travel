window.App = window.App || {};

(function(){
  // ---------- BUILD STATIC UI (category chips / toggle) ----------
  var catChipsEl = document.getElementById('catChips');
  var allChip = document.createElement('button');
  allChip.className = 'cat-chip active';
  allChip.textContent = '全部類別';
  allChip.dataset.cat = 'all';
  allChip.style.background = 'var(--ink)';
  allChip.style.color = '#fff';
  catChipsEl.appendChild(allChip);
  App.CAT_ORDER.forEach(function(key){
    var c = App.CATS[key];
    var chip = document.createElement('button');
    chip.className = 'cat-chip';
    chip.dataset.cat = key;
    chip.innerHTML = '<span class="dot" style="background:' + c.hex + '"></span>' + c.label;
    catChipsEl.appendChild(chip);
  });
  catChipsEl.addEventListener('click', function(e){
    var btn = e.target.closest('.cat-chip');
    if(!btn) return;
    App.state.category = btn.dataset.cat;
    Array.from(catChipsEl.children).forEach(function(c){
      var isActive = c === btn;
      c.classList.toggle('active', isActive);
      c.style.background = isActive && btn.dataset.cat !== 'all' ? App.CATS[btn.dataset.cat].hex : (isActive ? 'var(--ink)' : '');
      c.style.color = isActive ? '#fff' : '';
    });
    App.renderContent();
  });

  var catToggleEl = document.getElementById('catToggle');
  App.CAT_ORDER.forEach(function(key){
    var c = App.CATS[key];
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = c.label;
    btn.dataset.cat = key;
    btn.addEventListener('click', function(){ App.setFormCategory(key); });
    catToggleEl.appendChild(btn);
  });

  App.setFormCategory = function(key){
    App.state.formCategory = key;
    Array.from(catToggleEl.children).forEach(function(btn){
      var active = btn.dataset.cat === key;
      btn.classList.toggle('is-active', active);
      btn.style.background = active ? App.CATS[key].hex : '#fff';
      btn.style.borderColor = active ? App.CATS[key].hex : '';
    });
  };
  App.setFormCategory('customs');
})();
