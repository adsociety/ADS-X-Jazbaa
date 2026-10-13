(function () {
  'use strict';
  var D = window.QuizData, S = window.QuizScoring;
  var $ = function (id) { return document.getElementById(id); };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var N = D.questions.length;
  var NS = 'http://www.w3.org/2000/svg';

  var answers, current, locked, advanceTimer, revealTimers = [], lastResult = null;

  /* ---------- helpers ---------- */
  function el(tag, props, kids) {
    var n = document.createElement(tag);
    for (var k in props || {}) {
      if (k === 'class') n.className = props[k];
      else if (k === 'text') n.textContent = props[k];
      else n.setAttribute(k, props[k]);
    }
    (kids || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }
  function svg(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs || {}) n.setAttribute(k, attrs[k]);
    return n;
  }
  function later(fn, ms) { var t = setTimeout(fn, ms); revealTimers.push(t); return t; }
  function clearTimers() {
    clearTimeout(advanceTimer);
    revealTimers.forEach(clearTimeout); revealTimers = [];
  }
  function show(name, focusEl) {
    ['landing', 'quiz', 'reveal', 'result'].forEach(function (s) { $(s).hidden = s !== name; });
    document.body.dataset.screen = name;
    window.scrollTo(0, 0);
    if (focusEl) focusEl.focus({ preventScroll: true });
  }
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  /* ---------- state ---------- */
  function reset() {
    clearTimers();
    answers = new Array(N).fill(null);
    current = 0; locked = false; lastResult = null;
    document.body.classList.remove('themed');
    document.body.removeAttribute('data-theme');
    ['main', 'on', 'dark', 'tint', 'tint-ink', 'btn', 'btn-ink'].forEach(function (k) {
      document.documentElement.style.removeProperty('--r-' + k);
    });
    $('themeColor').setAttribute('content', '#1C1850');
  }

  /* ---------- landing ---------- */
  function initLanding() {
    var h1 = $('landingTitle');
    h1.textContent = '';
    // “What's Your Navratri Colour?” with the key word highlighted
    h1.appendChild(document.createTextNode("What's Your "));
    h1.appendChild(el('em', { text: 'Navratri Colour' }));
    h1.appendChild(document.createTextNode('?'));
    $('hook').textContent = D.site.hook;
    $('credit').textContent = D.site.credit;
    $('credit2').textContent = D.site.credit;
    // desktop-only decorative ring of the seven colours
    var art = $('landingArt');
    D.colours.forEach(function (c, i) {
      var d = el('span', { class: 'art-dot' });
      d.style.background = c.theme.swatch;
      d.style.transform = 'rotate(' + (i * 360 / D.colours.length) + 'deg) translateY(-150px)';
      art.appendChild(d);
    });
    art.appendChild(el('span', { class: 'art-core' }));
    var p = $('progress');
    for (var i = 0; i < N; i++) p.appendChild(el('li'));
  }

  /* ---------- questions ---------- */
  function renderQuestion() {
    var q = D.questions[current];
    locked = false;
    $('qcount').textContent = 'Question ' + (current + 1) + ' of ' + N;
    $('progress').setAttribute('aria-label', 'Question ' + (current + 1) + ' of ' + N);
    Array.prototype.forEach.call($('progress').children, function (li, i) {
      li.className = answers[i] !== null && i < current ? 'done' : (i === current ? 'now' : '');
    });
    var qt = $('qtext'); qt.textContent = q.text;
    var box = $('answers'); box.textContent = '';
    q.options.forEach(function (o, i) {
      var b = el('button', { type: 'button', class: 'answer slide-in', 'aria-pressed': answers[current] === i ? 'true' : 'false', text: o.text });
      if (answers[current] === i) b.classList.add('selected');
      b.style.animationDelay = (i * 45) + 'ms';
      b.addEventListener('click', function () { choose(i, b); });
      box.appendChild(b);
    });
    qt.classList.remove('slide-in'); void qt.offsetWidth; qt.classList.add('slide-in');
  }
  function choose(i, btn) {
    if (locked) return;
    locked = true;
    answers[current] = i;
    Array.prototype.forEach.call($('answers').children, function (b) { b.classList.remove('selected'); b.setAttribute('aria-pressed', 'false'); });
    btn.classList.add('selected'); btn.setAttribute('aria-pressed', 'true');
    advanceTimer = setTimeout(function () {
      if (current < N - 1) { current++; renderQuestion(); $('qtext').focus({ preventScroll: true }); }
      else startReveal();
    }, 250);
  }
  function back() {
    clearTimeout(advanceTimer);
    if (current === 0) { show('landing', $('startBtn')); return; }
    current--;
    renderQuestion();
    $('qtext').focus({ preventScroll: true });
  }
  function start() {
    reset();
    show('quiz');
    renderQuestion();
    $('qtext').focus({ preventScroll: true });
  }

  /* ---------- reveal ---------- */
  function startReveal() {
    var res = S.score(answers);   // always recomputed from stored answers
    lastResult = res;
    show('reveal');
    $('revealCalc').hidden = false; $('revealLine').hidden = true;

    var ring = $('ring'); ring.textContent = ''; ring.classList.remove('settled'); ring.style.transition = 'none'; ring.style.transform = 'rotate(0deg)';
    var R = 84, cnt = D.colours.length;
    D.colours.forEach(function (c, i) {
      var a = i * 360 / cnt;
      var pos = 'rotate(' + a + 'deg) translateY(-' + R + 'px)';
      var d = el('span', { class: 'rdot' + (i === res.index ? ' win' : '') });
      d.style.background = c.theme.swatch;
      d.style.transform = pos;
      d.style.setProperty('--pos', pos);
      ring.appendChild(d);
    });
    var winAngle = res.index * 360 / cnt;
    var spinMs = reduced ? 500 : 1500;
    void ring.offsetWidth;
    if (!reduced) {
      ring.style.transition = 'transform 1.5s cubic-bezier(.15,.75,.2,1)';
      ring.style.transform = 'rotate(' + (720 - winAngle) + 'deg)'; // winner lands at the top
    } else {
      ring.style.transform = 'rotate(' + (-winAngle) + 'deg)';
    }
    later(function () {
      ring.classList.add('settled');
      $('revealCalc').hidden = true;
      $('revealName').textContent = res.colour.name.toUpperCase();
      $('revealLine').hidden = false;
    }, spinMs);
    later(function () { showResult(res); }, spinMs + (reduced ? 900 : 1500));
  }

  /* ---------- result ---------- */
  function silhouette(kind) {
    var s = svg('svg', { viewBox: '0 0 100 130', 'aria-hidden': 'true', fill: 'currentColor' });
    if (kind === 'her') { // choli + flared ghagra
      s.appendChild(svg('circle', { cx: 50, cy: 14, r: 10 }));
      s.appendChild(svg('path', { d: 'M40 28 L60 28 L63 52 L37 52 Z' }));
      s.appendChild(svg('path', { d: 'M37 52 L63 52 L96 126 Q50 134 4 126 Z' }));
      s.appendChild(svg('path', { d: 'M61 30 Q86 52 82 92 L78 92 Q80 56 58 36 Z', opacity: '.55' })); // dupatta
    } else { // kurta
      s.appendChild(svg('circle', { cx: 50, cy: 14, r: 10 }));
      s.appendChild(svg('path', { d: 'M36 28 L64 28 L84 36 L90 80 L80 82 L74 52 L72 100 L28 100 L26 52 L20 82 L10 80 L16 36 Z' }));
      s.appendChild(svg('path', { d: 'M30 100 L48 100 L46 128 L32 128 Z M52 100 L70 100 L68 128 L54 128 Z', opacity: '.7' }));
    }
    return s;
  }
  function outfit(c, who) {
    var label = who === 'her' ? 'For her' : 'For him';
    var text = c[who];
    var frame = el('div', { class: 'frame' });
    frame.appendChild(el('div', { class: 'fallback' }, [silhouette(who)]));
    var img = el('img', { src: 'images/' + c.key + '-' + who + '.jpg', alt: c.name + ' Navratri outfit ' + label.toLowerCase() + ': ' + text, loading: 'lazy', decoding: 'async' });
    img.addEventListener('error', function () { img.remove(); }); // fallback stays visible
    frame.appendChild(img);
    return el('figure', { class: 'outfit' }, [el('p', { class: 'outfit-label', text: label }), frame, el('figcaption', { text: text })]);
  }
  function chart(res) {
    var W = 300, P = 34, size = W - P * 2, RANGE = 2;
    var x = function (e) { return P + (Math.max(-RANGE, Math.min(RANGE, e)) + RANGE) / (2 * RANGE) * size; };
    var y = function (v) { return P + (RANGE - Math.max(-RANGE, Math.min(RANGE, v))) / (2 * RANGE) * size; };
    var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + W, role: 'img',
      'aria-label': 'Chart: you landed ' + (res.e >= 0 ? 'loud' : 'calm') + ' and ' + (res.v >= 0 ? 'playful' : 'classic') + ', closest to ' + res.colour.name });
    s.appendChild(svg('rect', { x: P, y: P, width: size, height: size, rx: 14, fill: 'none', stroke: 'currentColor', 'stroke-opacity': '.25', 'stroke-width': 2 }));
    s.appendChild(svg('line', { x1: P, y1: W / 2, x2: W - P, y2: W / 2, stroke: 'currentColor', 'stroke-opacity': '.25', 'stroke-dasharray': '3 5' }));
    s.appendChild(svg('line', { x1: W / 2, y1: P, x2: W / 2, y2: W - P, stroke: 'currentColor', 'stroke-opacity': '.25', 'stroke-dasharray': '3 5' }));
    function label(t, ax, ay, anchor, rot) {
      var tx = svg('text', { x: ax, y: ay, 'text-anchor': anchor, 'font-size': 12, 'font-weight': 700, 'letter-spacing': '.08em' });
      if (rot) tx.setAttribute('transform', 'rotate(' + rot + ' ' + ax + ' ' + ay + ')');
      tx.textContent = t; s.appendChild(tx);
    }
    label('CALM', P, W - 10, 'start'); label('LOUD', W - P, W - 10, 'end');
    label('CLASSIC', 14, W - P, 'start', -90); label('PLAYFUL', 14, P, 'end', -90);
    D.colours.forEach(function (c, i) {
      var win = i === res.index;
      s.appendChild(svg('circle', { cx: x(c.e), cy: y(c.v), r: win ? 11 : 8, fill: c.theme.swatch, stroke: 'currentColor', 'stroke-opacity': win ? '.9' : '.45', 'stroke-width': win ? 2.5 : 1.5 }));
      var nm = svg('title'); nm.textContent = c.name; s.lastChild.appendChild(nm);
    });
    var px = x(res.e), py = y(res.v);
    s.appendChild(svg('circle', { cx: px, cy: py, r: 17, fill: 'none', stroke: 'var(--r-dark)', 'stroke-width': 3 }));
    s.appendChild(svg('circle', { cx: px, cy: py, r: 4, fill: 'var(--r-dark)' }));
    var you = svg('text', { x: px, y: py < P + 30 ? py + 34 : py - 22, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 800 });
    you.style.fill = 'var(--r-dark)'; you.textContent = 'YOU'; s.appendChild(you);
    var box = $('chart'); box.textContent = ''; box.appendChild(s);
    // legend (desktop only): which dot is which colour
    var lg = el('div', { class: 'legend' }, [el('p', { class: 'legend-note', text: 'Left to right runs calm to loud; bottom to top runs classic to playful. The ringed dot is you.' })]);
    var ul = el('ul');
    D.colours.forEach(function (c, i) {
      var li = el('li', { class: i === res.index ? 'me' : '' });
      var sw = el('span', { class: 'sw' }); sw.style.background = c.theme.swatch;
      li.appendChild(sw); li.appendChild(el('b', { text: c.name })); li.appendChild(el('em', { text: c.headline }));
      ul.appendChild(li);
    });
    lg.appendChild(ul); box.appendChild(lg);
  }
  function showResult(res) {
    var c = res.colour, t = c.theme, root = document.documentElement.style;
    root.setProperty('--r-main', t.main); root.setProperty('--r-on', t.onMain);
    root.setProperty('--r-dark', t.dark); root.setProperty('--r-tint', t.tint);
    root.setProperty('--r-tint-ink', t.tintInk);
    root.setProperty('--r-btn', t.btn || t.dark); root.setProperty('--r-btn-ink', t.btnInk || '#FFFFFF');
    document.body.classList.add('themed'); document.body.dataset.theme = c.key;
    $('themeColor').setAttribute('content', t.main);

    $('resName').textContent = c.name;
    $('resHeadline').textContent = c.headline;
    $('resBlurb').textContent = c.blurb;
    var o = $('outfits'); o.textContent = '';
    o.appendChild(outfit(c, 'her')); o.appendChild(outfit(c, 'him'));
    chart(res);
    show('result', $('resName'));
  }

  /* ---------- share ---------- */
  function share() {
    if (!lastResult) return;
    var c = lastResult.colour;
    var url = D.site.shareUrl || location.href.split('#')[0];
    var text = 'My Navratri colour is ' + c.name.toUpperCase() + ' — ' + c.headline + '! What’s yours?';
    if (navigator.share) {
      navigator.share({ title: D.site.title, text: text, url: url }).catch(function (e) { if (e && e.name !== 'AbortError') copy(text + ' ' + url); });
    } else copy(text + ' ' + url);
  }
  function copy(str) {
    function ok() { toast('Copied! Paste it anywhere to share.'); }
    function fail() { toast('Couldn’t copy — long-press the page URL to share.'); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(str).then(ok, legacy);
    else legacy();
    function legacy() {
      try {
        var ta = el('textarea', { 'aria-hidden': 'true' }); ta.value = str; ta.style.cssText = 'position:fixed;opacity:0;top:0';
        document.body.appendChild(ta); ta.select(); var done = document.execCommand('copy'); ta.remove();
        done ? ok() : fail();
      } catch (e) { fail(); }
    }
  }

  /* ---------- boot ---------- */
  reset();
  initLanding();
  $('startBtn').addEventListener('click', start);
  $('backBtn').addEventListener('click', back);
  $('shareBtn').addEventListener('click', share);
  $('againBtn').addEventListener('click', function () { reset(); show('landing', $('startBtn')); });
})();
