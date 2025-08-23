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

// Waitlist simulated submission
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('waitlist-form');
  if (!form) return;
  const emailInput = form.querySelector('#email');
  const button = form.querySelector('#waitlist-button');
  const buttonText = button?.querySelector('.btn-text');
  const successEl = form.querySelector('#waitlist-success');
  let loading = false;

  const resetState = () => {
    loading = false;
    if (button) {
      button.disabled = false;
      button.classList.remove('is-loading');
      if (buttonText) buttonText.textContent = 'Join The Waitlist';
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (loading) return;
    if (!emailInput.value.trim()) {
      emailInput.focus();
      return;
    }
    loading = true;
    if (successEl) {
      successEl.textContent = '';
      successEl.classList.remove('visible');
    }
    if (button) {
      button.disabled = true;
      button.classList.add('is-loading');
      if (buttonText) buttonText.textContent = 'Joining...';
    }
    setTimeout(() => {
      // Simulated success -> open modal
      openWaitlistModal();
      resetState();
      form.reset();
    }, 2000);
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

