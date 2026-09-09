/* ═══════════════════════════════════════════════════
   editor.js — লাইভ এডিট প্যানেল
   লগইন → Ctrl+E এডিট মোড → Ctrl+S সেভ → Esc বন্ধ
   ডেটা থাকে Supabase-এ; সংযোগ না থাকলে সাইট তবুও চলে
   ═══════════════════════════════════════════════════ */
(function(){
"use strict";

/* ---------- Supabase ক্লায়েন্ট ---------- */
var SB = null;
try {
  if (typeof window.supabase !== 'undefined' && typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL){
    SB = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch(e){}
window.ShifatSB = SB;

var E = window.ShifatEditor = {
  on:false, loggedIn:false, dirty:{}, posts:[], editingSlug:null, onChange:null
};

/* ---------- টোস্ট ---------- */
function toastE(msg){
  var wrap = document.getElementById('toastWrap');
  if (!wrap){ alert(msg); return; }
  var t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  wrap.appendChild(t);
  requestAnimationFrame(function(){ t.classList.add('show'); });
  setTimeout(function(){ t.classList.remove('show'); setTimeout(function(){ t.remove(); }, 400); }, 3200);
}

/* ---------- এডিটর CSS ---------- */
var st = document.createElement('style');
st.textContent = [
'.ed-lock{position:fixed;right:1.1rem;bottom:1.1rem;z-index:3400;width:40px;height:40px;border-radius:50%;border:1px solid rgba(226,180,90,.5);background:rgba(21,20,18,.78);color:#E2B45A;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:.4;transition:.3s;backdrop-filter:blur(6px)}',
'.ed-lock:hover{opacity:1}',
'body.ed-authed .ed-lock{opacity:.95;border-color:#E2B45A}',
'.ed-bar{position:fixed;right:1.1rem;bottom:1.1rem;z-index:3450;display:none;flex-direction:column;gap:.5rem;background:rgba(21,20,18,.96);border:1px solid #E2B45A;border-radius:10px;padding:.9rem;min-width:215px;box-shadow:0 14px 40px rgba(0,0,0,.45);backdrop-filter:blur(8px)}',
'body.ed-on .ed-bar{display:flex}',
'body.ed-on .ed-lock{display:none}',
'.ed-bar .t{font-family:"Roboto Mono",monospace;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:#E2B45A}',
'.ed-btn{font-family:"Poppins",sans-serif;font-weight:500;font-size:.85rem;border:1px solid rgba(241,238,230,.2);background:none;color:#F1EEE6;border-radius:6px;padding:.5rem .8rem;cursor:pointer;text-align:left;transition:.25s}',
'.ed-btn:hover{border-color:#E2B45A;color:#E2B45A}',
'.ed-btn.primary{background:#E2B45A;border-color:#E2B45A;color:#221A08}',
'.ed-btn.primary:hover{filter:brightness(1.08);color:#221A08}',
'.ed-hint{font-size:.7rem;color:rgba(241,238,230,.5);font-family:"Roboto Mono",monospace}',
'body.ed-on [data-skey]{outline:2px dashed rgba(226,180,90,.65);outline-offset:5px;border-radius:3px;cursor:text;transition:background .2s}',
'body.ed-on [data-skey]:hover{background:rgba(226,180,90,.12)}',
'body.ed-on [data-skey]:focus{outline-style:solid;background:rgba(226,180,90,.1)}',
'.post{position:relative}',
'.pebtns{position:absolute;top:.5rem;right:.5rem;display:none;gap:.35rem;z-index:3}',
'body.ed-on .pebtns{display:flex}',
'.pebtn{width:32px;height:32px;border-radius:6px;border:1px solid rgba(241,238,230,.35);background:rgba(12,11,9,.72);color:#F1EEE6;display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(4px);transition:.25s;padding:0}',
'.pebtn:hover{background:#E2B45A;color:#221A08;border-color:#E2B45A}',
'.ed-ov{position:fixed;inset:0;z-index:3600;background:rgba(10,9,7,.82);backdrop-filter:blur(5px);display:none;align-items:center;justify-content:center;padding:1.2rem}',
'.ed-ov.open{display:flex}',
'.ed-panel{width:min(680px,94vw);max-height:88vh;overflow-y:auto;background:#1D1B18;border:1px solid rgba(226,180,90,.4);border-radius:10px;padding:1.6rem;color:#F1EEE6}',
'.ed-panel h3{font-family:"Poppins",sans-serif;font-weight:600;margin:0 0 1rem;font-size:1.15rem}',
'.ed-panel label{display:block;font-family:"Poppins",sans-serif;font-weight:500;font-size:.8rem;color:rgba(241,238,230,.6);margin:.9rem 0 .35rem}',
'.ed-panel input,.ed-panel textarea{width:100%;background:rgba(241,238,230,.05);border:1px solid rgba(241,238,230,.18);border-radius:6px;padding:.65rem .8rem;color:#F1EEE6;font-family:inherit;font-size:.98rem}',
'.ed-panel textarea{min-height:220px;resize:vertical;font-family:"Noto Serif Bengali",serif;line-height:1.9}',
'.ed-panel input:focus,.ed-panel textarea:focus{outline:none;border-color:#E2B45A}',
'.ed-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}',
'.ed-acts{display:flex;gap:.7rem;margin-top:1.4rem;flex-wrap:wrap;align-items:center}',
'.ed-acts .sp{flex:1}',
'@media(max-width:560px){.ed-row{grid-template-columns:1fr}}'
].join('\n');
document.head.appendChild(st);

/* ---------- UI ইনজেক্ট ---------- */
function injectUI(){
  var d = document.createElement('div');
  d.innerHTML =
  '<button class="ed-lock" id="edLock" title="Editor — Ctrl+E">' +
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
  '</button>' +
  '<div class="ed-bar" id="edBar">' +
    '<span class="t">✏️ Edit mode</span>' +
    '<button class="ed-btn primary" id="edSave">💾 সেভ করুন <span id="edDirty"></span></button>' +
    '<button class="ed-btn" id="edNew">＋ নতুন ব্লগ পোস্ট</button>' +
    '<button class="ed-btn" id="edLogout">লগআউট</button>' +
    '<span class="ed-hint">Ctrl+E মোড · Ctrl+S সেভ</span>' +
  '</div>' +
  '<div class="ed-ov" id="edLogin">' +
    '<div class="ed-panel" style="max-width:380px">' +
      '<h3>🔒 এডিটর লগইন</h3>' +
      '<label>ইমেইল</label><input type="email" id="lgEmail" autocomplete="username">' +
      '<label>পাসওয়ার্ড</label><input type="password" id="lgPass" autocomplete="current-password">' +
      '<div class="ed-acts"><button class="ed-btn primary" id="lgGo" style="width:100%;text-align:center;justify-content:center">প্রবেশ করুন</button></div>' +
    '</div>' +
  '</div>' +
  '<div class="ed-ov" id="edPost">' +
    '<div class="ed-panel">' +
      '<h3 id="pmHead">নতুন ব্লগ পোস্ট</h3>' +
      '<label>শিরোনাম</label><input id="pmTitleIn" placeholder="লেখার শিরোনাম">' +
      '<div class="ed-row">' +
        '<div><label>তারিখ</label><input type="date" id="pmDate"></div>' +
        '<div><label>কভার ছবির লিংক</label><input id="pmCover" placeholder="https://...jpg"></div>' +
      '</div>' +
      '<label>লেখা (প্যারার মাঝে একটি খালি লাইন দিন)</label>' +
      '<textarea id="pmBody" placeholder="আজকের চিন্তা…"></textarea>' +
      '<div class="ed-acts">' +
        '<button class="ed-btn primary" id="pmSave">💾 Supabase-এ সেভ</button>' +
        '<span class="sp"></span>' +
        '<button class="ed-btn" id="pmDel" style="border-color:rgba(224,112,90,.5);color:#e0705a">🗑 ডিলিট</button>' +
        '<button class="ed-btn" id="pmClose">বন্ধ</button>' +
      '</div>' +
    '</div>' +
  '</div>';
  document.body.appendChild(d);

  document.getElementById('edLock').addEventListener('click', function(){
    if (E.loggedIn) setMode(!E.on); else openLogin();
  });
  document.getElementById('edSave').addEventListener('click', saveContent);
  document.getElementById('edNew').addEventListener('click', function(){ openPostModal(null); });
  document.getElementById('edLogout').addEventListener('click', async function(){
    if (SB) await SB.auth.signOut();
    setMode(false);
    toastE('লগআউট হয়েছে');
  });
  document.getElementById('lgGo').addEventListener('click', doLogin);
  document.getElementById('lgPass').addEventListener('keydown', function(e){ if (e.key === 'Enter') doLogin(); });
  document.getElementById('pmSave').addEventListener('click', savePost);
  document.getElementById('pmClose').addEventListener('click', function(){ document.getElementById('edPost').classList.remove('open'); });
  document.getElementById('pmDel').addEventListener('click', deletePost);
  ['edLogin','edPost'].forEach(function(id){
    document.getElementById(id).addEventListener('click', function(e){
      if (e.target.id === id) e.target.classList.remove('open');
    });
  });
}

/* ---------- লগইন ---------- */
function setAuth(v){
  E.loggedIn = v;
  document.body.classList.toggle('ed-authed', v);
  if (!v) setMode(false);
}
function openLogin(){
  if (!SB){ toastE('Supabase সংযোগ পাওয়া যাচ্ছে না'); return; }
  document.getElementById('edLogin').classList.add('open');
  setTimeout(function(){ document.getElementById('lgEmail').focus(); }, 60);
}
async function doLogin(){
  var em = document.getElementById('lgEmail').value.trim();
  var pw = document.getElementById('lgPass').value;
  if (!em || !pw){ toastE('ইমেইল ও পাসওয়ার্ড দিন'); return; }
  var btn = document.getElementById('lgGo');
  btn.disabled = true; btn.textContent = 'যাচাই হচ্ছে…';
  var r = await SB.auth.signInWithPassword({ email: em, password: pw });
  btn.disabled = false; btn.textContent = 'প্রবেশ করুন';
  if (r.error){ toastE('এরর: ' + r.error.message); return; }
  document.getElementById('lgPass').value = '';
  document.getElementById('edLogin').classList.remove('open');
  toastE('স্বাগতম! Ctrl+E চাপুন');
}

/* ---------- এডিট মোড ---------- */
function setMode(v){
  E.on = !!v;
  document.body.classList.toggle('ed-on', E.on);
  document.querySelectorAll('[data-skey]').forEach(function(el){
    el.setAttribute('contenteditable', E.on ? 'true' : 'false');
    if (!E.on) el.blur();
  });
  if (!E.on){ E.dirty = {}; updateDirty(); }
}
function updateDirty(){
  var n = Object.keys(E.dirty).length;
  var el = document.getElementById('edDirty');
  if (el) el.textContent = n ? '(' + n + ')' : '';
}
document.addEventListener('input', function(e){
  if (!E.on) return;
  var el = e.target.closest ? e.target.closest('[data-skey]') : null;
  if (el){ E.dirty[el.getAttribute('data-skey')] = el.innerHTML; updateDirty(); }
});
async function saveContent(){
  if (!SB){ toastE('Supabase সংযোগ নেই'); return; }
  var keys = Object.keys(E.dirty);
  if (!keys.length){ toastE('নতুন কোনো পরিবর্তন নেই'); return; }
  var rows = keys.map(function(k){
    return { key:k, value:E.dirty[k], updated_at:new Date().toISOString() };
  });
  var r = await SB.from('site_content').upsert(rows, { onConflict:'key' });
  if (r.error){ toastE('সেভ হয়নি: ' + r.error.message); return; }
  E.dirty = {}; updateDirty();
  toastE('সেভ হয়েছে ✔ এখন থেকে সবাই এটাই দেখবে');
}

/* ---------- সাইট কনটেন্ট লোড ---------- */
async function loadContent(){
  if (!SB) return;
  try{
    var r = await SB.from('site_content').select('key,value');
    if (r.data){
      r.data.forEach(function(row){
        var el = document.querySelector('[data-skey="' + row.key + '"]');
        if (el && row.value) el.innerHTML = row.value;
      });
    }
  }catch(e){}
}

/* ---------- পোস্ট লোড (Supabase → ক্যাশ → posts.js) ---------- */
async function loadPosts(){
  if (SB){
    try{
      var r = await SB.from('posts').select('*').order('date', { ascending:false });
      if (!r.error && r.data && r.data.length){
        E.posts = r.data;
        try{ localStorage.setItem('shifat-posts-cache', JSON.stringify(r.data)); }catch(e){}
        return E.posts;
      }
    }catch(e){}
  }
  try{
    var c = JSON.parse(localStorage.getItem('shifat-posts-cache'));
    if (c && c.length){ E.posts = c; return E.posts; }
  }catch(e){}
  if (typeof BLOG_POSTS !== 'undefined'){
    E.posts = BLOG_POSTS.slice().sort(function(a,b){ return b.date.localeCompare(a.date); });
  } else E.posts = [];
  return E.posts;
}

/* ---------- পোস্ট মোডাল ---------- */
function findPost(slug){
  for (var i=0;i<E.posts.length;i++) if (E.posts[i].slug === slug) return E.posts[i];
  return null;
}
function openPostModal(slug){
  if (!SB){ toastE('Supabase সংযোগ নেই'); return; }
  E.editingSlug = slug;
  var p = slug ? findPost(slug) : null;
  document.getElementById('pmHead').textContent = p ? 'এডিট: ' + p.title : 'নতুন ব্লগ পোস্ট';
  document.getElementById('pmTitleIn').value = p ? p.title : '';
  document.getElementById('pmDate').value = p ? p.date : new Date().toISOString().slice(0,10);
  document.getElementById('pmCover').value = p ? (p.cover || '') : '';
  document.getElementById('pmBody').value = p ? (p.body || '') : '';
  document.getElementById('pmDel').style.display = p ? '' : 'none';
  document.getElementById('edPost').classList.add('open');
  setTimeout(function(){ document.getElementById('pmTitleIn').focus(); }, 60);
}
async function savePost(){
  var title = document.getElementById('pmTitleIn').value.trim();
  var date = document.getElementById('pmDate').value || new Date().toISOString().slice(0,10);
  var cover = document.getElementById('pmCover').value.trim();
  var body = document.getElementById('pmBody').value;
  if (!title){ toastE('শিরোনাম লিখুন!'); return; }
  var btn = document.getElementById('pmSave');
  btn.disabled = true; btn.textContent = 'সেভ হচ্ছে…';
  var row = {
    slug: E.editingSlug || (date + '-' + Math.random().toString(36).slice(2,7)),
    title: title, date: date, cover: cover, body: body
  };
  var r = await SB.from('posts').upsert(row, { onConflict:'slug' });
  btn.disabled = false; btn.textContent = '💾 Supabase-এ সেভ';
  if (r.error){ toastE('সেভ হয়নি: ' + r.error.message); return; }
  document.getElementById('edPost').classList.remove('open');
  toastE('প্রকাশিত ✔ সাইট রিফ্রেশেই সবাই দেখবে');
  await loadPosts();
  if (E.onChange) E.onChange();
}
async function deletePost(){
  if (!E.editingSlug) return;
  if (!confirm('পোস্টটা সত্যিই মুছে ফেলবেন?')) return;
  try{ await SB.from('posts').delete().eq('slug', E.editingSlug); }catch(e){}
  document.getElementById('edPost').classList.remove('open');
  toastE('মুছে ফেলা হয়েছে');
  await loadPosts();
  if (E.onChange) E.onChange();
}

/* কার্ডের ✏️/🗑 বাটন (ডেলিগেটেড) */
document.addEventListener('click', function(e){
  var eb = e.target.closest ? e.target.closest('.pebtn.edit') : null;
  if (eb){
    e.preventDefault(); e.stopPropagation();
    var card = eb.closest('[data-slug]');
    if (card) openPostModal(card.getAttribute('data-slug'));
    return;
  }
  var db = e.target.closest ? e.target.closest('.pebtn.del') : null;
  if (db){
    e.preventDefault(); e.stopPropagation();
    var c2 = db.closest('[data-slug]');
    if (c2){ E.editingSlug = c2.getAttribute('data-slug'); deletePost(); }
  }
});

/* ---------- শর্টকাট ---------- */
document.addEventListener('keydown', function(e){
  var k = (e.key || '').toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 'e'){
    e.preventDefault();
    if (E.loggedIn) setMode(!E.on);
    else openLogin();
  }
  if ((e.ctrlKey || e.metaKey) && k === 's' && E.on){
    e.preventDefault(); saveContent();
  }
  if (e.key === 'Escape'){
    var l = document.getElementById('edLogin');
    var p = document.getElementById('edPost');
    if (l) l.classList.remove('open');
    if (p) p.classList.remove('open');
  }
});

/* ---------- ইনিট ---------- */
E.init = async function(){
  injectUI();
  if (SB){
    try{
      var r = await SB.auth.getSession();
      setAuth(!!(r.data && r.data.session));
      SB.auth.onAuthStateChange(function(_e, s){ setAuth(!!s); });
    }catch(e){}
    loadContent();
  }
  await loadPosts();
  if (E.onChange) E.onChange();
};
E.loadPosts = loadPosts;
E.openPostModal = openPostModal;
})();
