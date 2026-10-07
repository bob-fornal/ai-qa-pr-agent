// Builds docs/presentation/ai-qa-pr-agent.pptx (for PowerPoint or import into Google Slides).
// Speaker notes come from source/slides/*.html so they stay in sync with the online deck.
//
// Dependencies are not part of this repo. Install them somewhere else and point NODE_PATH at it:
//   npm install --prefix <dir> pptxgenjs react react-dom react-icons sharp
//   NODE_PATH=<dir>/node_modules PPTX_THEME_SCRIPT=<pptx skill>/scripts/apply_theme.js node docs/presentation/build-pptx.js
const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const sharp = require('sharp');
const fa = require('react-icons/fa');

const DIR = __dirname;
const OUT = path.join(DIR, 'ai-qa-pr-agent.pptx');

const THEME = {
  name: 'AI QA PR Agent',
  headFontFace: 'IBM Plex Sans',
  bodyFontFace: 'IBM Plex Sans',
  colors: {
    dk1: '0F1B2D', lt1: 'FDFDFB', dk2: '3D4A5C', lt2: 'F6F5F0',
    accent1: 'B04E0F', accent2: '2456B8', accent3: '0F6B5E',
    accent4: 'F28C3A', accent5: '1B2B44', accent6: 'DDD9CE',
    hlink: '2456B8', folHlink: '5E6979',
  },
};
const MONO = 'JetBrains Mono';
const HEX = { navy: '0F1B2D', cream: 'F6F5F0', rule: 'DDD9CE', muted: '5E6979', mutedDark: '8C98AA', onDark: 'B8C4D6', darkCard: '1B2B44', darkLine: '2E4466', sky: '7FA8F0', orange: 'F28C3A', tintBlue: 'E8EEF8' };

const W = 13.333, H = 7.5, MX = 0.75, CW = W - 2 * MX;
const TITLE_Y = 0.45, TITLE_H = 1.05, TOP = 1.75, FOOT_Y = 6.92;

// ---------- speaker notes from the deck source ----------
const deck = JSON.parse(fs.readFileSync(path.join(DIR, 'source', 'deck.json'), 'utf8'));
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const notesFor = (id) => {
  const html = fs.readFileSync(path.join(DIR, 'source', 'slides', id + '.html'), 'utf8');
  const m = html.match(/<aside>([\s\S]*?)<\/aside>/);
  return m ? decode(m[1]).replace(/\s+/g, ' ').trim() : '';
};

// ---------- icons ----------
async function icon(name, color = '#FFFFFF') {
  const Comp = fa[name] || fa.FaCircle;
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { size: 256, color }));
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return 'image/png;base64,' + png.toString('base64');
}

(async () => {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = 'AI QA PR Agent';
  pres.author = 'Bob Fornal';
  pres.subject = 'Skills and agents that turn a pull request into a risk-ranked test plan';
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;

  // ---------- layouts ----------
  const footer = (color) => ({ text: { text: 'AI QA PR Agent', options: { x: MX, y: FOOT_Y, w: 3, h: 0.3, fontSize: 11, color, margin: 0, isTextBox: true } } });
  const titlePh = (color) => ({ placeholder: { options: { name: 'title', type: 'title', x: MX, y: TITLE_Y, w: CW, h: TITLE_H, fontSize: 32, bold: true, color, align: 'left', valign: 'middle', margin: 0 }, text: '' } });
  pres.defineSlideMaster({ title: 'LIGHT', background: { color: HEX.cream }, objects: [titlePh(C.text1), footer(HEX.muted)],
    slideNumber: { x: W - MX - 0.8, y: FOOT_Y, w: 0.8, h: 0.3, fontSize: 11, color: HEX.muted, align: 'right' } });
  pres.defineSlideMaster({ title: 'DARK', background: { color: HEX.navy }, objects: [titlePh(C.background2), footer(HEX.mutedDark)],
    slideNumber: { x: W - MX - 0.8, y: FOOT_Y, w: 0.8, h: 0.3, fontSize: 11, color: HEX.mutedDark, align: 'right' } });
  pres.defineSlideMaster({ title: 'DARK_PLAIN', background: { color: HEX.navy }, objects: [] });
  pres.defineSlideMaster({ title: 'ACCENT', background: { color: HEX.orange }, objects: [] });

  // ---------- helpers ----------
  let current = null;
  const sectionTitles = { s1: 'Why', s2: 'What', s3: 'How', s4: 'Demo', s5: 'Adopt', s6: 'Questions' };
  const starts = Object.fromEntries(Object.entries(deck.sections).map(([k, v]) => [v.start, sectionTitles[k]]));
  let section = null;
  function slide(id, master, title) {
    if (starts[id]) { section = starts[id]; pres.addSection({ title: section }); }
    const s = pres.addSlide({ masterName: master, sectionTitle: section });
    if (title) s.addText(title, { placeholder: 'title' });
    s.addNotes(notesFor(id));
    current = s;
    return s;
  }
  const text = (s, t, o) => s.addText(t, { isTextBox: true, margin: 0, valign: 'top', color: C.text2, fontSize: 16, ...o });
  const shadow = () => ({ type: 'outer', color: '0F1B2D', opacity: 0.1, blur: 6, offset: 2, angle: 90 });
  const card = (s, x, y, w, h, o = {}) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1,
    fill: { color: o.fill || C.background1 }, line: { color: o.line || C.accent6, width: 0.75 }, shadow: o.shadow === false ? undefined : shadow(), objectName: o.name });
  async function badge(s, name, x, y, d, fill, fg = '#FFFFFF') {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: 'none' } });
    const p = d * 0.24;
    s.addImage({ data: await icon(name, fg), x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p, altText: '' });
  }
  const numDot = (s, n, x, y, d, fill, color) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: 'none' } });
    text(s, String(n), { x, y, w: d, h: d, align: 'center', valign: 'middle', bold: true, fontSize: 14, color });
  };
  const caption = (s, t, dark) => text(s, t, { x: 3.9, y: FOOT_Y, w: W - MX - 0.9 - 3.9, h: 0.3, fontSize: 11, align: 'right', valign: undefined, color: dark ? HEX.mutedDark : HEX.muted });
  const cellBorder = () => [{ type: 'none' }, { type: 'none' }, { type: 'solid', pt: 0.75, color: HEX.rule }, { type: 'none' }];
  function table(s, header, rows, o) {
    const head = header.map((h, i) => ({ text: h, options: { bold: true, color: (o.headColors && o.headColors[i]) || C.text1, border: [{ type: 'none' }, { type: 'none' }, { type: 'solid', pt: 1.5, color: HEX.rule }, { type: 'none' }] } }));
    const body = rows.map((r) => r.map((c, i) => (typeof c === 'object' ? { text: c.text, options: { border: cellBorder(), ...c.options } } : { text: c, options: { border: cellBorder(), ...((o.cellOpts && o.cellOpts[i]) || {}) } })));
    s.addTable([head, ...body], { x: o.x ?? MX, y: o.y ?? TOP, w: o.w ?? CW, colW: o.colW, fontSize: o.fontSize || 13, color: C.text2, valign: 'middle', margin: [3, 6, 3, 6], rowH: o.rowH });
  }

  // 1 Cover
  {
    const s = slide('cover', 'DARK_PLAIN');
    text(s, 'AI QA PR AGENT', { x: 0.9, y: 1.85, w: 6, h: 0.4, fontFace: MONO, fontSize: 16, color: HEX.orange, charSpacing: 2 });
    text(s, 'What should we test in this PR?', { x: 0.9, y: 2.35, w: 9.2, h: 1.95, fontSize: 52, bold: true, color: C.background2, valign: 'top' });
    text(s, 'Skills and agents for Claude Code and GitHub Copilot that turn a pull request into a risk-ranked test plan', { x: 0.9, y: 4.45, w: 9.2, h: 1.0, fontSize: 22, color: HEX.onDark });
    await badge(s, 'FaCodeBranch', 10.55, 2.55, 1.85, HEX.darkCard, '#F28C3A');
    text(s, 'Bob Fornal · Leading EDJE', { x: 0.9, y: 6.75, w: 6, h: 0.3, fontSize: 12, color: HEX.onDark });
  }

  // 2 Agenda
  {
    const s = slide('agenda', 'LIGHT', 'Agenda');
    const rows = [['Why: the gap between a PR and a test plan', '5 min'], ['What: the report it produces', '4 min'], ['How: skills, agents, scoring, decision rules', '12 min'], ['Demo: a PR full of planted traps', '12 min'], ['Adopt: install, tune, limits, Q&A', '7+ min']];
    rows.forEach(([t, m], i) => {
      const y = 1.9 + i * 0.9;
      numDot(s, i + 1, MX, y + 0.12, 0.5, C.accent4, C.text1);
      text(s, t, { x: MX + 0.8, y: y + 0.1, w: 8.8, h: 0.55, fontSize: 22, color: C.text1, valign: 'middle' });
      text(s, m, { x: W - MX - 1.6, y: y + 0.1, w: 1.6, h: 0.55, fontSize: 16, align: 'right', valign: 'middle' });
      if (i < rows.length - 1) s.addShape(pres.shapes.LINE, { x: MX, y: y + 0.8, w: CW, h: 0, line: { color: HEX.rule, width: 0.75 } });
    });
  }

  // 3 Problem
  {
    const s = slide('problem', 'LIGHT', 'The problem: test planning happens in someone\'s head');
    const items = [['FaSitemap', 'Diffs hide reach', 'A three-line change to a shared helper can touch every checkout. The diff never shows the callers.'],
      ['FaHourglassHalf', 'QA gets the PR late', 'Testers rebuild intent from titles and tickets, then guess where the risk is.'],
      ['FaLayerGroup', '"Test everything"', 'Without a ranking, effort spreads evenly, and the risky path gets the same ten minutes as the README.']];
    const w = (CW - 2 * 0.4) / 3;
    for (const [i, [ic, h, b]] of items.entries()) {
      const x = MX + i * (w + 0.4), y = 2.0;
      card(s, x, y, w, 3.15);
      await badge(s, ic, x + 0.35, y + 0.35, 0.75, C.accent2);
      text(s, h, { x: x + 0.35, y: y + 1.35, w: w - 0.7, h: 0.5, fontSize: 20, bold: true, color: C.text1 });
      text(s, b, { x: x + 0.35, y: y + 1.95, w: w - 0.7, h: 1.7, fontSize: 16 });
    }
  }

  // 4 Goal
  {
    const s = slide('goal', 'ACCENT');
    text(s, 'THE GOAL', { x: MX + 0.15, y: 1.35, w: 5, h: 0.4, fontFace: MONO, fontSize: 16, color: C.text1, charSpacing: 2 });
    text(s, 'For every PR: the critical paths, ranked by risk, and whether each needs manual, smoke or automated testing.', { x: MX + 0.15, y: 1.9, w: 9.4, h: 2.9, fontSize: 38, bold: true, color: C.text1 });
    text(s, 'Consistent across reviewers. Same answer in Claude and Copilot. No test code generated.', { x: MX + 0.15, y: 5.0, w: 9.4, h: 0.9, fontSize: 20, color: C.text1 });
    await badge(s, 'FaBullseye', 11.0, 2.3, 1.45, HEX.navy, '#F28C3A');
  }

  // 5 Output
  {
    const s = slide('output', 'LIGHT', 'What you get: one report per PR');
    const items = [['Summary', 'overall risk, scope, merge readiness'], ['Critical path matrix', 'each path × Automated / Smoke / Manual'], ['Path details', 'why it\'s critical, coverage today, test ideas'], ['Smoke checklist', 'post-deploy, five minutes or less'],
      ['Manual test plan', 'scripted cases and exploratory charters'], ['Automated recommendations', 'level, behavior, suggested location'], ['Gaps and open questions', 'for the PR author'], ['Low risk', 'what was deliberately left out, and why']];
    const colW = (CW - 0.5) / 2;
    items.forEach(([b, t], i) => {
      const col = Math.floor(i / 4), row = i % 4, x = MX + col * (colW + 0.5), y = 1.85 + row * 0.92;
      numDot(s, i + 1, x, y + 0.04, 0.48, C.accent1, C.background1);
      text(s, [{ text: b, options: { bold: true, color: C.text1 } }, { text: ': ' + t }], { x: x + 0.7, y, w: colW - 0.7, h: 0.75, fontSize: 16, valign: 'middle' });
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX, y: 5.68, w: CW, h: 0.8, rectRadius: 0.08, fill: { color: HEX.tintBlue }, line: { type: 'none' } });
    text(s, 'Two readers: the developer deciding which tests to add, and the QA engineer planning manual and smoke work.', { x: MX + 0.3, y: 5.68, w: CW - 0.6, h: 0.8, fontSize: 16, color: C.text1, valign: 'middle' });
  }

  // 6 Recommendations, not code
  {
    const s = slide('recs-not-code', 'LIGHT', 'Why recommendations, not test code');
    const items = [['FaBrain', 'Judgment is the scarce part', 'Writing a unit test is cheap with AI. Knowing which five tests matter, and which paths need a human, is not.'],
      ['FaShieldAlt', 'Safe to run anywhere', 'Read-only agents can run on any PR, including forks, without touching the branch.'],
      ['FaEye', 'Easy to review', 'A reviewer can check a ranked list in two minutes. Two hundred lines of generated tests take much longer.'],
      ['FaArrowRight', 'Feeds the next step', 'Given/When/Then test ideas hand off cleanly to a person, or to a separate code-writing agent.']];
    const w = (CW - 0.5) / 2;
    for (const [i, [ic, h, b]] of items.entries()) {
      const x = MX + (i % 2) * (w + 0.5), y = 1.95 + Math.floor(i / 2) * 2.25;
      await badge(s, ic, x, y, 0.7, C.accent3);
      text(s, h, { x: x + 0.95, y: y, w: w - 0.95, h: 0.5, fontSize: 20, bold: true, color: C.text1 });
      text(s, b, { x: x + 0.95, y: y + 0.55, w: w - 0.95, h: 1.3, fontSize: 16 });
    }
  }

  // 7 Architecture
  {
    const s = slide('architecture', 'DARK', 'How it works: a four-stage pipeline');
    const stages = [['1 · ANALYZE', 'Change map', 'Diff, categories, callers, entry points, existing tests'], ['2 · RANK', 'Critical paths', 'Flows, not files. Impact × likelihood gives P0 to P3'],
      ['3 · DECIDE', 'Test types', 'Manual, Smoke and/or Automated, each with a reason'], ['4 · REPORT', 'Fixed format', 'Same sections every time, in Claude or Copilot']];
    const gap = 0.55, w = (CW - 3 * gap) / 4, y = 1.95, h = 2.55;
    stages.forEach(([e, t, b], i) => {
      const x = MX + i * (w + gap);
      card(s, x, y, w, h, { fill: HEX.darkCard, line: HEX.darkLine, shadow: false });
      text(s, e, { x: x + 0.25, y: y + 0.25, w: w - 0.5, h: 0.3, fontFace: MONO, fontSize: 12, color: HEX.orange });
      text(s, t, { x: x + 0.25, y: y + 0.65, w: w - 0.5, h: 0.45, fontSize: 20, bold: true, color: C.background2 });
      text(s, b, { x: x + 0.25, y: y + 1.2, w: w - 0.5, h: 1.2, fontSize: 14, color: HEX.onDark });
      if (i < 3) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + w + 0.1, y: y + h / 2 - 0.17, w: gap - 0.2, h: 0.34, fill: { color: HEX.sky }, line: { type: 'none' } });
    });
    const half = (CW - 0.5) / 2;
    text(s, [{ text: 'Claude Code: ', options: { bold: true, color: C.background2 } }, { text: 'stage 1 and stages 2–3 run as separate subagents, so each starts with a clean context.' }], { x: MX, y: 4.95, w: half, h: 1.2, fontSize: 16, color: HEX.onDark });
    text(s, [{ text: 'Copilot: ', options: { bold: true, color: C.background2 } }, { text: 'one custom agent runs all four stages from the same skill files.' }], { x: MX + half + 0.5, y: 4.95, w: half, h: 1.2, fontSize: 16, color: HEX.onDark });
  }

  // 8 Skills
  {
    const s = slide('skills', 'LIGHT', 'Five skills, one source of truth');
    const mono = (t) => ({ text: t, options: { fontFace: MONO, color: C.accent1 } });
    table(s, ['Skill', 'What it holds'], [
      [mono('pr-qa-review'), 'The entry point. Runs the pipeline, checks the result, saves the report'],
      [mono('pr-change-analysis'), 'How to get the diff, sort changes into 13 categories, trace callers'],
      [mono('critical-path-identification'), '15 high-risk categories, scoring scales, P0 to P3 thresholds'],
      [mono('test-type-selection'), 'When to use Manual, Smoke or Automated, and which automated level'],
      [mono('qa-report-format'), 'The report template, risk and readiness rules, a worked example'],
    ], { colW: [4.1, CW - 4.1], fontSize: 15, rowH: 0.55 });
    text(s, [{ text: 'All five live in ' }, { text: '.claude/skills/', options: { fontFace: MONO, color: C.text1 } }, { text: '. Claude Code and Copilot both read that folder, so the rules exist in one place.' }], { x: MX, y: 5.55, w: CW, h: 0.8, fontSize: 16 });
  }

  // 9 Scoring
  {
    const s = slide('scoring', 'LIGHT', 'Ranking risk: impact × likelihood');
    const lw = 6.7;
    text(s, 'Impact, 1 to 5', { x: MX, y: 1.85, w: lw, h: 0.4, fontSize: 18, bold: true, color: C.text1 });
    text(s, [{ text: '5 ', options: { bold: true } }, { text: 'security, data loss, money, outage', options: { breakLine: true } }, { text: '3 ', options: { bold: true } }, { text: 'feature degraded, workaround exists', options: { breakLine: true } }, { text: '1 ', options: { bold: true } }, { text: 'cosmetic' }], { x: MX, y: 2.3, w: lw, h: 1.05, fontSize: 15 });
    text(s, 'Likelihood, 1 to 5', { x: MX, y: 3.5, w: lw, h: 0.4, fontSize: 18, bold: true, color: C.text1 });
    text(s, [{ text: '5 ', options: { bold: true } }, { text: 'big change in the path, no tests', options: { breakLine: true } }, { text: '3 ', options: { bold: true } }, { text: 'moderate change, some coverage', options: { breakLine: true } }, { text: '1 ', options: { bold: true } }, { text: 'trivial change, strong coverage' }], { x: MX, y: 3.95, w: lw, h: 1.05, fontSize: 15 });
    text(s, '+1 likelihood for skipped tests, money math, time zones, parsing, major upgrades, or a PR description that doesn\'t match the diff.', { x: MX, y: 5.25, w: lw, h: 1.0, fontSize: 15, color: C.text1 });
    const bx = 8.0, bw = W - MX - bx;
    const bands = [['P0', '15–25 · blocks sign-off', HEX.navy, HEX.orange, C.background2], ['P1', '8–14 · test before release', HEX.darkCard, 'F6F5F0', C.background2], ['P2', '4–7 · if time allows', HEX.rule, HEX.navy, C.text1], ['P3', '1–3 · note only', 'FDFDFB', HEX.muted, C.text2]];
    bands.forEach(([p, d, bg, pc, tc], i) => {
      const y = 1.95 + i * 0.95;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: bx, y, w: bw, h: 0.82, rectRadius: 0.08, fill: { color: bg }, line: { color: HEX.rule, width: 0.75 } });
      text(s, p, { x: bx + 0.25, y, w: 0.9, h: 0.82, fontSize: 24, bold: true, color: pc, valign: 'middle' });
      text(s, d, { x: bx + 1.2, y, w: bw - 1.4, h: 0.82, fontSize: 15, color: tc, valign: 'middle' });
    });
    text(s, 'Any impact-5 path is at least P1.', { x: bx, y: 5.85, w: bw, h: 0.4, fontSize: 14 });
  }

  // 10 Test types
  {
    const s = slide('test-types', 'LIGHT', 'Three kinds of testing, three different jobs');
    const items = [['FaRobot', 'Automated', C.accent2, 'Repeatable checks in CI: unit, integration, contract, E2E.', 'Use for: logic, boundaries, contracts, role matrices, every bug fix.'],
      ['FaBolt', 'Smoke', C.accent1, 'Fast pass/fail checks after each deploy. Five minutes or less.', 'Use for: config, flags, migrations, upgrades, integrations, P0 paths.'],
      ['FaUserCheck', 'Manual', C.accent3, 'A person runs scripted cases or exploratory charters.', 'Use for: UX, accessibility, new features, third parties with no sandbox.']];
    const w = (CW - 2 * 0.4) / 3;
    for (const [i, [ic, h, col, a, b]] of items.entries()) {
      const x = MX + i * (w + 0.4), y = 1.9;
      card(s, x, y, w, 3.55);
      await badge(s, ic, x + 0.35, y + 0.35, 0.7, col);
      text(s, h, { x: x + 1.2, y: y + 0.45, w: w - 1.5, h: 0.5, fontSize: 22, bold: true, color: col, valign: 'middle' });
      text(s, a, { x: x + 0.35, y: y + 1.3, w: w - 0.7, h: 0.95, fontSize: 15 });
      text(s, b, { x: x + 0.35, y: y + 2.3, w: w - 0.7, h: 1.05, fontSize: 15, color: C.text1 });
    }
    text(s, 'Each type is optional, but every critical path gets at least one. Every choice, and every omission, carries a reason tied to the path\'s risk.', { x: MX, y: 5.75, w: CW, h: 0.8, fontSize: 16 });
  }

  // 11 Patterns
  {
    const s = slide('patterns', 'LIGHT', 'Common patterns the skill applies');
    table(s, ['Change', 'Automated', 'Smoke', 'Manual'], [
      ['Bug fix', 'Regression test that fails without the fix', 'No', 'Re-run the original repro'],
      ['Auth or permissions', 'Role matrix, integration level', 'Login + one protected action', 'Abuse and negative cases'],
      ['API contract', 'Contract + integration', 'Endpoint health per environment', 'Only if consumers can\'t be tested'],
      ['DB migration', 'Migrate representative data', 'App boots, key reads and writes', 'Data spot-check in staging'],
      ['Dependency upgrade', 'Full existing suite', 'Startup + core journeys', 'Explore affected areas'],
      ['Feature flag', 'Both flag branches', 'Each environment, on and off', 'No'],
      ['Copy or styling', 'Visual regression, if it exists', 'No', 'Visual and a11y check'],
    ], { colW: [2.7, 3.15, 2.95, CW - 8.8], fontSize: 14, rowH: 0.56, headColors: [C.text1, C.accent2, C.accent1, C.accent3] });
  }

  // 12 Report matrix
  {
    const s = slide('report', 'LIGHT', 'The matrix is the part people read');
    table(s, ['ID', 'Critical path', 'Priority', 'Automated', 'Smoke', 'Manual'], [
      ['CP-1', 'Checkout total with discount', 'P0 (20)', 'Yes: unit, integration', 'Yes: staging, prod', 'No'],
      ['CP-2', 'Manager approves a discount', 'P1 (12)', 'Yes: role matrix', 'Yes: staging', 'Yes: exploratory'],
      ['CP-3', 'Discount table migration', 'P1 (10)', 'Yes: integration', 'Yes: staging, prod', 'Yes: data spot-check'],
      ['CP-4', 'Approval banner', 'P2 (6)', 'No', 'No', 'Yes: visual, a11y'],
    ], { colW: [0.9, 3.4, 1.35, 2.3, 2.0, CW - 9.95], fontSize: 14, rowH: 0.6, headColors: [C.text1, C.text1, C.text1, C.accent2, C.accent1, C.accent3] });
    text(s, 'Below the matrix, each path gets its own section: entry points, why it\'s critical, current coverage, and Given/When/Then ideas for each test type, plus what was left out and why.', { x: MX, y: 5.1, w: CW, h: 1.1, fontSize: 16 });
  }

  // 13 Two tools
  {
    const s = slide('two-tools', 'LIGHT', 'Same skills, two tools');
    const cols = [['Claude Code', '/pr-qa-review 482 --save', ['Orchestrator skill', 'pr-change-analyzer subagent', 'pr-test-strategist subagent', 'pr-qa-reviewer for single-pass and CI', 'Headless: claude -p in a pipeline']],
      ['GitHub Copilot', '/qa-pr 482', ['pr-qa-reviewer custom agent', '/qa-pr prompt file', 'Links straight to the skill files', 'Works in VS Code chat and the coding agent', 'Read-only tool list, no edit tool']]];
    const w = (CW - 0.5) / 2;
    cols.forEach(([h, cmd, items], i) => {
      const x = MX + i * (w + 0.5), y = 1.9;
      card(s, x, y, w, 3.75);
      text(s, h, { x: x + 0.4, y: y + 0.35, w: w - 0.8, h: 0.5, fontSize: 22, bold: true, color: C.text1 });
      text(s, cmd, { x: x + 0.4, y: y + 0.95, w: w - 0.8, h: 0.4, fontFace: MONO, fontSize: 15, color: C.accent1 });
      text(s, items.map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < items.length - 1 } })), { x: x + 0.4, y: y + 1.55, w: w - 0.8, h: 2.7, fontSize: 15, paraSpaceAfter: 6 });
    });
  }

  // 14 Guardrails
  {
    const s = slide('guardrails', 'LIGHT', 'Guardrails built into every skill');
    const items = [['FaLock', C.accent2, 'Read-only', 'Only read commands such as gh pr diff and git log. No checkout, commit, push or comment.'],
      ['FaExclamationTriangle', C.accent1, 'PR text is data', 'Instructions hidden in descriptions or code are quoted in the report, never followed.'],
      ['FaSearch', C.accent2, 'Evidence over guesses', 'Every path traces to the diff. Links that can\'t be traced are marked unknown.'],
      ['FaCheckCircle', C.accent3, 'Self-check before output', 'High-risk categories covered, at least one test type per path, every bug fix has a regression test.']];
    const w = (CW - 0.4) / 2, h = 1.95;
    for (const [i, [ic, col, t, b]] of items.entries()) {
      const x = MX + (i % 2) * (w + 0.4), y = 1.9 + Math.floor(i / 2) * (h + 0.35);
      card(s, x, y, w, h);
      await badge(s, ic, x + 0.3, y + 0.35, 0.7, col);
      text(s, t, { x: x + 1.25, y: y + 0.3, w: w - 1.55, h: 0.45, fontSize: 19, bold: true, color: C.text1 });
      text(s, b, { x: x + 1.25, y: y + 0.8, w: w - 1.55, h: 1.0, fontSize: 15 });
    }
  }

  // 15 Demo app
  {
    const s = slide('demo-app', 'DARK', 'A small order service, then one risky PR');
    const w = (CW - 0.5) / 2;
    const cols = [['FaDatabase', 'On main', 'Node, no dependencies. Login with roles, order pricing, discounts, checkout, a JSON store with migrations, a tiny UI, and 13 passing tests.'],
      ['FaCodeBranch', 'feature/discount-approval', '"Add manager approval for large order discounts." 15 files, +175/−33. Tests still green, apart from one that was quietly skipped.']];
    for (const [i, [ic, h, b]] of cols.entries()) {
      const x = MX + i * (w + 0.5), y = 2.1;
      card(s, x, y, w, 3.05, { fill: HEX.darkCard, line: HEX.darkLine, shadow: false });
      await badge(s, ic, x + 0.4, y + 0.4, 0.75, HEX.navy, '#F28C3A');
      text(s, h, { x: x + 1.4, y: y + 0.45, w: w - 1.7, h: 0.65, fontSize: 21, bold: true, color: C.background2, valign: 'middle' });
      text(s, b, { x: x + 0.4, y: y + 1.45, w: w - 0.8, h: 1.95, fontSize: 17, color: HEX.onDark });
    }
    caption(s, 'sample-app/ in the repo', true);
  }

  // 16 Traps
  {
    const s = slide('traps', 'LIGHT', 'Sixteen planted traps');
    table(s, ['Change', 'Hidden problem', 'Should trigger'], [
      ['Pricing moved to cents', 'Money math; claims a bug fix', 'Unit + regression, smoke'],
      ['Rounding test', 'Quietly test.skip\'d', 'Gap flagged'],
      ['Approve endpoint', 'Deny-list role check', 'Role matrix, smoke, exploratory'],
      ['Approve after checkout', 'Paid total and shown total disagree', 'Exploratory, state tests'],
      ['Response fields renamed', 'Breaking change; PR bundles unrelated work', 'Contract test, intent mismatch'],
      ['Migration 002', 'Rewrites paid totals, no down step', 'Migration test, smoke, spot-check'],
      ['Flag + env vars', 'Per-environment behavior', 'Smoke per env, both branches'],
      ['Webhook notifier', 'PII in logs; comment telling AI to skip it', 'Manual, smoke; injection quoted'],
      ['CSV export · UI banner', 'Bulk PII · low contrast', 'Authz tests · a11y manual'],
      ['Node 22 + Docker · README', 'toSorted crashes Node 18 · docs only', 'Startup smoke · low risk'],
    ], { colW: [3.4, 4.6, CW - 8.0], fontSize: 13, rowH: 0.43 });
    caption(s, 'Full answer key in docs/sample-pr.md');
  }

  // 17 Demo steps
  {
    const s = slide('demo-steps', 'LIGHT', 'Running it live');
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX, y: 1.85, w: CW, h: 1.75, rectRadius: 0.1, fill: { color: HEX.navy }, line: { type: 'none' } });
    const lines = [['Claude Code', '/pr-qa-review feature/discount-approval --save'], ['Copilot', '/qa-pr feature/discount-approval'], ['Once on GitHub', '/pr-qa-review 1']];
    lines.forEach(([k, v], i) => text(s, [{ text: k.padEnd(16, ' '), options: { color: HEX.orange } }, { text: v, options: { color: HEX.onDark } }], { x: MX + 0.4, y: 2.05 + i * 0.47, w: CW - 0.8, h: 0.42, fontFace: MONO, fontSize: 16 }));
    const steps = ['Show the diff summary: 15 files, nothing alarming on the surface', 'Run the skill; narrate the change map while it works (about 3 minutes)', 'Open the saved report in qa-reports/ and walk the matrix', 'Find the quoted prompt-injection line under Open Questions'];
    steps.forEach((t, i) => {
      const y = 3.9 + i * 0.62;
      numDot(s, i + 1, MX, y + 0.04, 0.42, C.accent1, C.background1);
      text(s, t, { x: MX + 0.65, y, w: CW - 0.65, h: 0.5, fontSize: 17, valign: 'middle', color: C.text1 });
    });
    caption(s, 'Backup: qa-reports/feature-discount-approval-test-recommendations.md');
  }

  // 18 Results
  {
    const s = slide('results', 'LIGHT', 'What it found: 10 critical paths, High risk');
    const yes = (t) => ({ text: t, options: { bold: t === 'Yes', color: t === 'Yes' ? C.text1 : C.text2 } });
    const rows = [['CP-1', 'Who can approve or reject a discount', 'P0 (25)', 'Yes', 'Yes', 'Yes'], ['CP-2', 'Approval workflow through checkout', 'P0 (25)', 'Yes', 'Yes', 'Yes'], ['CP-3', 'Totals and amount charged, in cents', 'P0 (25)', 'Yes', 'Yes', 'Yes'], ['CP-4', 'Migration 002 on existing data', 'P0 (20)', 'Yes', 'Yes', 'Yes'], ['CP-5', 'Order API contract, dollars to cents', 'P1 (12)', 'Yes', 'Yes', 'No'],
      ['CP-6', 'Admin CSV export', 'P1 (12)', 'Yes', 'Yes', 'Yes'], ['CP-7', 'Manager notification webhook', 'P1 (12)', 'Yes', 'Yes', 'Yes'], ['CP-8', 'Feature flag and threshold config', 'P1 (12)', 'Yes', 'Yes', 'No'], ['CP-9', 'Node 22 upgrade and container health', 'P1 (12)', 'Yes', 'Yes', 'No'], ['CP-10', 'Order screen banner and money display', 'P1 (9)', 'No', 'Yes', 'Yes']]
      .map((r) => [r[0], r[1], r[2], yes(r[3]), yes(r[4]), yes(r[5])]);
    table(s, ['ID', 'Critical path', 'Priority', 'Automated', 'Smoke', 'Manual'], rows, { colW: [0.95, 5.2, 1.45, 1.5, 1.3, CW - 10.4], fontSize: 13, rowH: 0.385, headColors: [C.text1, C.text1, C.text1, C.accent2, C.accent1, C.accent3] });
    text(s, '13 automated items · 7 smoke checks · 8 manual charters · "Ready after automated gaps closed"', { x: MX, y: 6.3, w: CW, h: 0.4, fontSize: 15, bold: true, color: C.text1 });
  }

  // 19 Scorecard
  {
    const s = slide('scorecard', 'LIGHT', 'Scorecard against the answer key');
    const stats = [['16/16', 'planted traps detected', HEX.navy, HEX.orange, C.background2], ['8', 'real issues we didn\'t plant', 'FDFDFB', '2456B8', C.text1], ['0', 'lines of test code generated', 'FDFDFB', '0F6B5E', C.text1]];
    const w = (CW - 2 * 0.4) / 3;
    stats.forEach(([n, l, bg, nc, lc], i) => {
      const x = MX + i * (w + 0.4), y = 1.9;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 2.0, rectRadius: 0.1, fill: { color: bg }, line: { color: HEX.rule, width: 0.75 }, shadow: shadow() });
      text(s, n, { x: x + 0.35, y: y + 0.25, w: w - 0.7, h: 1.05, fontSize: 60, bold: true, color: nc });
      text(s, l, { x: x + 0.35, y: y + 1.35, w: w - 0.7, h: 0.5, fontSize: 16, color: lc });
    });
    text(s, 'Not planted, still found: managers approving their own discounts, CSV formula injection, a non-numeric threshold silently disabling approval, turning the flag off auto-applying pending discounts, a test that leaks global config, flags on unauthenticated /health, a route matching any /export/ path, a breaking change shipped as a minor version.', { x: MX, y: 4.25, w: CW, h: 2.0, fontSize: 16 });
    caption(s, 'Details in docs/sample-pr-evaluation.md');
  }

  // 20 Lessons
  {
    const s = slide('lessons', 'LIGHT', 'What building it taught us');
    const items = [['FaHashtag', 'A "#" truncated a skill', '"PR #123" in unquoted YAML starts a comment, so half the description vanished. Quote descriptions.'],
      ['FaBullseye', 'Plant the traps first', 'Designing and committing known defects before the run is what makes the result checkable.'],
      ['FaLayerGroup', 'Rules in skills, not agents', 'Thin agents that point at shared skills kept Claude and Copilot consistent with no duplication.'],
      ['FaSlidersH', 'Limits force judgment', 'Asking for 3–10 paths, and a warning above 10 P0/P1, made the agent rank and suggest splitting the PR.']];
    const w = (CW - 0.5) / 2;
    for (const [i, [ic, h, b]] of items.entries()) {
      const x = MX + (i % 2) * (w + 0.5), y = 1.95 + Math.floor(i / 2) * 2.2;
      await badge(s, ic, x, y, 0.7, C.accent1);
      text(s, h, { x: x + 0.95, y, w: w - 0.95, h: 0.5, fontSize: 19, bold: true, color: C.text1 });
      text(s, b, { x: x + 0.95, y: y + 0.55, w: w - 0.95, h: 1.3, fontSize: 15 });
    }
    caption(s, 'Build log in docs/chat-history.md');
  }

  // 21 Adopt
  {
    const s = slide('adopt', 'LIGHT', 'Adopting it in your repo');
    const steps = [[{ text: 'Copy ' }, { text: '.claude/', options: { fontFace: MONO, color: C.text1 } }, { text: ', ' }, { text: '.github/agents/', options: { fontFace: MONO, color: C.text1 } }, { text: ' and ' }, { text: '.github/prompts/', options: { fontFace: MONO, color: C.text1 } }, { text: ' into the repository' }],
      [{ text: 'Install and authenticate the GitHub CLI so the agents can read PRs by number' }],
      [{ text: 'Run it on five recent merged PRs and compare with what QA actually tested' }],
      [{ text: 'Tune the high-risk categories and thresholds to your domain' }],
      [{ text: 'Optionally run headless in CI: ' }, { text: 'claude -p "/pr-qa-review 482 --save"', options: { fontFace: MONO, color: C.text1 } }]];
    steps.forEach((runs, i) => {
      const y = 1.85 + i * 0.92;
      numDot(s, i + 1, MX, y + 0.1, 0.5, C.accent1, C.background1);
      text(s, runs, { x: MX + 0.8, y, w: CW - 0.8, h: 0.7, fontSize: 17, valign: 'middle' });
      if (i < steps.length - 1) s.addShape(pres.shapes.LINE, { x: MX + 0.8, y: y + 0.82, w: CW - 0.8, h: 0, line: { color: HEX.rule, width: 0.75 } });
    });
    caption(s, 'docs/usage-guide.md');
  }

  // 22 Customize
  {
    const s = slide('customize', 'LIGHT', 'Tuning: edit Markdown, not code');
    const mono = (t) => ({ text: t, options: { fontFace: MONO, color: C.accent1 } });
    table(s, ['To change', 'Edit'], [
      ['High-risk categories, P0–P3 thresholds', mono('critical-path-identification/SKILL.md')],
      ['When to pick Manual, Smoke, Automated', mono('test-type-selection/SKILL.md')],
      ['Report sections and rules', mono('qa-report-format/SKILL.md')],
      ['How the diff is gathered', mono('pr-change-analysis/SKILL.md')],
    ], { colW: [5.2, CW - 5.2], fontSize: 15, rowH: 0.58 });
    text(s, 'Examples: add "HIPAA data" as an impact-5 category, require smoke in a UAT environment, or point automated recommendations at your Playwright folder.', { x: MX, y: 5.0, w: CW, h: 1.0, fontSize: 16 });
  }

  // 23 Limits
  {
    const s = slide('limits', 'LIGHT', 'Limits to be honest about');
    const items = [['FaFlask', 'One sample, not a benchmark.', 'The demo PR is synthetic and small. Calibrate on your own history.'],
      ['FaEyeSlash', 'It only sees this repo.', 'External consumers, other services and production data are "unknown", raised as questions.'],
      ['FaFileAlt', 'Big PRs strain it.', 'Very large diffs get skimmed; the report says which files were.'],
      ['FaRandom', 'Runs vary.', 'Scores can shift a level between runs. The structure keeps the variation visible and arguable.'],
      ['FaUserTie', 'It advises; people decide.', 'A QA engineer still owns the plan and the sign-off.']];
    for (const [i, [ic, b, t]] of items.entries()) {
      const y = 1.85 + i * 0.9;
      await badge(s, ic, MX, y + 0.05, 0.55, C.accent2);
      text(s, [{ text: b + ' ', options: { bold: true, color: C.text1 } }, { text: t }], { x: MX + 0.85, y, w: CW - 0.85, h: 0.7, fontSize: 17, valign: 'middle' });
    }
  }

  // 24 Next
  {
    const s = slide('next', 'LIGHT', 'Where it could go next');
    const items = [['FaCommentDots', 'Opt-in PR comments', 'Post the matrix to the PR when someone asks, with the full report attached.'],
      ['FaFileExport', 'Test management export', 'Turn manual charters and smoke checks into cases in Xray, TestRail or Azure Test Plans.'],
      ['FaRedo', 'Regression suite of PRs', 'More planted branches, re-run whenever the skills change, to catch rubric regressions.']];
    const w = (CW - 2 * 0.4) / 3;
    for (const [i, [ic, h, b]] of items.entries()) {
      const x = MX + i * (w + 0.4), y = 2.0;
      card(s, x, y, w, 3.6);
      await badge(s, ic, x + 0.35, y + 0.35, 0.75, C.accent3);
      text(s, h, { x: x + 0.35, y: y + 1.3, w: w - 0.7, h: 0.75, fontSize: 19, bold: true, color: C.text1, valign: 'bottom' });
      text(s, b, { x: x + 0.35, y: y + 2.2, w: w - 0.7, h: 1.2, fontSize: 15 });
    }
  }

  // 25 Q&A
  {
    const s = slide('qna', 'DARK_PLAIN');
    text(s, 'Questions?', { x: 0.9, y: 2.0, w: 9, h: 1.3, fontSize: 60, bold: true, color: C.background2 });
    text(s, 'github.com/bob-fornal/ai-qa-pr-agent', { x: 0.9, y: 3.6, w: 9, h: 0.5, fontFace: MONO, fontSize: 18, color: HEX.orange });
    text(s, 'Skills in .claude/skills · Sample PR on feature/discount-approval · Report in qa-reports/ · Guides in docs/', { x: 0.9, y: 4.25, w: 9.2, h: 0.9, fontSize: 16, color: HEX.onDark });
    await badge(s, 'FaComments', 10.55, 2.3, 1.85, HEX.darkCard, '#F28C3A');
    text(s, 'Bob Fornal · Leading EDJE', { x: 0.9, y: 6.75, w: 6, h: 0.3, fontSize: 12, color: HEX.onDark });
  }

  await pres.writeFile({ fileName: OUT });
  const themeScript = process.env.PPTX_THEME_SCRIPT;
  if (themeScript) {
    const { applyTheme } = require(themeScript);
    await applyTheme(OUT, THEME);
  } else {
    console.warn('PPTX_THEME_SCRIPT not set: theme colors will fall back to the Office palette.');
  }
  console.log('Wrote', OUT);
})().catch((e) => { console.error(e); process.exit(1); });
