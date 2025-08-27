// Admin page logic for TaskHub waitlist
// Assumptions: backend provides list endpoint at GET /api/waitlist (array) and stats at /api/waitlist/stats
// If list endpoint differs, adjust LIST_PATH below.

(function(){
  const API_BASE = 'https://waitlist-api-qiep.onrender.com';
  const STATS_PATH = '/api/waitlist/stats'; // returns { success, stats: { total, confirmed, unconfirmed, users: [...] } }

  const tbody = document.getElementById('waitlist-body');
  const errorMsg = document.getElementById('entries-error');
  const filterInput = document.getElementById('filter');
  const refreshBtn = document.getElementById('refresh');
  const autoBtn = document.getElementById('autoToggle');

  const statTotal = document.getElementById('stat-total');
  const statConfirmed = document.getElementById('stat-confirmed');
  const statUnconfirmed = document.getElementById('stat-unconfirmed');
  const statUpdated = document.getElementById('stat-updated');

  let cache = [];
  let polling = true;
  let pollTimer = null;

  function setBusy(state){
    const scroller = document.querySelector('.table-scroller');
    if(scroller){ scroller.setAttribute('aria-busy', state ? 'true' : 'false'); }
  }

  function formatDate(iso){
    if(!iso) return '—';
    try { const d = new Date(iso); return d.toLocaleString(undefined,{hour12:false}); } catch { return iso; }
  }

  async function fetchJSON(path){
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(),10000);
    try{
      const res = await fetch(API_BASE + path, { signal: controller.signal });
      let data = {};
      try{ data = await res.json(); }catch(_){ }
      if(!res.ok){ throw new Error(data.error || data.message || res.statusText); }
      return data;
    }catch(err){
      throw err;
    }finally{ clearTimeout(timeout); }
  }

  function renderTable(){
    const term = filterInput.value.trim().toLowerCase();
    const rows = [];
    const list = term ? cache.filter(r => r.email.toLowerCase().includes(term)) : cache;
    if(list.length === 0){
      rows.push('<tr><td colspan="4" class="empty">'+ (term? 'No matches found.' : 'No entries yet.') +'</td></tr>');
    } else {
      for(const item of list){
        const statusClass = item.confirmed ? 'status-pill status-confirmed' : 'status-pill status-unconfirmed';
        rows.push('<tr>'+
          '<td>'+ escapeHtml(item.email) +'</td>'+
          '<td><span class="'+statusClass+'">'+ (item.confirmed? 'Confirmed':'Unconfirmed') +'</span></td>'+
          '<td class="mono">'+ formatDate(item.createdAt || item.created_at) +'</td>'+
        //   '<td class="mono muted">'+ (item.id || '—') +'</td>'+
        '</tr>');
      }
    }
    tbody.innerHTML = rows.join('');
  }

  function escapeHtml(str){
    return str.replace(/[&<>"]+/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  }

  async function loadStatsAndUsers({silent}={}){
    if(!silent){ setBusy(true); }
    errorMsg.hidden = true; errorMsg.textContent='';
    try {
      const data = await fetchJSON(STATS_PATH);
      if(!(data && data.success && data.stats)) throw new Error(data.error || 'Malformed stats response');
      const { stats } = data;
      statTotal.textContent = stats.total ?? '0';
      statConfirmed.textContent = stats.confirmed ?? '0';
      statUnconfirmed.textContent = stats.unconfirmed ?? '0';
      statUpdated.textContent = new Date().toLocaleTimeString(undefined,{hour12:false});
      cache = Array.isArray(stats.users) ? stats.users.map(u => ({
        id: u._id || u.id,
        email: u.email,
        confirmed: !!u.confirmed,
        createdAt: u.joinedAt || u.createdAt || u.created_at
      })) : [];
      renderTable();
    } catch(err){
      if(!silent){ tbody.innerHTML = '<tr><td colspan="4" class="empty">Failed to load entries.</td></tr>'; }
      errorMsg.textContent = err.message || 'Failed to load data';
      errorMsg.hidden = false;
      statUpdated.textContent = 'Err';
    } finally {
      if(!silent){ setBusy(false); }
    }
  }

  function startPolling(){
    stopPolling();
    pollTimer = setInterval(()=>{ loadList({silent:true}); loadStats(); }, 30000); // 30s
  }
  function stopPolling(){ if(pollTimer){ clearInterval(pollTimer); pollTimer=null; } }

  filterInput.addEventListener('input', ()=> renderTable());
  refreshBtn.addEventListener('click', ()=>{ loadStatsAndUsers(); });
  autoBtn.addEventListener('click', ()=>{
    polling = !polling;
    if(polling){ startPolling(); autoBtn.dataset.enabled='true'; autoBtn.textContent='Auto: On'; }
    else { stopPolling(); autoBtn.dataset.enabled='false'; autoBtn.textContent='Auto: Off'; }
  });

  // Initial load
  loadStatsAndUsers();
  // Reuse polling to refresh combined data
  stopPolling();
  pollTimer = setInterval(()=>{ loadStatsAndUsers({silent:true}); }, 30000);
})();
