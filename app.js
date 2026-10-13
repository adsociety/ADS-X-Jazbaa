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

  /* ---------- society logos ---------- */
  function logoMark(soc) {
    var w = el('span', { class: 'logo', 'aria-hidden': 'true' }, [el('span', { class: 'logo-ph', text: soc.short })]);
    if (soc.logo) {
      var img = el('img', { src: soc.logo, alt: '', decoding: 'async' });
      img.addEventListener('load', function () { w.classList.add('has-img'); });
      img.addEventListener('error', function () { img.remove(); }); // placeholder badge stays
      w.appendChild(img);
    }
    return w;
  }

  /* ---------- state ---------- */
  function reset() {
    clearTimers();
    answers = new Array(N).fill(null);
    var ld = $('loader'); if (ld) { ld.hidden = true; ld.classList.remove('run', 'out'); }
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
    // ADS X Jazbaa lockup on every screen (placeholder badges until logos are supplied)
    Array.prototype.forEach.call(document.querySelectorAll('.brand'), function (b) {
      b.setAttribute('aria-label', D.site.societies.map(function (s) { return s.name; }).join(' and '));
      b.appendChild(logoMark(D.site.societies[0]));
      b.appendChild(el('span', { text: D.site.credit }));
      b.appendChild(logoMark(D.site.societies[1]));
    });
    // landing garba circle: seven colours + a ring of tiny mirror dots
    var orbit = $('gOrbit'), inner = $('gInner');
    D.colours.forEach(function (c, i) {
      var d = el('i'); d.style.background = c.theme.swatch; d.style.setProperty('--a', (i * 360 / D.colours.length) + 'deg'); orbit.appendChild(d);
    });
    for (var m = 0; m < 14; m++) { var t = el('i'); t.style.setProperty('--a', (m * 360 / 14) + 'deg'); inner.appendChild(t); }
    var p = $('progress');
    for (var i = 0; i < N; i++) p.appendChild(el('li'));
  }

  /* ---------- questions ---------- */
  function renderQuestion() {
    var q = D.questions[current];
    locked = false;
    var qc = $('qcount'); qc.textContent = '';
    qc.setAttribute('aria-label', 'Question ' + (current + 1) + ' of ' + N);
    qc.appendChild(el('b', { text: String(current + 1) })); qc.appendChild(el('small', { text: 'of ' + N }));
    qc.classList.remove('pop'); void qc.offsetWidth; qc.classList.add('pop');
    $('progress').setAttribute('aria-label', 'Question ' + (current + 1) + ' of ' + N);
    Array.prototype.forEach.call($('progress').children, function (li, i) {
      li.className = answers[i] !== null && i < current ? 'done' : (i === current ? 'now' : '');
    });
    var qt = $('qtext'); qt.textContent = q.text;
    var box = $('answers'); box.textContent = '';
    q.options.forEach(function (o, i) {
      var b = el('button', { type: 'button', class: 'answer slide-in', 'aria-pressed': answers[current] === i ? 'true' : 'false' });
      b.appendChild(el('span', { class: 'atext', text: o.text }));
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
  function buildLoader() {
    var rows = D.site.loaderRows, W = 400;
    // [font size, text length, x, gradient] per row; lengthAdjust makes every row fill the width
    var spec = [[150, 400, 0, 0], [220, 400, 0, 1], [138, 400, 0, 2], [150, 100, 150, 3], [150, 400, 0, 4]];
    var y = 14, gap = 12, out = '';
    rows.forEach(function (t, i) {
      var sp = spec[i] || spec[0], cap = sp[0] * 0.86;
      y += cap;
      out += '<g class="row" style="--i:' + i + '"><text x="' + sp[2] + '" y="' + y + '" font-family="Anton, Impact, sans-serif" font-size="' + sp[0] +
        '" textLength="' + sp[1] + '" lengthAdjust="spacingAndGlyphs" fill="url(#lg' + sp[3] + ')" stroke="#0B130B" stroke-width="1.6" paint-order="stroke">' + t + '</text></g>';
      sp.y = y; y += gap;
    });
    var ghost = '';
    rows.forEach(function (t, i) {
      var sp = spec[i] || spec[0];
      ghost += '<g class="row" style="--i:' + (i + 2) + '"><text x="' + sp[2] + '" y="' + sp.y + '" font-family="Anton, Impact, sans-serif" font-size="' + sp[0] +
        '" textLength="' + sp[1] + '" lengthAdjust="spacingAndGlyphs" fill="none" stroke="#F4F1E6" stroke-opacity=".3" stroke-width="1.6">' + t + '</text></g>';
    });
    var vb = '0 0 400 ' + Math.ceil(y);
    var xRow = spec[3].y, r3 = spec[2].y;
    function top(i) { return spec[i].y - spec[i][0] * 0.86; }
    function grad(id, x1, y1, x2, y2, stops, dx) {
      return '<linearGradient id="lg' + id + '" gradientUnits="userSpaceOnUse" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" spreadMethod="reflect">' +
        stops.map(function (s, k) { return '<stop offset="' + (k / (stops.length - 1)) + '" stop-color="' + s + '"/>'; }).join('') +
        '<animateTransform attributeName="gradientTransform" type="translate" values="0 0;' + dx + ' 0" dur="2.8s" repeatCount="indefinite"/></linearGradient>';
    }
    var defs = '<defs>' +
      grad(0, 0, top(0), 400, spec[0].y, ['#00D1FF', '#0A5CFF', '#8CF7FF', '#0A5CFF'], -160) +
      grad(1, 0, top(1), 400, spec[1].y, ['#FFE08A', '#FF9A3C', '#FF4F7B', '#7A3CFF'], 150) +
      grad(2, 0, top(2), 400, spec[2].y, ['#6EE7FF', '#1CA7C9', '#F2FEFF', '#0EA5B7'], -170) +
      grad(3, 150, top(3), 250, spec[3].y, ['#FFB3D9', '#FF7EB6', '#FFD1E8'], 60) +
      grad(4, 0, top(4), 400, spec[4].y, ['#FF9A3C', '#FF4F7B', '#0A5CFF', '#00D1FF'], -150) + '</defs>';
    var ink = '#0E1A0E', paper = '#F4F1E6', pink = '#FFB3D9';
    function badge(cx, cy, r, inner) { return '<g class="badge" transform="translate(' + cx + ' ' + cy + ') scale(' + r / 36 + ')"><g class="spinner">' + inner + '</g></g>'; }
    var planet = '<circle r="36" fill="' + ink + '" stroke="' + paper + '" stroke-width="3"/><ellipse rx="30" ry="11" transform="rotate(-24)" fill="none" stroke="' + paper + '" stroke-width="2"/>' +
      '<circle r="11" fill="' + pink + '"/><circle cx="-27" cy="7" r="3.4" fill="' + paper + '"/><circle cx="26" cy="-12" r="3.4" fill="' + paper + '"/>';
    var face = '<circle r="36" fill="' + pink + '" stroke="' + ink + '" stroke-width="3"/><circle cx="-11" cy="-5" r="3.8" fill="' + ink + '"/><circle cx="11" cy="-5" r="3.8" fill="' + ink + '"/>' +
      '<path d="M-12 8 Q0 20 12 8" fill="none" stroke="' + ink + '" stroke-width="3.2" stroke-linecap="round"/>';
    var reticle = '<circle r="36" fill="' + ink + '" stroke="' + paper + '" stroke-width="3"/><circle r="20" fill="none" stroke="' + paper + '" stroke-width="2"/>' +
      '<path d="M-36 0H-8M8 0H36M0 -36V-8M0 8V36" stroke="' + paper + '" stroke-width="2"/><circle r="3" fill="' + pink + '"/>';
    var badges = badge(70, xRow - 64, 38, reticle) + badge(330, xRow - 64, 38, face) + badge(364, r3 - 104, 28, planet);
    var vines = ['M-30 120 C 90 30, 150 230, 250 160 S 390 60, 440 190', 'M-30 520 C 80 610, 170 430, 270 520 S 390 650, 440 560', 'M440 330 C 340 360, 310 270, 210 340 S 70 420, -30 340']
      .map(function (d, k) {
        var w = [24, 22, 14][k];
        return '<g class="vine"><path d="' + d + '" fill="none" stroke="url(#chrome)" stroke-width="' + w + '" stroke-linecap="round"/>' +
          '<path d="' + d + '" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="' + (w * 0.2) + '" stroke-linecap="round" transform="translate(-3 -4)"/>' +
          '<path d="' + d + '" fill="none" stroke="#04210E" stroke-opacity=".45" stroke-width="' + (w * 0.25) + '" stroke-linecap="round" transform="translate(4 5)"/></g>';
      }).join('');
    var vdefs = '<defs><linearGradient id="chrome" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="400" y2="' + Math.ceil(y) + '">' +
      '<stop offset="0" stop-color="#0B3D1E"/><stop offset=".18" stop-color="#7CFF4F"/><stop offset=".3" stop-color="#EAFFD6"/><stop offset=".45" stop-color="#2FBF3A"/>' +
      '<stop offset=".6" stop-color="#0A2E16"/><stop offset=".78" stop-color="#9DFF6A"/><stop offset="1" stop-color="#1F7A34"/></linearGradient>' +
      '<filter id="warp" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".01 .02" numOctaves="2" seed="4" result="n">' +
      '<animate attributeName="baseFrequency" values=".008 .018;.013 .028;.008 .018" dur="5s" repeatCount="indefinite"/></feTurbulence>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="26"/></filter></defs>';
    var box = el('div', { class: 'loader', id: 'loader', role: 'status', 'aria-label': 'Calculating your Navratri colour. ' + rows.join(' ') });
    box.hidden = true;
    var ghostSvg = '<svg class="loader-type ghost" viewBox="' + vb + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + ghost + '</svg>';
    box.innerHTML = '<div class="loader-halftone"></div>' + ghostSvg +
      '<svg class="loader-type" viewBox="0 0 400 ' + Math.ceil(y) + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + defs + out + badges + '</svg>' +
      '<svg class="loader-vines" viewBox="0 0 400 ' + Math.ceil(y) + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + vdefs + '<g filter="url(#warp)">' + vines + '</g></svg>' + ghostSvg;
    $('shell').appendChild(box);
  }

  function startReveal() {
    var res = S.score(answers);   // always recomputed from stored answers
    lastResult = res;
    show('reveal');
    $('revealLine').classList.remove('show');
    var wrap = $('ringWrap'); wrap.style.visibility = 'hidden';

    var ring = $('ring'); ring.textContent = ''; ring.classList.remove('settled'); ring.style.transition = 'none'; ring.style.transform = 'rotate(0deg)';
    var R = 102, cnt = D.colours.length;
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

    // 1. kinetic-type loader (about 2.5s), 2. wipe out to the colour ring, 3. name line, 4. result
    var loader = $('loader');
    loader.classList.remove('out', 'run'); loader.hidden = false; void loader.offsetWidth; loader.classList.add('run');
    var LOAD = reduced ? 900 : 2500, SPIN = reduced ? 400 : 1200;
    later(function () {
      loader.classList.add('out');
      wrap.style.visibility = 'visible';
      void ring.offsetWidth;
      if (!reduced) {
        ring.style.transition = 'transform ' + SPIN + 'ms cubic-bezier(.15,.75,.2,1)';
        ring.style.transform = 'rotate(' + (720 - winAngle) + 'deg)'; // winner lands at the top
      } else {
        ring.style.transform = 'rotate(' + (-winAngle) + 'deg)';
      }
    }, LOAD);
    later(function () { loader.hidden = true; }, LOAD + 600);
    later(function () {
      ring.classList.add('settled');
      $('revealName').textContent = res.colour.name.toUpperCase();
      $('revealLine').classList.add('show');
    }, LOAD + SPIN + 100);
    later(function () { showResult(res); }, LOAD + SPIN + (reduced ? 900 : 1300));
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
    var text = c[who];
    var frame = el('div', { class: 'frame' });
    frame.appendChild(el('div', { class: 'fallback' }, [silhouette(who)]));
    var img = el('img', { src: 'images/' + c.key + '-' + who + '.jpg', alt: c.name + ' Navratri outfit idea: ' + text, loading: 'lazy', decoding: 'async' });
    img.addEventListener('error', function () { img.remove(); }); // fallback stays visible
    frame.appendChild(img);
    return el('figure', { class: 'outfit' }, [frame, el('figcaption', { text: text })]);
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
  buildLoader();
  $('startBtn').addEventListener('click', start);
  $('backBtn').addEventListener('click', back);
  $('shareBtn').addEventListener('click', share);
  $('againBtn').addEventListener('click', function () { reset(); show('landing', $('startBtn')); });
})();
