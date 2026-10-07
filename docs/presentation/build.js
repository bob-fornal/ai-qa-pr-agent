const fs = require('fs'), path = require('path');
// Rebuilds index.html and speaker-notes.md from source/ (deck.json + slides/*.html).
// Usage: node docs/presentation/build.js
const dir = process.argv[2] || __dirname;
const deck = JSON.parse(fs.readFileSync(path.join(dir, 'source/deck.json'), 'utf8'));
const icons = { Lock: '🔒', Warning: '⚠', Search: '🔍', CheckCircle: '✓' };
const sections = [], notes = [];
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
const strip = (s) => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
deck.order.forEach((id, i) => {
  let html = fs.readFileSync(path.join(dir, 'source/slides', id + '.html'), 'utf8').trim();
  html = html.replace(/<x-connector[^>]*><\/x-connector>/g,
    '<div style="width:64px;display:flex;align-items:center;justify-content:center;font-size:44px;color:#7FA8F0">→</div>');
  html = html.replace(/<x-icon name="(\w+)" style="color:([^;]+);width:(\d+)px;height:(\d+)px"><\/x-icon>/g,
    (_, n, c, w) => `<div aria-hidden="true" style="width:${w}px;font-size:${Math.round(w * 0.8)}px;line-height:1;color:${c};text-align:center">${icons[n] || '•'}</div>`);
  html = html.replace(/^<section id="([^"]+)"/, '<section id="slide-$1"').replace(/^<section /, `<section class="slide" data-n="${i + 1}" `);
  sections.push(html);
  const title = (html.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/) || [, id])[1];
  const aside = (html.match(/<aside>([\s\S]*?)<\/aside>/) || [, ''])[1];
  notes.push(`## ${i + 1}. ${strip(title)}\n\n${strip(aside)}\n`);
});
const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${deck.title}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
  :root { --bg: #0b1320; --ui: #B8C4D6; }
  html, body { margin: 0; height: 100%; background: var(--bg); color: var(--ui); font-family: 'IBM Plex Sans', Arial, sans-serif; }
  .stage { position: fixed; inset: 0; overflow: hidden; }
  .frame { position: absolute; left: 50%; top: 50%; width: 1920px; height: 1080px; transform-origin: 0 0; }
  .slide { position: absolute !important; inset: 0; width: 1920px; height: 1080px; box-sizing: border-box; overflow: hidden; }
  .slide[hidden] { display: none !important; }
  .slide * { margin: 0; box-sizing: border-box; }
  .slide ul, .slide ol { padding-left: 1.2em; }
  .slide table { border-collapse: collapse; width: 100%; }
  .slide th, .slide td { padding: 0.35em 0.6em; text-align: left; vertical-align: top; border-bottom: 1px solid #DDD9CE; }
  .slide th { font-weight: 600; border-bottom-width: 2px; }
  .slide aside { display: none; }
  .bar { position: fixed; left: 0; right: 0; bottom: 0; display: flex; gap: 16px; align-items: center; justify-content: center; padding: 8px 16px; font-size: 14px; background: rgba(11,19,32,.85); opacity: 0; transition: opacity .2s; }
  body:hover .bar, .bar:focus-within { opacity: 1; }
  .bar button { background: #1B2B44; color: #F6F5F0; border: 1px solid #2E4466; border-radius: 6px; padding: 6px 12px; font: inherit; cursor: pointer; }
  .notes { position: fixed; left: 0; right: 0; bottom: 48px; max-height: 35vh; overflow: auto; margin: 0 auto; width: min(960px, calc(100% - 32px)); padding: 16px 20px; background: #F6F5F0; color: #0F1B2D; border-radius: 10px; font-size: 16px; line-height: 1.5; box-shadow: 0 8px 32px rgba(0,0,0,.4); }
  .notes[hidden] { display: none; }
  @media print {
    @page { size: 1920px 1080px; margin: 0; }
    html, body { background: none; }
    .stage { position: static; overflow: visible; }
    .frame { position: static; transform: none !important; width: auto; height: auto; }
    .slide, .slide[hidden] { display: flex !important; position: relative !important; page-break-after: always; break-after: page; }
    .bar, .notes { display: none !important; }
  }
</style>
</head>
<body>
<div class="stage"><div class="frame" id="deck-frame">
${sections.join('\n')}
</div></div>
<div class="notes" id="deck-notes" hidden></div>
<nav class="bar" aria-label="Slide controls">
  <button id="deck-prev" type="button" aria-label="Previous slide">←</button>
  <span id="deck-count" aria-live="polite"></span>
  <button id="deck-next" type="button" aria-label="Next slide">→</button>
  <button id="deck-toggle-notes" type="button">Notes (N)</button>
  <span>F: fullscreen · Ctrl+P: PDF</span>
</nav>
<script>
  const slides = [...document.querySelectorAll('.slide')];
  const frame = document.getElementById('deck-frame');
  const notes = document.getElementById('deck-notes');
  let current = 0;
  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    frame.style.transform = 'scale(' + s + ') translate(-50%, -50%)';
  }
  function show(i) {
    current = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((el, n) => { el.hidden = n !== current; });
    document.getElementById('deck-count').textContent = (current + 1) + ' / ' + slides.length;
    const aside = slides[current].querySelector('aside');
    notes.textContent = aside ? aside.textContent : 'No notes for this slide.';
    try { history.replaceState(null, '', '#' + (current + 1)); } catch (e) { /* some browsers refuse history updates on file:// pages */ }
  }
  document.getElementById('deck-prev').onclick = () => show(current - 1);
  document.getElementById('deck-next').onclick = () => show(current + 1);
  document.getElementById('deck-toggle-notes').onclick = () => { notes.hidden = !notes.hidden; };
  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('button') && (e.key === ' ' || e.key === 'Enter')) return;
    if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); show(current + 1); }
    else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); show(current - 1); }
    else if (e.key === 'Home') show(0);
    else if (e.key === 'End') show(slides.length - 1);
    else if (e.key === 'n' || e.key === 'N') notes.hidden = !notes.hidden;
    else if (e.key === 'f' || e.key === 'F') { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }
  });
  addEventListener('resize', fit);
  fit();
  show((parseInt(location.hash.slice(1), 10) || 1) - 1);
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(dir, 'index.html'), page);
fs.writeFileSync(path.join(dir, 'speaker-notes.md'),
  `# ${deck.title}: Speaker Notes\n\nExtracted from the slide sources in \`source/slides/\`. Times are cumulative from the start of the talk. Running order and cut plan: [../presentation-guide.md](../presentation-guide.md).\n\n` + notes.join('\n'));
console.log('slides:', sections.length);
