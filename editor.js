/* editor.js — লাইভ এডিট প্যানেল v2 (এন্ট্রি/গ্যালারি/ভিডিও/পাবলিক লিংকসহ) */
(function(){
"use strict";
var SB=null;
try{ if(typeof window.supabase!=='undefined'&&typeof SUPABASE_URL!=='undefined'&&SUPABASE_URL){ SB=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);} }catch(e){}
window.ShifatSB=SB;
var E=window.ShifatEditor={on:false,loggedIn:false,dirty:{},posts:[],editingSlug:null,onChange:null,
  data:{pubs:[],confs:[],awards:[],certs:[],plinks:[],gphotos:[]},videos:{video1:'',video2:''}};
var KINDS={pub:{t:'research_entries'},conf:{t:'research_entries'},award:{t:'recog_entries'},cert:{t:'recog_entries'},plink:{t:'public_links'},gphoto:{t:'gallery_photos'}};

function toastE(msg){var w=document.getElementById('toastWrap');if(!w){alert(msg);return;}
 var t=document.createElement('div');t.className='toast';t.textContent=msg;w.appendChild(t);
 requestAnimationFrame(function(){t.classList.add('show');});
 setTimeout(function(){t.classList.remove('show');setTimeout(function(){t.remove();},400);},3200);}

var st=document.createElement('style');
st.textContent=['.ed-lock{position:fixed;right:1.1rem;bottom:1.1rem;z-index:3400;width:40px;height:40px;border-radius:50%;border:1px solid rgba(226,180,90,.5);background:rgba(21,20,18,.78);color:#E2B45A;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:.4;transition:.3s}',
'.ed-lock:hover{opacity:1}body.ed-authed .ed-lock{opacity:.95}',
'.ed-bar{position:fixed;right:1.1rem;bottom:1.1rem;z-index:3450;display:none;flex-direction:column;gap:.5rem;background:rgba(21,20,18,.96);border:1px solid #E2B45A;border-radius:10px;padding:.9rem;min-width:215px;box-shadow:0 14px 40px rgba(0,0,0,.45)}',
'body.ed-on .ed-bar{display:flex}body.ed-on .ed-lock{display:none}',
'.ed-bar .t{font-family:"Roboto Mono",monospace;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:#E2B45A}',
'.ed-btn{font-family:"Poppins",sans-serif;font-weight:500;font-size:.85rem;border:1px solid rgba(241,238,230,.2);background:none;color:#F1EEE6;border-radius:6px;padding:.5rem .8rem;cursor:pointer;text-align:left;transition:.25s}',
'.ed-btn:hover{border-color:#E2B45A;color:#E2B45A}',
'.ed-btn.primary{background:#E2B45A;border-color:#E2B45A;color:#221A08}',
'.ed-hint{font-size:.7rem;color:rgba(241,238,230,.5);font-family:"Roboto Mono",monospace}',
'body.ed-on [data-skey]{outline:2px dashed rgba(226,180,90,.65);outline-offset:5px;border-radius:3px;cursor:text}',
'body.ed-on [data-skey]:hover{background:rgba(226,180,90,.12)}',
'body.ed-on [data-skey]:focus{outline-style:solid;background:rgba(226,180,90,.1)}',
'.ed-add{display:none!important}body.ed-on .ed-add{display:inline-flex!important;align-items:center;gap:.4rem;background:none;border:1px dashed rgba(226,180,90,.6);color:#E2B45A;border-radius:999px;padding:.45rem 1.1rem;font-family:"Poppins",sans-serif;font-weight:500;font-size:.85rem;cursor:pointer;margin-top:1rem}',
'.ed-add:hover{background:#E2B45A;color:#221A08}',
'.entry,.post,.pl-card,.slide-stage,.thumbs button{position:relative}',
'.pebtns{position:absolute;top:.5rem;right:.5rem;display:none;gap:.35rem;z-index:5}',
'body.ed-on .pebtns{display:flex}',
'.pebtn{width:32px;height:32px;border-radius:6px;border:1px solid rgba(241,238,230,.35);background:rgba(12,11,9,.75);color:#F1EEE6;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.25s;padding:0;font-size:.85rem}',
'.pebtn:hover{background:#E2B45A;color:#221A08;border-color:#E2B45A}',
'.ed-ov{position:fixed;inset:0;z-index:3600;background:rgba(10,9,7,.85);display:none;align-items:center;justify-content:center;padding:1.2rem}',
'.ed-ov.open{display:flex}',
'.ed-panel{width:min(680px,94vw);max-height:88vh;overflow-y:auto;background:#1D1B18;border:1px solid rgba(226,180,90,.4);border-radius:10px;padding:1.6rem;color:#F1EEE6}',
'.ed-panel h3{font-family:"Poppins",sans-serif;font-weight:600;margin:0 0 1rem;font-size:1.15rem}',
'.ed-panel label{display:block;font-family:"Poppins",sans-serif;font-weight:500;font-size:.8rem;color:rgba(241,238,230,.6);margin:.9rem 0 .35rem}',
'.ed-panel input,.ed-panel textarea{width:100%;background:rgba(241,238,230,.05);border:1px solid rgba(241,238,230,.18);border-radius:6px;padding:.65rem .8rem;color:#F1EEE6;font-family:inherit;font-size:.98rem}',
'.ed-panel textarea{min-height:200px;resize:vertical;font-family:"Noto Serif Bengali",serif;line-height:1.9}',
'.ed-panel input:focus,.ed-panel textarea:focus{outline:none;border-color:#E2B45A}',
'.ed-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}',
'.ed-acts{display:flex;gap:.7rem;margin-top:1.4rem;flex-wrap:wrap;align-items:center}.ed-acts .sp{flex:1}',
'.ed-note{font-size:.78rem;color:rgba(241,238,230,.55);margin-top:.3rem}',
'@media(max-width:560px){.ed-row{grid-template-columns:1fr}}'].join('\n');
document.head.appendChild(st);

function injectUI(){
 var d=document.createElement('div');
 d.innerHTML=
 '<button class="ed-lock" id="edLock" title="Editor — Ctrl+E"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></button>'+
 '<div class="ed-bar" id="edBar"><span class="t">✏️ Edit mode</span>'+
 '<button class="ed-btn primary" id="edSave">💾 সেভ করুন <span id="edDirty"></span></button>'+
 '<button class="ed-btn" id="edNew">＋ নতুন ব্লগ পোস্ট</button>'+
 '<button class="ed-btn" id="edLogout">লগআউট</button>'+
 '<span class="ed-hint">Ctrl+E মোড · Ctrl+S সেভ</span></div>'+
 '<div class="ed-ov" id="edLogin"><div class="ed-panel" style="max-width:380px"><h3>🔒 এডিটর লগইন</h3>'+
 '<label>ইমেইল</label><input type="email" id="lgEmail" autocomplete="username">'+
 '<label>পাসওয়ার্ড</label><input type="password" id="lgPass" autocomplete="current-password">'+
 '<div class="ed-acts"><button class="ed-btn primary" id="lgGo" style="width:100%;justify-content:center">প্রবেশ করুন</button></div></div></div>'+
 '<div class="ed-ov" id="edPost"><div class="ed-panel"><h3 id="pmHead">নতুন ব্লগ পোস্ট</h3>'+
 '<label>শিরোনাম</label><input id="pmTitleIn">'+
 '<div class="ed-row"><div><label>তারিখ</label><input type="date" id="pmDate"></div>'+
 '<div><label>কভার ছবি (আপলোড/লিংক)</label><input id="pmCover" placeholder="https://...jpg"><input type="file" id="pmCoverFile" accept="image/*" style="margin-top:.45rem;font-size:.78rem"><div class="ed-note" id="pmCoverStatus"></div></div></div>'+
 '<label>লেখা (প্যারার মাঝে খালি লাইন)</label><textarea id="pmBody"></textarea>'+
 '<div class="ed-acts"><button class="ed-btn primary" id="pmSave">💾 Supabase-এ সেভ</button><span class="sp"></span>'+
 '<button class="ed-btn" id="pmDel" style="border-color:rgba(224,112,90,.5);color:#e0705a">🗑 ডিলিট</button>'+
 '<button class="ed-btn" id="pmClose">বন্ধ</button></div></div></div>'+
 '<div class="ed-ov" id="edEntry"><div class="ed-panel"><h3 id="enHead">এন্ট্রি</h3>'+
 '<label>শিরোনাম</label><input id="enTitle">'+
 '<div class="ed-row"><div><label>সাব-লেবেল (Journal · Year)</label><input id="enMeta"></div>'+
 '<div><label>লিংক (ওয়েবসাইট হলে)</label><input id="enUrl" placeholder="https://..."></div></div>'+
 '<label>ছোট বিবরণ</label><textarea id="enDesc" style="min-height:90px"></textarea>'+
 '<label>ছবি/সার্টিফিকেট (আপলোড/লিংক)</label><input id="enFile" placeholder="https://...jpg/pdf">'+
 '<input type="file" id="enFileIn" accept="image/*,.pdf" style="margin-top:.45rem;font-size:.78rem"><div class="ed-note" id="enStatus"></div>'+
 '<div class="ed-acts"><button class="ed-btn primary" id="enSave">💾 সেভ</button><span class="sp"></span>'+
 '<button class="ed-btn" id="enDel" style="border-color:rgba(224,112,90,.5);color:#e0705a">🗑 ডিলিট</button>'+
 '<button class="ed-btn" id="enClose">বন্ধ</button></div></div></div>';
 document.body.appendChild(d);
 document.getElementById('edLock').addEventListener('click',function(){ if(E.loggedIn)setMode(!E.on); else openLogin(); });
 document.getElementById('edSave').addEventListener('click',saveContent);
 document.getElementById('edNew').addEventListener('click',function(){openPostModal(null);});
 document.getElementById('edLogout').addEventListener('click',async function(){ if(SB)await SB.auth.signOut(); setMode(false); toastE('লগআউট হয়েছে'); });
 document.getElementById('lgGo').addEventListener('click',doLogin);
 document.getElementById('lgPass').addEventListener('keydown',function(e){if(e.key==='Enter')doLogin();});
 document.getElementById('pmSave').addEventListener('click',savePost);
 document.getElementById('pmClose').addEventListener('click',function(){document.getElementById('edPost').classList.remove('open');});
 document.getElementById('pmDel').addEventListener('click',deletePost);
 document.getElementById('pmCoverFile').addEventListener('change',function(e){uploadTo(e,'covers',function(url){document.getElementById('pmCover').value=url;document.getElementById('pmCoverStatus').textContent='আপলোড সম্পন্ন ✔';});});
 document.getElementById('enSave').addEventListener('click',saveEntry);
 document.getElementById('enClose').addEventListener('click',function(){document.getElementById('edEntry').classList.remove('open');});
 document.getElementById('enDel').addEventListener('click',deleteEntry);
 document.getElementById('enFileIn').addEventListener('change',function(e){uploadTo(e,'covers',function(url){document.getElementById('enFile').value=url;document.getElementById('enStatus').textContent='আপলোড সম্পন্ন ✔';});});
 ['edLogin','edPost','edEntry'].forEach(function(id){document.getElementById(id).addEventListener('click',function(e){if(e.target.id===id)e.target.classList.remove('open');});});
}
function uploadTo(e,bucket,cb){
 var f=e.target.files&&e.target.files[0];if(!f)return;
 var stEl=e.target.parentNode.querySelector('.ed-note');
 if(!SB){if(stEl)stEl.textContent='Supabase সংযোগ নেই';return;}
 if(f.size>8*1024*1024){if(stEl)stEl.textContent='ছবি খুব বড় (৮MB ম্যাক্স)';return;}
 if(stEl)stEl.textContent='আপলোড হচ্ছে…';
 shrink(f,1600,function(blob){
  var name='up-'+Date.now()+'-'+Math.random().toString(36).slice(2,7)+'.jpg';
  SB.storage.from(bucket).upload(name,blob,{contentType:'image/jpeg',cacheControl:'31536000'}).then(function(r){
   if(r.error){if(stEl)stEl.textContent='ব্যর্থ: '+r.error.message;return;}
   var pub=SB.storage.from(bucket).getPublicUrl(name);
   cb(pub.data.publicUrl); toastE('ছবি আপলোড হয়েছে ✔');
  });
 });
}
function shrink(file,maxW,cb){
 if(!file.type||file.type.indexOf('image')!==0){cb(file);return;}
 var img=new Image(),url=URL.createObjectURL(file);
 img.onload=function(){try{var s=Math.min(1,maxW/img.width);var c=document.createElement('canvas');
  c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
  c.getContext('2d').drawImage(img,0,0,c.width,c.height);
  c.toBlob(function(b){cb(b||file);},'image/jpeg',.85);}catch(e){cb(file);}URL.revokeObjectURL(url);};
 img.onerror=function(){cb(file);};img.src=url;
}
function setAuth(v){E.loggedIn=v;document.body.classList.toggle('ed-authed',v);if(!v)setMode(false);}
function openLogin(){if(!SB){toastE('Supabase সংযোগ নেই');return;}document.getElementById('edLogin').classList.add('open');}
async function doLogin(){
 var em=document.getElementById('lgEmail').value.trim(),pw=document.getElementById('lgPass').value;
 if(!em||!pw){toastE('ইমেইল ও পাসওয়ার্ড দিন');return;}
 var b=document.getElementById('lgGo');b.disabled=true;b.textContent='যাচাই হচ্ছে…';
 var r=await SB.auth.signInWithPassword({email:em,password:pw});
 b.disabled=false;b.textContent='প্রবেশ করুন';
 if(r.error){toastE('এরর: '+r.error.message);return;}
 document.getElementById('lgPass').value='';document.getElementById('edLogin').classList.remove('open');
 toastE('স্বাগতম! Ctrl+E চাপুন');
}
function setMode(v){E.on=!!v;document.body.classList.toggle('ed-on',E.on);
 document.querySelectorAll('[data-skey]').forEach(function(el){el.setAttribute('contenteditable',E.on?'true':'false');if(!E.on)el.blur();});
 if(!E.on){E.dirty={};updateDirty();}}
function updateDirty(){var n=Object.keys(E.dirty).length;var el=document.getElementById('edDirty');if(el)el.textContent=n?'('+n+')':'';}
document.addEventListener('input',function(e){if(!E.on)return;var el=e.target.closest?e.target.closest('[data-skey]'):null;if(el){E.dirty[el.getAttribute('data-skey')]=el.innerHTML;updateDirty();}});
async function saveContent(){
 if(!SB)return;
 var keys=Object.keys(E.dirty);
 if(!keys.length){toastE('নতুন পরিবর্তন নেই');return;}
 var rows=keys.map(function(k){return{key:k,value:E.dirty[k],updated_at:new Date().toISOString()};});
 var r=await SB.from('site_content').upsert(rows,{onConflict:'key'});
 if(r.error){toastE('সেভ হয়নি: '+r.error.message);return;}
 E.dirty={};updateDirty();toastE('সেভ হয়েছে ✔');
}
async function loadContent(){
 if(!SB)return;
 try{var r=await SB.from('site_content').select('key,value');
  if(r.data)r.data.forEach(function(row){
   if(row.key==='video1'||row.key==='video2'){E.videos[row.key]=row.value||'';return;}
   var el=document.querySelector('[data-skey="'+row.key+'"]');if(el&&row.value)el.innerHTML=row.value;
  });
 }catch(e){}
}
async function loadPosts(){
 if(SB){try{var r=await SB.from('posts').select('*').order('date',{ascending:false});
  if(!r.error&&r.data&&r.data.length){E.posts=r.data;try{localStorage.setItem('shifat-posts-cache',JSON.stringify(r.data));}catch(e){}return E.posts;}}catch(e){}}
 try{var c=JSON.parse(localStorage.getItem('shifat-posts-cache'));if(c&&c.length){E.posts=c;return E.posts;}}catch(e){}
 if(typeof BLOG_POSTS!=='undefined')E.posts=BLOG_POSTS.slice().sort(function(a,b){return b.date.localeCompare(a.date);});else E.posts=[];
 return E.posts;
}
async function loadAll(){
 if(!SB)return;
 function map(rows,kind){return (rows||[]).map(function(x){return{kind:kind,id:x.id,title:x.title||'',meta:x.meta||'',descr:(x.descr!==undefined?x.descr:(x.note||'')),file:(x.file||x.image||x.url||''),url:x.url||''};});}
 try{
  var a=await SB.from('research_entries').select('*').order('created_at',{ascending:false});
  if(!a.error&&a.data){E.data.pubs=map(a.data.filter(function(x){return x.type==='pub';}),'pub');E.data.confs=map(a.data.filter(function(x){return x.type==='conf';}),'conf');}
  var b=await SB.from('recog_entries').select('*').order('created_at',{ascending:false});
  if(!b.error&&b.data){E.data.awards=map(b.data.filter(function(x){return x.type==='award';}),'award');E.data.certs=map(b.data.filter(function(x){return x.type==='cert';}),'cert');}
  var c=await SB.from('gallery_photos').select('*').order('created_at',{ascending:false});
  if(!c.error&&c.data&&c.data.length)E.data.gphotos=c.data.map(function(x){return{id:x.id,file:x.url};});
  var d=await SB.from('public_links').select('*').order('created_at',{ascending:false});
  if(!d.error&&d.data)E.data.plinks=map(d.data,'plink');
 }catch(e){}
}
function findPost(slug){for(var i=0;i<E.posts.length;i++)if(E.posts[i].slug===slug)return E.posts[i];return null;}
function findEntry(kind,id){var arr=E.data[kind+'s']||[];for(var i=0;i<arr.length;i++)if(arr[i].id===id)return arr[i];return null;}
function openPostModal(slug){
 if(!SB){toastE('Supabase সংযোগ নেই');return;}
 E.editingSlug=slug;var p=slug?findPost(slug):null;
 document.getElementById('pmHead').textContent=p?'এডিট: '+p.title:'নতুন ব্লগ পোস্ট';
 document.getElementById('pmTitleIn').value=p?p.title:'';
 document.getElementById('pmDate').value=p?p.date:new Date().toISOString().slice(0,10);
 document.getElementById('pmCover').value=p?(p.cover||''):'';
 document.getElementById('pmBody').value=p?(p.body||''):'';
 document.getElementById('pmCoverFile').value='';document.getElementById('pmCoverStatus').textContent='';
 document.getElementById('pmDel').style.display=p?'':'none';
 document.getElementById('edPost').classList.add('open');
}
async function savePost(){
 var title=document.getElementById('pmTitleIn').value.trim();
 var date=document.getElementById('pmDate').value||new Date().toISOString().slice(0,10);
 var cover=document.getElementById('pmCover').value.trim(),body=document.getElementById('pmBody').value;
 if(!title){toastE('শিরোনাম লিখুন!');return;}
 var b=document.getElementById('pmSave');b.disabled=true;b.textContent='সেভ হচ্ছে…';
 var row={slug:E.editingSlug||(date+'-'+Math.random().toString(36).slice(2,7)),title:title,date:date,cover:cover,body:body};
 var r=await SB.from('posts').upsert(row,{onConflict:'slug'});
 b.disabled=false;b.textContent='💾 Supabase-এ সেভ';
 if(r.error){toastE('সেভ হয়নি: '+r.error.message);return;}
 document.getElementById('edPost').classList.remove('open');toastE('প্রকাশিত ✔');
 await loadPosts();if(E.onChange)E.onChange();
}
async function deletePost(){
 if(!E.editingSlug)return;if(!confirm('পোস্টটা মুছে ফেলবেন?'))return;
 try{await SB.from('posts').delete().eq('slug',E.editingSlug);}catch(e){}
 document.getElementById('edPost').classList.remove('open');toastE('মুছে ফেলা হয়েছে');
 await loadPosts();if(E.onChange)E.onChange();
}
var enKind=null,enId=null;
function openEntryModal(kind,id){
 if(!SB){toastE('Supabase সংযোগ নেই');return;}
 enKind=kind;enId=id;
 var labels={pub:'Publication',conf:'Conference',award:'Award',cert:'Certificate',plink:'Public Link',gphoto:'গ্যালারি ছবি'};
 var e=id?findEntry(kind,id):null;
 document.getElementById('enHead').textContent=(id?'এডিট: ':'নতুন ')+(labels[kind]||kind);
 document.getElementById('enTitle').value=e?e.title:'';
 document.getElementById('enMeta').value=e?e.meta:'';
 document.getElementById('enUrl').value=e?(e.url||''):'';
 document.getElementById('enDesc').value=e?e.descr:'';
 document.getElementById('enFile').value=e?(e.file||''):'';
 document.getElementById('enFileIn').value='';document.getElementById('enStatus').textContent='';
 var showT=kind!=='gphoto',showM=['pub','conf','award','cert'].indexOf(kind)>-1,showU=kind==='plink';
 document.getElementById('enTitle').parentNode.style.display=showT?'':'none';
 document.getElementById('enMeta').closest('.ed-row').style.display=(showM||showU)?'':'none';
 document.getElementById('enMeta').style.display=showM?'':'none';
 document.getElementById('enUrl').style.display=showU?'':'none';
 var lab=document.getElementById('enUrl').previousElementSibling;if(lab)lab.style.display=showU?'':'none';
 document.getElementById('enDesc').style.display=kind==='gphoto'?'none':'';
 document.getElementById('enDesc').previousElementSibling.style.display=kind==='gphoto'?'none':'';
 document.getElementById('enDel').style.display=id?'':'none';
 document.getElementById('edEntry').classList.add('open');
}
async function saveEntry(){
 var kind=enKind;if(!kind)return;
 var title=document.getElementById('enTitle').value.trim();
 var meta=document.getElementById('enMeta').value.trim();
 var url=document.getElementById('enUrl').value.trim();
 var descr=document.getElementById('enDesc').value.trim();
 var file=document.getElementById('enFile').value.trim();
 if(kind!=='gphoto'&&!title){toastE('শিরোনাম লিখুন!');return;}
 if(kind==='gphoto'&&!file){toastE('ছবি আপলোড বা লিংক দিন!');return;}
 var b=document.getElementById('enSave');b.disabled=true;b.textContent='সেভ হচ্ছে…';
 var err=null;
 try{
  if(kind==='pub'||kind==='conf'){var row={title:title,meta:meta,descr:descr,file:file};if(kind==='conf')row.type='conf';else row.type='pub';if(enId)row.id=enId;
   var r=await SB.from('research_entries').upsert(row);err=r.error;}
  else if(kind==='award'||kind==='cert'){var row2={title:title,meta:meta,descr:descr,file:file,type:kind};if(enId)row2.id=enId;
   var r2=await SB.from('recog_entries').upsert(row2);err=r2.error;}
  else if(kind==='plink'){var row3={title:title,url:url,note:descr,image:file};if(enId)row3.id=enId;
   var r3=await SB.from('public_links').upsert(row3);err=r3.error;}
  else if(kind==='gphoto'){var row4={url:file};if(enId)row4.id=enId;
   var r4=await SB.from('gallery_photos').upsert(row4);err=r4.error;}
 }catch(ex){err=ex;}
 b.disabled=false;b.textContent='💾 সেভ';
 if(err){toastE('সেভ হয়নি: '+(err.message||err));return;}
 document.getElementById('edEntry').classList.remove('open');toastE('সেভ হয়েছে ✔');
 await loadAll();if(E.onChange)E.onChange();
}
async function deleteEntry(){
 if(!enId)return;if(!confirm('মুছে ফেলবেন?'))return;
 await SB.from(KINDS[enKind].t).delete().eq('id',enId);
 if(enKind==='gphoto'){try{await SB.from('gallery_photos').delete().eq('id',enId);}catch(e){}}
 document.getElementById('edEntry').classList.remove('open');toastE('মুছে ফেলা হয়েছে');
 await loadAll();if(E.onChange)E.onChange();
}
async function addGalleryByFile(input){
 var f=input.files&&input.files[0];if(!f)return;
 if(!SB)return;toastE('আপলোড হচ্ছে…');
 shrink(f,1600,function(blob){
  var name='gal-'+Date.now()+'.jpg';
  SB.storage.from('covers').upload(name,blob,{contentType:'image/jpeg'}).then(function(r){
   if(r.error){toastE('ব্যর্থ: '+r.error.message);return;}
   var pub=SB.storage.from('covers').getPublicUrl(name);
   SB.from('gallery_photos').insert({url:pub.data.publicUrl}).then(async function(r2){
    if(r2.error){toastE('ব্যর্থ: '+r2.error.message);return;}
    toastE('ছবি যোগ হয়েছে ✔');await loadAll();if(E.onChange)E.onChange();
   });
  });
 });
 input.value='';
}
async function editVideo(vkey){
 var cur=E.videos[vkey]||'';
 var v=prompt('YouTube লিংক বা Video ID দিন:',cur?'https://youtu.be/'+cur:'');
 if(v===null)return;
 var id=parseYT(v);
 if(!id){toastE('সঠিক YouTube লিংক/ID নয়');return;}
 await SB.from('site_content').upsert({key:vkey,value:id,updated_at:new Date().toISOString()},{onConflict:'key'});
 E.videos[vkey]=id;toastE('ভিডিও বদলানো হয়েছে ✔');
 if(E.onChange)E.onChange();
}
function parseYT(v){
 if(!v)return'';v=v.trim();
 var m=v.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/);
 if(m)return m[1];
 if(/^[A-Za-z0-9_-]{11}$/.test(v))return v;
 return'';
}
document.addEventListener('click',function(e){
 if(!e.target.closest)return;
 var eb=e.target.closest('.pebtn.edit');
 if(eb){e.preventDefault();e.stopPropagation();var k=eb.getAttribute('data-kind'),id=eb.getAttribute('data-id');
  if(k==='post')openPostModal(id);else openEntryModal(k,id);return;}
 var db=e.target.closest('.pebtn.del');
 if(db){e.preventDefault();e.stopPropagation();var k2=db.getAttribute('data-kind'),id2=db.getAttribute('data-id');
  if(k2==='post'){E.editingSlug=id2;deletePost();}else{enKind=k2;enId=id2;deleteEntry();}return;}
 var ab=e.target.closest('.ed-add');
 if(ab){openEntryModal(ab.getAttribute('data-add'),null);return;}
 var gb=e.target.closest('.ed-gal-add');
 if(gb){document.getElementById('galFile').click();return;}
 var vb=e.target.closest('.pebtn.vedit');
 if(vb){editVideo(vb.getAttribute('data-vkey'));return;}
});
document.addEventListener('change',function(e){
 if(e.target&&e.target.id==='galFile')addGalleryByFile(e.target);
});
document.addEventListener('keydown',function(e){
 var k=(e.key||'').toLowerCase();
 if((e.ctrlKey||e.metaKey)&&k==='e'){e.preventDefault();if(E.loggedIn)setMode(!E.on);else openLogin();}
 if((e.ctrlKey||e.metaKey)&&k==='s'&&E.on){e.preventDefault();saveContent();}
 if(e.key==='Escape'){['edLogin','edPost','edEntry'].forEach(function(id){var el=document.getElementById(id);if(el)el.classList.remove('open');});}
});
E.init=async function(){
 injectUI();
 if(SB){try{var r=await SB.auth.getSession();setAuth(!!(r.data&&r.data.session));
  SB.auth.onAuthStateChange(function(_e,s){setAuth(!!s);});}catch(e){}}
 await loadContent();
 await loadPosts();
 await loadAll();
 if(E.onChange)E.onChange();
};
E.loadPosts=loadPosts;E.openPostModal=openPostModal;E.parseYT=parseYT;
})();
