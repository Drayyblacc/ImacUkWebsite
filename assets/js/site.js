/*
  IMAC UK site script.
  A tiny runtime that drives the interactive parts of the static pages:
  header menus, and the scroll effects on the home and Who We Are pages.
  Elements carry data attributes written at build time:
    data-comp      root of a component (Header, Main, WhoWeAre)
    data-tpl-ATTR  attribute template, refilled on every render, e.g. data-tpl-style="opacity: {{textA}}"
    data-tpl-text  text template
    data-if        element shown only while the named value is true
    data-on-EVENT  name of the handler to call
    data-ref       name of the function that receives the element
  Without JavaScript every page still shows its full content.
*/
(function () {
  'use strict';
  var registry = {};
  var CAMEL = { viewbox: 'viewBox', preserveaspectratio: 'preserveAspectRatio' };

  function get(obj, path) {
    var parts = path.split('.');
    for (var i = 0; i < parts.length; i++) {
      if (obj == null) return undefined;
      obj = obj[parts[i]];
    }
    return obj;
  }
  function fill(tpl, vals) {
    return tpl.replace(/\{\{\s*([\w$.]+)\s*\}\}/g, function (_, p) {
      var v = get(vals, p);
      return v == null ? '' : String(v);
    });
  }

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (patch) {
    var s = typeof patch === 'function' ? patch(this.state, this.props) : patch;
    for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) this.state[k] = s[k];
    this._schedule();
  };
  DCLogic.prototype.forceUpdate = function () { this._schedule(); };
  DCLogic.prototype._schedule = function () {
    var self = this;
    if (self._pending) return;
    self._pending = true;
    requestAnimationFrame(function () { self._pending = false; self._render(); });
  };
  DCLogic.prototype._owned = function (selector) {
    var root = this._root, out = [];
    if (root.matches(selector)) out.push(root);
    var list = root.querySelectorAll(selector);
    for (var i = 0; i < list.length; i++) {
      if (list[i].closest('[data-comp]') === root) out.push(list[i]);
    }
    return out;
  };
  DCLogic.prototype._render = function () {
    var vals = this._vals = this.renderVals();
    var els = this._tplEls;
    for (var i = 0; i < els.length; i++) {
      var el = els[i], attrs = el.attributes;
      for (var j = 0; j < attrs.length; j++) {
        var a = attrs[j];
        if (a.name.indexOf('data-tpl-') !== 0) continue;
        var target = a.name.slice(9), value = fill(a.value, vals);
        if (target === 'text') { if (el.textContent !== value) el.textContent = value; }
        else {
          target = CAMEL[target] || target;
          if (el.getAttribute(target) !== value) el.setAttribute(target, value);
        }
      }
    }
    var ifs = this._ifEls;
    for (var k = 0; k < ifs.length; k++) {
      ifs[k].style.display = get(vals, ifs[k].getAttribute('data-if')) ? 'contents' : 'none';
    }
  };

  function mount(root) {
    var Cls = registry[root.getAttribute('data-comp')];
    if (!Cls) return;
    var props = {};
    try { props = JSON.parse(root.getAttribute('data-props') || '{}'); } catch (e) {}
    var inst = new Cls(props);
    if (!inst.state) inst.state = {};
    inst._root = root;
    inst._tplEls = inst._owned('*').filter(function (el) {
      for (var i = 0; i < el.attributes.length; i++) if (el.attributes[i].name.indexOf('data-tpl-') === 0) return true;
      return false;
    });
    inst._ifEls = inst._owned('[data-if]');
    inst._render();
    inst._owned('[data-ref]').forEach(function (el) {
      var f = get(inst._vals, el.getAttribute('data-ref'));
      if (typeof f === 'function') f(el);
    });
    inst._owned('*').forEach(function (el) {
      for (var i = 0; i < el.attributes.length; i++) {
        var a = el.attributes[i];
        if (a.name.indexOf('data-on-') !== 0) continue;
        (function (evt, name) {
          el.addEventListener(evt, function (e) {
            var f = get(inst._vals, name);
            if (typeof f === 'function') f(e);
          });
        })(a.name.slice(8), a.value);
      }
    });
    if (typeof inst.componentDidMount === 'function') inst.componentDidMount();
  }

  window.DCLogic = DCLogic;
  window.DC = {
    register: function (name, cls) { registry[name] = cls; },
    start: function () {
      var roots = document.querySelectorAll('[data-comp]');
      for (var i = 0; i < roots.length; i++) mount(roots[i]);
    }
  };
})();

DC.register('Header', (function(){ class Component extends DCLogic {
  constructor(props) { super(props); this.state = { menu: null, mob: false }; }
  renderVals() {
    const a = this.props.active ?? 'home';
    const m = this.state.menu;
    const cls = (k) => 'hd-link' + (a === k ? ' is-active' : '');
    return {
      c: { home: cls('home'), about: cls('about'), events: cls('events'), un: cls('un'), member: cls('member'), contact: cls('contact') },
      aboutOpen: m === 'about', eventsOpen: m === 'events', mobOpen: this.state.mob,
      openAbout: () => this.setState({ menu: 'about' }),
      openEvents: () => this.setState({ menu: 'events' }),
      toggleAbout: () => this.setState({ menu: m === 'about' ? null : 'about' }),
      toggleEvents: () => this.setState({ menu: m === 'events' ? null : 'events' }),
      closeAll: () => { if (this.state.menu) this.setState({ menu: null }); },
      toggleMob: () => this.setState({ mob: !this.state.mob })
    };
  }
}
return Component; })());
DC.register('Main', (function(){ class Component extends DCLogic {
  constructor(props) { super(props); this.state = { p: 0, pw: 0, pn: 0 }; this.hero = null; this.who = null; this.nat = null; this.raf = 0; }
  componentDidMount() {
    this.reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.reduce) { this.setState({ p: 1, pw: 1, pn: 1 }); return; }
    this.onScroll = () => {
      if (this.raf) return;
      this.raf = requestAnimationFrame(() => {
        this.raf = 0;
        const vh = window.innerHeight || 900;
        const enter = (el) => { if (!el) return 1; const b = el.getBoundingClientRect(); return Math.min(1, Math.max(0, (vh * 0.85 - b.top) / (b.height * 0.6 + 1))); };
        const pw = enter(this.who), pn = enter(this.nat);
        if (Math.abs(pw - this.state.pw) > 0.004 || Math.abs(pn - this.state.pn) > 0.004) this.setState({ pw, pn });
        if (!this.hero) return;
        const r = this.hero.getBoundingClientRect();
        const stage = this.hero.firstElementChild ? this.hero.firstElementChild.offsetHeight : 860;
        const span = Math.max(1, r.height - stage);
        const p = Math.min(1, Math.max(0, -r.top / span));
        if (Math.abs(p - this.state.p) > 0.002) this.setState({ p });
      });
    };
    document.addEventListener('scroll', this.onScroll, { passive: true, capture: true });
    window.addEventListener('resize', this.onScroll);
    this.onScroll();
  }
  componentWillUnmount() {
    if (this.onScroll) { document.removeEventListener('scroll', this.onScroll, { capture: true }); window.removeEventListener('resize', this.onScroll); }
    if (this.raf) cancelAnimationFrame(this.raf);
  }
  heroVals() {
    const p = this.state.p;
    const e = (x) => 1 - Math.pow(1 - x, 3);
    let d = '';
    for (let i = 0; i < 36; i++) {
      const a = i * Math.PI / 18, r1 = 150, r2 = i % 2 ? 250 : 300;
      d += 'M' + (300 + Math.cos(a) * r1).toFixed(1) + ' ' + (300 + Math.sin(a) * r1).toFixed(1) + 'L' + (300 + Math.cos(a) * r2).toFixed(1) + ' ' + (300 + Math.sin(a) * r2).toFixed(1);
    }
    const verse = 'Go ye therefore, and teach all nations'.split(' ');
    const lit = p * (verse.length + 1);
    const nations = ['United Kingdom','Nigeria','Ghana','USA','Canada','France','Zimbabwe','Zambia','Liberia','Burundi','Ethiopia','Tanzania','Kenya','Cameroon','South Africa','Namibia','DR Congo','Philippines','The Gambia','South Sudan','Mozambique','Uganda','Malawi','Rwanda','Botswana','Lesotho','Brazil','India','Pakistan','Sierra Leone','Madagascar','Egypt'];
    const count = Math.max(1, Math.min(32, Math.round(1 + e(Math.min(1, p / 0.85)) * 31)));
    return {
      setHero: (el) => { this.hero = el; },
      strips: Array.from({ length: 30 }, (_, i) => ({ vb: (i * 2) + ' 0 2 30', cls: 'w' + (1 + Math.min(3, Math.floor(i / 7.5))), d: (-(i * 0.09)).toFixed(2) + 's' })),
      flagA: (0.2 - p * 0.08).toFixed(3),
      flagY: (-p * 90).toFixed(1),
      flagS: (1 + p * 0.06).toFixed(3),
      raysD: d,
      rayRot: (p * 50).toFixed(2),
      rayScale: (0.75 + e(p) * 0.35).toFixed(3),
      rayA: (0.35 + p * 0.65).toFixed(3),
      crossScale: (0.86 + e(p) * 0.22).toFixed(3),
      crossGlow: (0.35 + p * 0.65).toFixed(3),
      globeRot: (-p * 35).toFixed(2),
      glowX: (68 - p * 8).toFixed(1) + '%',
      glowA: (0.10 + p * 0.22).toFixed(3),
      textY: (-p * 40).toFixed(1),
      textA: (1 - Math.max(0, p - 0.75) * 1.2).toFixed(3),
      cueA: (1 - Math.min(1, p * 4)).toFixed(3),
      words: verse.map((t, i) => ({ t, a: (0.22 + Math.min(1, Math.max(0, lit - i)) * 0.78).toFixed(3) })),
      dots: nations.map((n, i) => ({ c: i < count ? '#FF6A4D' : 'rgba(200,208,240,0.22)' })),
      count: String(count),
      nation: nations[count - 1]
    };
  }
  secVals() {
    const e = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
    const pw = this.state.pw, pn = this.state.pn;
    const wv = { dash: (1 - e(pw / 0.8)).toFixed(3), fill: (Math.max(0, pw - 0.7) / 0.3 * 0.05).toFixed(3), glowR: (40 + e(pw) * 90).toFixed(0), glowA: (e(pw) * 0.22).toFixed(3) };
    for (let i = 0; i < 4; i++) { const k = e(pw * 1.7 - i * 0.18); wv['c' + i] = { a: (0.15 + k * 0.85).toFixed(3), y: ((1 - k) * 36).toFixed(1) }; }
    const list = ['United Kingdom','Zimbabwe','Zambia','Ghana','Liberia','Nigeria','Burundi','Ethiopia','Tanzania','Kenya','Cameroon','South Africa','Namibia','DR Congo','USA','Philippines','The Gambia','South Sudan','Mozambique','Uganda','Malawi','Rwanda','Botswana','Lesotho','Canada','Brazil','India','Pakistan','France','Sierra Leone','Madagascar','Egypt'];
    const count = Math.max(1, Math.round(e(pn / 0.9) * 32));
    const chips = list.map((name, i) => { const on = i < count; return { name, b: on ? '#FF6A4D' : '#2533A0', bg: on ? 'rgba(255,106,77,0.12)' : 'transparent', c: on ? '#FFFFFF' : '#9AA6DA', dot: on ? '#FF6A4D' : '#2533A0' }; });
    return { wv, nv: { count: String(count), chips }, setWho: (el) => { this.who = el; }, setNat: (el) => { this.nat = el; } };
  }
  renderVals() {
    return { ...this.heroVals(), ...this.secVals(),
      nations: ['United Kingdom','Zimbabwe','Zambia','Ghana','Liberia','Nigeria','Burundi','Ethiopia','Tanzania','Kenya','Cameroon','South Africa','Namibia','DR Congo','USA','Philippines','The Gambia','South Sudan','Mozambique','Uganda','Malawi','Rwanda','Botswana','Lesotho','Canada','Brazil','India','Pakistan','France','Sierra Leone','Madagascar','Egypt'],
      events: ['[EVENT TITLE]','[EVENT TITLE]','[EVENT TITLE]'],
      leaders: [
        { name: 'Archbishop Dr. Joel Oluwafemi', role: 'Presiding Archbishop' },
        { name: 'Bishop Elect Ebenezer Jojo Annan', role: 'Global President' },
        { name: 'Rev. Stephen Anning', role: 'Mission Coordinator, Office of the Founder' },
        { name: 'Pastor Abena Berko', role: 'Worship Director' }
      ]
    };
  }
}
return Component; })());
DC.register('WhoWeAre', (function(){ class Component extends DCLogic {
  constructor(props) { super(props); this.state = { po: 0 }; this.obj = null; this.raf = 0; }
  componentDidMount() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { this.setState({ po: 1 }); return; }
    this.onScroll = () => {
      if (this.raf) return;
      this.raf = requestAnimationFrame(() => {
        this.raf = 0;
        if (!this.obj) return;
        const vh = window.innerHeight || 900, b = this.obj.getBoundingClientRect();
        const po = Math.min(1, Math.max(0, (vh * 0.8 - b.top) / (b.height * 0.75 + 1)));
        if (Math.abs(po - this.state.po) > 0.004) this.setState({ po });
      });
    };
    document.addEventListener('scroll', this.onScroll, { passive: true, capture: true });
    window.addEventListener('resize', this.onScroll);
    this.onScroll();
  }
  componentWillUnmount() {
    if (this.onScroll) { document.removeEventListener('scroll', this.onScroll, { capture: true }); window.removeEventListener('resize', this.onScroll); }
    if (this.raf) cancelAnimationFrame(this.raf);
  }
  renderVals() {
    const t = ['Spiritual Leadership and Capacity Building','Church Unity and National Network Development','Social Advocacy and Public Policy Engagement','Humanitarian and Community Outreach','Global Missions and Cultural Exchange','Youth Empowerment and Next-Generation Leadership','Promotion of Peace, Justice and Sustainable Development'];
    const lit = Math.min(7, Math.floor(this.state.po * 7.6));
    return {
      setObj: (el) => { this.obj = el; },
      lit: String(lit),
      bar: Math.round(lit / 7 * 100) + '%',
      pillars: ['Faith-Driven Leadership','Global Collaboration','Transformational Impact','Societal Empowerment','Kingdom Values Propagation'],
      objectives: t.map((x, i) => {
        const on = i < lit;
        return { n: '0' + (i + 1), t: x,
          b: on ? 'rgba(255,214,150,0.55)' : '#1A2A9E', bg: on ? 'rgba(255,214,150,0.07)' : 'transparent',
          nc: on ? '#FFD696' : '#7B88CC', tc: on ? '#FFFFFF' : '#AEB8E4',
          flame: on ? '#FFB347' : '#2533A0', fs: on ? '1' : '0.75', glow: on ? '0.28' : '0', lamp: on ? '#FF6A4D' : '#2533A0' };
      })
    };
  }
}
return Component; })());
DC.start();
/* Premium scroll layer: smooth scrolling, reveals, image parallax, header state, counters */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  // Smooth inertia scrolling (Lenis, MIT licence, bundled in assets/js/lenis.min.js)
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    window.__lenis = lenis;
    var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2) return;
      var t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -96 }); }
    });
  }

  // Scroll progress bar and header state
  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var header = document.querySelector('header[data-comp="Header"]');

  // Reveal targets: section content, grid items and images (skips the hand built scroll scenes)
  function skip(el) {
    return el.closest('.hx') || el.closest('[data-tpl-style]') || el.querySelector('[data-tpl-style]') || el.closest('header') || el.closest('footer');
  }
  var targets = [];
  document.querySelectorAll('section .wrap > *, section .wrap > * > *:not(span):not(a):not(p):not(h2), .g2 > *, .g3 > *, .g4 > *, .g5 > *').forEach(function (el) {
    if (skip(el) || el.classList.contains('reveal')) return;
    if (el.parentElement && el.parentElement.classList.contains('reveal')) return;
    el.classList.add('reveal');
    var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
    el.style.setProperty('--d', Math.min(sib, 6) * 0.08 + 's');
    targets.push(el);
  });
  var big = [];
  document.querySelectorAll('section img').forEach(function (img) {
    if (skip(img)) return;
    img.classList.add('img-reveal');
    targets.push(img);
    if (img.getBoundingClientRect().height >= 380 || parseInt(img.style.height, 10) >= 380) {
      var wrap = document.createElement('div');
      wrap.className = 'px-wrap';
      wrap.style.cssText = 'position:relative;' + (img.style.gridRow ? 'grid-row:' + img.style.gridRow + ';' : '');
      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);
      img.classList.add('px');
      big.push(img);
    }
  });

  // Number counters (large figures such as 3,670 and 36,700)
  var counters = [];
  document.querySelectorAll('section span').forEach(function (s) {
    if (s.children.length || skip(s) || s.hasAttribute('data-tpl-text')) return;
    var txt = s.textContent.trim();
    if (!/^\d{1,3}(,\d{3})*\+?$/.test(txt)) return;
    if (parseFloat(getComputedStyle(s).fontSize) < 30) return;
    var n = parseInt(txt.replace(/\D/g, ''), 10);
    if (n < 10) return;
    counters.push({ el: s, n: n, suffix: txt.replace(/[\d,]/g, ''), done: false });
  });

  function countUp(c) {
    if (c.done) return; c.done = true;
    if (reduce) return;
    var start = null, dur = 1600;
    function step(ts) {
      if (!start) start = ts;
      var k = Math.min(1, (ts - start) / dur), e = 1 - Math.pow(1 - k, 4);
      c.el.textContent = Math.round(c.n * e).toLocaleString('en-GB') + c.suffix;
      if (k < 1) requestAnimationFrame(step);
    }
    c.el.textContent = '0' + c.suffix;
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
        counters.forEach(function (c) { if (en.target === c.el || en.target.contains(c.el)) countUp(c); });
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (t) { io.observe(t); });
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { counters.forEach(function (c) { if (c.el === en.target) countUp(c); }); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c.el); });
  } else {
    targets.forEach(function (t) { t.classList.add('is-in'); });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY || document.documentElement.scrollTop;
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      bar.style.setProperty('--sp', (y / max).toFixed(4));
      if (header) header.classList.toggle('is-scrolled', y > 60);
      if (reduce) return;
      var vh = window.innerHeight;
      for (var i = 0; i < big.length; i++) {
        var r = big[i].parentNode.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) continue;
        var rel = (r.top + r.height / 2 - vh / 2) / vh;
        big[i].style.setProperty('--py', (rel * -48).toFixed(1) + 'px');
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();

/* Site functions: forms, keyboard support, external links */
(function () {
  'use strict';
  // Forms send in the background and show the result inline
  document.querySelectorAll('form[action*="formspree.io"]').forEach(function (form) {
    var status = document.createElement('p');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.style.cssText = 'margin:4px 0 0;font-size:14px;font-weight:600;min-height:1em';
    form.appendChild(status);
    form.addEventListener('submit', function (e) {
      if (form.action.indexOf('YOUR_') !== -1) {
        e.preventDefault();
        status.style.color = '#D41C00';
        status.textContent = 'This form is not connected yet. Please email info@imacglobaluk.org.';
        return;
      }
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Sending...'; }
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error('bad');
          form.reset();
          status.style.color = form.closest('footer') ? '#FFFFFF' : '#001086';
          status.textContent = form.closest('footer') ? 'Thank you, you are subscribed.' : 'Thank you. Your message has been sent and we will reply soon.';
        })
        .catch(function () {
          status.style.color = form.closest('footer') ? '#FF6A4D' : '#D41C00';
          status.textContent = 'Sorry, something went wrong. Please try again or email info@imacglobaluk.org.';
        })
        .then(function () { if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; } });
    });
  });

  // Escape closes open menus
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var header = document.querySelector('header[data-comp="Header"]');
    if (!header) return;
    header.dispatchEvent(new MouseEvent('mouseleave'));
    var burger = header.querySelector('.hd-burger[aria-expanded="true"]');
    if (burger) { burger.click(); burger.focus(); }
  });

  // External links open safely in a new tab
  document.querySelectorAll('a[href^="http"]').forEach(function (a) {
    if (a.hostname === location.hostname) return;
    a.target = '_blank';
    a.rel = 'noopener';
  });
})();

/* YouTube: load the player only when a video is clicked (keeps the page fast) */
(function () {
  document.querySelectorAll('button.yt[data-yt]').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + b.getAttribute('data-yt') + '?autoplay=1&rel=0&playsinline=1';
      f.title = b.getAttribute('aria-label') || 'Video';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      f.allowFullscreen = true;
      f.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0';
      b.innerHTML = '';
      b.appendChild(f);
      b.style.cursor = 'default';
    }, { once: true });
  });
})();

/* Back to top button */
(function () {
  var b = document.createElement('button');
  b.type = 'button';
  b.className = 'to-top';
  b.setAttribute('aria-label', 'Back to top');
  b.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"></path></svg>';
  document.body.appendChild(b);
  b.addEventListener('click', function () {
    if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.2 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
    var main = document.getElementById('main');
    var logo = document.querySelector('header a[href="/"]');
    if (logo) setTimeout(function () { logo.focus({ preventScroll: true }); }, 900);
  });
  var shown = false;
  function check() {
    var s = (window.scrollY || document.documentElement.scrollTop) > 700;
    if (s !== shown) { shown = s; b.classList.toggle('is-visible', s); }
  }
  window.addEventListener('scroll', check, { passive: true });
  check();
})();
