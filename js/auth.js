/* ============================================================
 * auth.js — 管理員登入 / 權限守門
 *
 * 這支檔案不需要修改 api.js：它會攔截頁面上所有的 fetch()，
 * 只要目標網址等於後端 API 網址，就自動把登入 token 加進去
 * （GET 加在網址參數，POST 加進 JSON body）。
 *
 * 若偵測不到後端網址，請到 config.js 最後加一行（把右邊換成
 * 你原本存放網址的變數名稱）：
 *     window.API_URL = 你的網址變數;
 * ============================================================ */
(function () {
  'use strict';

  var TOKEN_KEY = 'travelLog_authToken';
  var EXPIRES_KEY = 'travelLog_authExpires';
  var USERNAME_KEY = 'travelLog_authUsername';

  function getToken() {
    var token = localStorage.getItem(TOKEN_KEY);
    var expires = localStorage.getItem(EXPIRES_KEY);
    if (!token) return null;
    if (expires && new Date(expires).getTime() < Date.now()) {
      clearSession();
      return null;
    }
    return token;
  }

  function saveSession(token, username, expiresAt) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USERNAME_KEY, username || '');
    if (expiresAt) localStorage.setItem(EXPIRES_KEY, expiresAt);
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    localStorage.removeItem(USERNAME_KEY);
  }

  // 後端網址就是 api.js 裡設定的 App.API_URL
  function getApiUrl() {
    return (window.App && window.App.API_URL) ||
      window.API_URL || window.GAS_URL || window.SCRIPT_URL ||
      (window.CONFIG && (window.CONFIG.API_URL || window.CONFIG.GAS_URL));
  }

  /* -------- 攔截 fetch，自動附加 token；收到 authRequired 就強制回登入畫面 -------- */
  var originalFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var apiUrl = getApiUrl();
    var url = typeof input === 'string' ? input : (input && input.url);
    var isOwnApi = !!(apiUrl && url && url.indexOf(apiUrl) === 0);
    var token = getToken();

    if (isOwnApi && token) {
      init = init || {};
      var method = (init.method || 'GET').toUpperCase();

      if (method === 'GET') {
        var sep = url.indexOf('?') === -1 ? '?' : '&';
        input = url + sep + 'token=' + encodeURIComponent(token);
      } else if (init.body) {
        try {
          var payload = JSON.parse(init.body);
          payload.token = token;
          init = Object.assign({}, init, { body: JSON.stringify(payload) });
        } catch (e) {
          // body 不是 JSON 就不動它
        }
      }
    }

    return originalFetch(input, init).then(function (response) {
      if (isOwnApi) {
        response.clone().json().then(function (data) {
          if (data && data.authRequired) {
            clearSession();
            showLoginGate('登入已過期，請重新登入');
          }
        }).catch(function () {});
      }
      return response;
    });
  };

  /* -------- 登入畫面顯示 / 隱藏 -------- */
  function showLoginGate(message) {
    var overlay = document.getElementById('loginOverlay');
    if (!overlay) return;
    overlay.classList.add('open');
    document.body.classList.add('auth-locked');
    var errBox = document.getElementById('loginError');
    if (message && errBox) {
      errBox.textContent = message;
      errBox.style.display = 'block';
    }
  }

  function hideLoginGate() {
    var overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.classList.remove('open');
    document.body.classList.remove('auth-locked');
    var btnLogout = document.getElementById('btnLogout');
    if (btnLogout) btnLogout.style.display = '';
  }

  // 防止頁面其他地方（例如點背景關閉彈窗的共用邏輯）誤把登入畫面關掉：
  // 只要還沒登入，偵測到 open class 被移除就立刻加回去。
  function guardOverlay() {
    var overlay = document.getElementById('loginOverlay');
    if (!overlay || typeof MutationObserver === 'undefined') return;
    var observer = new MutationObserver(function () {
      if (!getToken() && !overlay.classList.contains('open')) {
        overlay.classList.add('open');
      }
    });
    observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });
  }

  function initLoginForm() {
    var form = document.getElementById('loginForm');
    if (!form) return;
    form.addEventListener('submit', function (evt) {
      evt.preventDefault();
      var apiUrl = getApiUrl();
      var errBox = document.getElementById('loginError');
      if (!apiUrl) {
        errBox.textContent = '找不到後端網址，請確認 config.js 有設定 API_URL';
        errBox.style.display = 'block';
        return;
      }
      var username = document.getElementById('lUsername').value.trim();
      var password = document.getElementById('lPassword').value;
      var btn = document.getElementById('btnLoginSubmit');
      errBox.style.display = 'none';
      btn.disabled = true;
      btn.textContent = '登入中…';

      originalFetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'login', username: username, password: password })
      }).then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.ok) {
            saveSession(data.token, data.username, data.expiresAt);
            location.reload();
          } else {
            errBox.textContent = data.error || '登入失敗，請確認帳號密碼';
            errBox.style.display = 'block';
            btn.disabled = false;
            btn.textContent = '登入';
          }
        })
        .catch(function (err) {
          errBox.textContent = '連線失敗：' + err.message;
          errBox.style.display = 'block';
          btn.disabled = false;
          btn.textContent = '登入';
        });
    });
  }

  function initLogoutButton() {
    var btn = document.getElementById('btnLogout');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var apiUrl = getApiUrl();
      var token = getToken();
      clearSession();
      if (apiUrl && token) {
        originalFetch(apiUrl, {
          method: 'POST',
          body: JSON.stringify({ action: 'logout', token: token })
        }).catch(function () {});
      }
      location.reload();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initLoginForm();
    initLogoutButton();
    guardOverlay();
    if (getToken()) {
      hideLoginGate();
    } else {
      showLoginGate();
    }
  });
})();
