(function () {
  var PASSWORD = 'duckduckmoose';
  var AUTH_KEY = 'dragAndDropGuideAuthorized';

  if (sessionStorage.getItem(AUTH_KEY) === 'true') {
    return;
  }

  document.documentElement.classList.add('auth-locked');

  function buildGate() {
    var gate = document.createElement('div');
    gate.className = 'auth-gate';
    gate.innerHTML = [
      '<form class="auth-card" autocomplete="off">',
      '  <p class="auth-eyebrow">Content Author Guide</p>',
      '  <h1>Drag &amp; Drop Question Types</h1>',
      '  <p class="auth-copy">Enter the guide password to continue.</p>',
      '  <label class="auth-label" for="guide-password">Password</label>',
      '  <input class="auth-input" id="guide-password" type="password" autofocus />',
      '  <p class="auth-error" role="alert" aria-live="polite"></p>',
      '  <button class="auth-button" type="submit">Open guide</button>',
      '</form>'
    ].join('');

    document.body.appendChild(gate);

    var form = gate.querySelector('form');
    var input = gate.querySelector('input');
    var error = gate.querySelector('.auth-error');

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      if (input.value === PASSWORD) {
        sessionStorage.setItem(AUTH_KEY, 'true');
        document.documentElement.classList.remove('auth-locked');
        gate.remove();
        return;
      }

      error.textContent = 'Incorrect password. Please try again.';
      input.value = '';
      input.focus();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildGate);
  } else {
    buildGate();
  }
}());
