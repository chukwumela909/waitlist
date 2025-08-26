// Light switcher
const lightSwitches = document.querySelectorAll('.light-switch');
if (lightSwitches.length > 0) {
  lightSwitches.forEach((lightSwitch, i) => {
    if (localStorage.getItem('dark-mode') === 'true') {
      // eslint-disable-next-line no-param-reassign
      lightSwitch.checked = true;
    }
    lightSwitch.addEventListener('change', () => {
      const { checked } = lightSwitch;
      lightSwitches.forEach((el, n) => {
        if (n !== i) {
          // eslint-disable-next-line no-param-reassign
          el.checked = checked;
        }
      });
      document.documentElement.classList.add('[&_*]:!transition-none');
      if (lightSwitch.checked) {
        document.documentElement.classList.add('dark');
        document.querySelector('html').style.colorScheme = 'dark';
        localStorage.setItem('dark-mode', true);
        document.dispatchEvent(new CustomEvent('darkMode', { detail: { mode: 'on' } }));
      } else {
        document.documentElement.classList.remove('dark');
        document.querySelector('html').style.colorScheme = 'light';
        localStorage.setItem('dark-mode', false);
        document.dispatchEvent(new CustomEvent('darkMode', { detail: { mode: 'off' } }));
      }
      setTimeout(() => {
        document.documentElement.classList.remove('[&_*]:!transition-none');
      }, 1);
    });
  });
}

// Waitlist real submission integration
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('waitlist-form');
  if (!form) return;
  const emailInput = form.querySelector('#email');
  const button = form.querySelector('#waitlist-button');
  const buttonText = button?.querySelector('.btn-text');
  const successEl = form.querySelector('#waitlist-success');
  const errorEl = form.querySelector('#waitlist-error');
  let loading = false;
  const API_BASE = 'https://waitlist-api-qiep.onrender.com';

  const setLoading = (state) => {
    loading = state;
    if (!button) return;
    button.disabled = state;
    button.classList.toggle('is-loading', state);
    if (buttonText) buttonText.textContent = state ? 'Joining...' : 'Join The Waitlist';
  };
  const clearMessages = () => {
    if (successEl) { successEl.textContent = ''; successEl.classList.remove('visible'); }
    if (errorEl) { errorEl.textContent = ''; errorEl.hidden = true; }
  };

  async function joinWaitlist(email) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    try {
      const res = await fetch(`${API_BASE}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      });
      let data = {};
      try { data = await res.json(); } catch (_) { /* ignore parse */ }
      if (res.ok && data.success) {
        return { ok: true, message: data.message || 'Successfully joined.' };
      }
      // Handle known error shapes including rate limit
      const msg = data.error || data.message || 'Something went wrong. Please try again later.';
      return { ok: false, status: res.status, message: msg };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { ok: false, status: 0, message: 'Request timed out. Check your connection and try again.' };
      }
      return { ok: false, status: 0, message: 'Network error. Please check connection.' };
    } finally {
      clearTimeout(timeout);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (loading) return;
    clearMessages();
    const email = emailInput.value.trim();
    if (!email) { emailInput.focus(); return; }
    // Basic email format check before hitting API
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (errorEl) { errorEl.textContent = 'Enter a valid email address.'; errorEl.hidden = false; }
      emailInput.focus();
      return;
    }
    setLoading(true);
    const result = await joinWaitlist(email);
    setLoading(false);
    if (result.ok) {
      if (successEl) { successEl.textContent = result.message; successEl.classList.add('visible'); }
      // Prepare modal variant
      const modal = document.getElementById('waitlist-modal');
      if (modal) {
        const body = modal.querySelector('#waitlist-modal-body');
        modal.removeAttribute('data-variant');
        if (/delayed/i.test(result.message) && !/check your email/i.test(result.message)) {
          modal.setAttribute('data-variant', 'delayed');
        }
        if (body) body.textContent = result.message;
        openWaitlistModal();
      }
      form.reset();
    } else {
      if (errorEl) { errorEl.textContent = result.message; errorEl.hidden = false; }
      if (result.status === 429) {
        // Optional: simple backoff visual cue
        button?.classList.add('rate-limited');
        setTimeout(() => button?.classList.remove('rate-limited'), 5000);
      }
    }
  });
});

// Modal logic
function openWaitlistModal() {
  const modal = document.getElementById('waitlist-modal');
  if (!modal) return;
  modal.hidden = false;
  const dialog = modal.querySelector('.th-modal__dialog');
  const focusable = modal.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const previousActive = document.activeElement;
  modal.dataset.prevFocus = previousActive && previousActive.id ? previousActive.id : '';
  requestAnimationFrame(() => { dialog?.focus(); });

  function trap(e) {
    if (e.key === 'Escape') { closeModal(); }
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  function closeModal() {
    modal.hidden = true;
    document.removeEventListener('keydown', trap);
    const prevId = modal.dataset.prevFocus;
    if (prevId) { document.getElementById(prevId)?.focus(); }
  }
  modal.addEventListener('click', (e) => { if (e.target.closest('[data-close-modal]')) closeModal(); });
  document.addEventListener('keydown', trap);
}

