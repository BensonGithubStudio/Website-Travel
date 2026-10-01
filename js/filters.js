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
    btn.addEventListener('click', function(){ App.toggleFormCategory(key); });
    catToggleEl.appendChild(btn);
  });

  App.setFormCategories = function(list){
    var picked = App.parseCats(list);
    App.state.formCategories = picked;
    Array.from(catToggleEl.children).forEach(function(btn){
      var active = picked.indexOf(btn.dataset.cat) !== -1;
      var hex = App.CATS[btn.dataset.cat].hex;
      btn.classList.toggle('is-active', active);
      btn.style.background = active ? hex : '#fff';
      btn.style.borderColor = active ? hex : '';
    });
  };

  App.toggleFormCategory = function(key){
    var cur = (App.state.formCategories || []).slice();
    var i = cur.indexOf(key);
    if(i !== -1){
      if(cur.length === 1) return; // 至少保留一個
      cur.splice(i, 1);
    } else {
      cur.push(key);
    }
    App.setFormCategories(cur);
  };

  App.setFormCategories(['customs']);
})();
