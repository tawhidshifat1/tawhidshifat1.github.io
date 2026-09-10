export default async function handler(req, res) {
  const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  try {
    const slug = (req.query.p || '').toString();
    const SB = 'https://wpfcefseyltahuwqrnw.supabase.co';
    const KEY = 'sb_publishable_2Yu-KVpYeGdTevg5fE1bRg_pslPMvt5';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const origin = proto + '://' + host;
    let post = null;
    if (slug) {
      const r = await fetch(`${SB}/rest/v1/posts?slug=eq.${encodeURIComponent(slug)}&select=*`, {
        headers: { apikey: KEY, Authorization: 'Bearer ' + KEY }
      });
      const d = await r.json();
      if (Array.isArray(d) && d[0]) post = d[0];
    }
    if (!post) { res.writeHead(302, { Location: '/blogs.html' }); return res.end(); }
    const text = (post.body || '').replace(/\s+/g, ' ').trim();
    const desc = text.slice(0, 180) || post.title;
    const img = post.cover || '';
    const shareUrl = `${origin}/api/post?p=${encodeURIComponent(slug)}`;
    const paras = (post.body || '').split(/\n\s*\n/).filter(t => t.trim())
      .map(t => `<p>${esc(t).replace(/\n/g, '<br>')}</p>`).join('') || `<p class="pend">লেখাটি প্রস্তুত হচ্ছে…</p>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(post.title)} — Md. Tawhidul Islam Shifat</title>
<meta property="og:type" content="article"><meta property="og:title" content="${esc(post.title)}">
<meta property="og:description" content="${esc(desc)}">${img ? `<meta property="og:image" content="${esc(img)}">` : ''}
<meta property="og:url" content="${shareUrl}"><meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(post.title)}"><meta name="twitter:description" content="${esc(desc)}">
 ${img ? `<meta name="twitter:image" content="${esc(img)}">` : ''}
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;600&family=Poppins:wght@400;500&display=swap" rel="stylesheet">
<style>body{margin:0;background:#151412;color:#F1EEE6;font-family:'Noto Serif Bengali',serif;line-height:2}.wrap{max-width:720px;margin:0 auto;padding:3rem 1.4rem 5rem}.back{color:#E2B45A;text-decoration:none;font-family:Poppins,sans-serif;font-size:.9rem}h1{font-size:2rem;line-height:1.4;margin:.6rem 0 1.4rem}.dt{color:#E2B45A;font-family:monospace;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase}.co{border-radius:8px;width:100%;margin-bottom:1.6rem}.pend{border:1px dashed #444;padding:1.2rem;text-align:center;color:#888}.shr{margin-top:2.4rem;display:flex;gap:.6rem}.shr a{width:40px;height:40px;border:1px solid #444;border-radius:50%;color:#F1EEE6;display:flex;align-items:center;justify-content:center;text-decoration:none;font-family:Poppins,sans-serif;font-weight:600}.shr a:hover{background:#E2B45A;color:#221A08;border-color:#E2B45A}</style></head>
<body><div class="wrap"><a class="back" href="/blogs.html">← সব লেখা</a>
<div class="dt">${esc(post.date || '')}</div><h1>${esc(post.title)}</h1>
 ${img ? `<img class="co" src="${esc(img)}" alt="">` : ''}<div>${paras}</div>
<div class="shr"><a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}" target="_blank">f</a><a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}" target="_blank">𝕏</a><a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}" target="_blank">in</a></div>
</div></body></html>`);
  } catch (e) {
    res.writeHead(302, { Location: '/blogs.html' }); res.end();
  }
}
