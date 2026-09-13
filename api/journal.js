export default async function handler(req, res) {
  const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  try {
    const t = (req.query.t || 'travel').toString() === 'hubijabi' ? 'hubijabi' : 'travel';
    const slug = (req.query.p || '').toString();
    const SB = 'https://wpfcefseyltahuwqrnw.supabase.co';
    const KEY = 'sb_publishable_2Yu-KVpYeGdTevg5fE1bRg_pslPMvt5';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const origin = proto + '://' + host;
    let post = null;
    if (slug) {
      const r = await fetch(`${SB}/rest/v1/journal_entries?type=eq.${t}&slug=eq.${encodeURIComponent(slug)}&select=*`, {
        headers: { apikey: KEY, Authorization: 'Bearer ' + KEY }
      });
      const d = await r.json();
      if (Array.isArray(d) && d[0]) post = d[0];
    }
    if (!post) { res.writeHead(302, { Location: '/index.html' }); return res.end(); }
    const shareUrl = `${origin}/api/journal?t=${t}&p=${encodeURIComponent(slug)}`;
    const ym = (post.video || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/);
    const vid = ym ? ym[1] : (/^[A-Za-z0-9_-]{11}$/.test(post.video || '') ? post.video : '');
    const paras = (post.body || '').split(/\n\s*\n/).filter(s => s.trim())
      .map(s => `<p>${esc(s).replace(/\n/g, '<br>')}</p>`).join('') || `<p class="pend">লেখাটি প্রস্তুত হচ্ছে…</p>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(post.title)} — Md. Tawhidul Islam Shifat</title>
<meta property="og:type" content="article"><meta property="og:title" content="${esc(post.title)}">
<meta property="og:description" content="${esc((post.place ? post.place + ' · ' : '') + (post.date || ''))}">${post.image ? `<meta property="og:image" content="${esc(post.image)}">` : ''}
<meta property="og:url" content="${shareUrl}"><meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(post.title)}">${post.image ? `<meta name="twitter:image" content="${esc(post.image)}">` : ''}
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;600&family=Poppins:wght@400;500&display=swap" rel="stylesheet">
<style>body{margin:0;background:#151412;color:#F1EEE6;font-family:'Noto Serif Bengali',serif;line-height:2}.wrap{max-width:720px;margin:0 auto;padding:3rem 1.4rem 5rem}.back{color:#E2B45A;text-decoration:none;font-family:Poppins,sans-serif;font-size:.9rem}h1{font-size:2rem;line-height:1.4;margin:.5rem 0 .3rem}.dt{color:#E2B45A;font-family:monospace;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase}.co{border-radius:8px;width:100%;margin:1.4rem 0}.vd{position:relative;aspect-ratio:16/9;border-radius:8px;overflow:hidden;margin:1.4rem 0}.vd iframe{position:absolute;inset:0;width:100%;height:100%;border:0}.pend{border:1px dashed #444;padding:1.2rem;text-align:center;color:#888}</style></head>
<body><div class="wrap"><a class="back" href="/journal.html?t=${t}&p=${encodeURIComponent(slug)}">← পুরো লেখা</a>
<div class="dt">${esc(post.date || '')}${post.place ? ' · ' + esc(post.place) : ''}</div><h1>${esc(post.title)}</h1>
 ${post.image ? `<img class="co" src="${esc(post.image)}" alt="">` : ''}
 ${vid ? `<div class="vd"><iframe src="https://www.youtube-nocookie.com/embed/${vid}" title="Video" allowfullscreen></iframe></div>` : ''}
<div>${paras}</div></div></body></html>`);
  } catch (e) {
    res.writeHead(302, { Location: '/index.html' }); res.end();
  }
}
