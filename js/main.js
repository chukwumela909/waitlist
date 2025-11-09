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
  
  // Form fields
  const fullNameInput = form.querySelector('#fullName');
  const emailInput = form.querySelector('#email');
  const phoneInput = form.querySelector('#phoneNumber');
  const primarySkillSelect = form.querySelector('#primarySkill');
  const otherServiceInput = form.querySelector('#otherService');
  const otherServiceWrap = form.querySelector('#otherServiceWrap');
  const cityInput = form.querySelector('#city');
  const stateSelect = form.querySelector('#state');
  const experienceSelect = form.querySelector('#yearsOfExperience');
  const portfolioInput = form.querySelector('#portfolioLink');
  const notifyCheckbox = form.querySelector('#notifyEarlyAccess');
  const termsCheckbox = form.querySelector('#agreedToTerms');
  
  const button = form.querySelector('#waitlist-button');
  const buttonText = button?.querySelector('.btn-text');
  const errorEl = form.querySelector('#waitlist-error');
  let loading = false;
  
  // Prefer global override (set in page) else fallback
  const API_BASE = window.WAITLIST_API_BASE || 'https://waitlist-api-qiep.onrender.com';

  // Show/hide otherService field based on primarySkill selection
  if (primarySkillSelect && otherServiceWrap) {
    primarySkillSelect.addEventListener('change', () => {
      if (primarySkillSelect.value === 'Other') {
        otherServiceWrap.style.display = 'block';
        if (otherServiceInput) otherServiceInput.required = true;
      } else {
        otherServiceWrap.style.display = 'none';
        if (otherServiceInput) {
          otherServiceInput.required = false;
          otherServiceInput.value = '';
        }
      }
    });
  }

  const setLoading = (state) => {
    loading = state;
    if (!button) return;
    button.disabled = state;
    button.classList.toggle('is-loading', state);
    if (buttonText) buttonText.textContent = state ? 'Joining...' : 'Join the Waitlist';
  };
  
  const clearMessages = () => {
    if (errorEl) { errorEl.textContent = ''; errorEl.hidden = true; }
  };

  async function joinWaitlist(data) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout for larger payload
    try {
      const res = await fetch(`${API_BASE}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      let responseData = {};
      try { responseData = await res.json(); } catch (_) { /* ignore parse */ }
      if (res.ok && responseData.success) {
        return { ok: true, message: responseData.message || 'Successfully joined the waitlist!' };
      }
      // Handle validation errors with details
      if (responseData.details && Array.isArray(responseData.details)) {
        const errors = responseData.details.map(d => d.message).join(', ');
        return { ok: false, status: res.status, message: errors };
      }
      // Handle known error shapes including rate limit
      const msg = responseData.error || responseData.message || 'Something went wrong. Please try again later.';
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
    
    // Client-side validation (HTML5 handles required, but add extra checks)
    const fullName = fullNameInput?.value.trim() || '';
    const email = emailInput?.value.trim() || '';
    const phone = phoneInput?.value.trim() || '';
    const primarySkill = primarySkillSelect?.value || '';
    const otherService = otherServiceInput?.value.trim() || '';
    const city = cityInput?.value.trim() || '';
    const state = stateSelect?.value || '';
    const experience = experienceSelect?.value || '';
    const portfolio = portfolioInput?.value.trim() || '';
    const notifyEarly = notifyCheckbox?.checked ?? true;
    const agreedTerms = termsCheckbox?.checked ?? false;

    // Extra validation
    if (!agreedTerms) {
      if (errorEl) { errorEl.textContent = 'You must agree to the Terms & Privacy Policy.'; errorEl.hidden = false; }
      termsCheckbox?.focus();
      return;
    }
    if (primarySkill === 'Other' && !otherService) {
      if (errorEl) { errorEl.textContent = 'Please specify your service when selecting "Other".'; errorEl.hidden = false; }
      otherServiceInput?.focus();
      return;
    }

    // Build payload matching API spec
    const payload = {
      fullName,
      email,
      phoneNumber: phone,
      primarySkill,
      city,
      state,
      yearsOfExperience: experience,
      notifyEarlyAccess: notifyEarly,
      agreedToTerms: agreedTerms
    };
    
    if (primarySkill === 'Other' && otherService) {
      payload.otherService = otherService;
    }
    if (portfolio) {
      payload.portfolioLink = portfolio;
    }

    setLoading(true);
    const result = await joinWaitlist(payload);
    setLoading(false);
    
    if (result.ok) {
      // Show success modal
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
      // Re-hide otherService field after reset
      if (otherServiceWrap) otherServiceWrap.style.display = 'none';
    } else {
      if (errorEl) { errorEl.textContent = result.message; errorEl.hidden = false; }
      if (result.status === 429) {
        // Optional: simple backoff visual cue
        button?.classList.add('rate-limited');
        setTimeout(() => button?.classList.remove('rate-limited'), 5000);
      }
      // Scroll error into view
      errorEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

