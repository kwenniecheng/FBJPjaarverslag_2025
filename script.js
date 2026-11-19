/* Jaarverslag 2025 – Fonds BJP
   Eén pagina, één hoofdstuk tegelijk zichtbaar. Navigatie via de URL-hash (#voorwoord, #codes, ...).
   Zonder JavaScript zijn alle hoofdstukken gewoon onder elkaar zichtbaar. */
(function () {
  'use strict';

  var body = document.body;
  var sections = Array.prototype.slice.call(document.querySelectorAll('main > section'));
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('#sidebar .toc a[href^="#"]'));
  var menuBtn = document.getElementById('menu-toggle');
  var sidebar = document.getElementById('sidebar');
  var closeBtn = document.getElementById('menu-close');
  var siteTitle = document.title;
  var firstLoad = true;

  /* ---------- Menu (mobiel) ---------- */
  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', String(open));
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(!body.classList.contains('menu-open')); });
  if (closeBtn) closeBtn.addEventListener('click', function () { setMenu(false); if (menuBtn) menuBtn.focus(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && body.classList.contains('menu-open')) { setMenu(false); if (menuBtn) menuBtn.focus(); }
  });

  /* ---------- Vorige / volgende hoofdstuk ---------- */
  var chapters = sections.filter(function (s) { return s.id !== 'home'; });
  chapters.forEach(function (sec, i) {
    var pager = sec.querySelector('.pager');
    if (!pager) return;
    var prev = i > 0 ? chapters[i - 1] : null;
    var next = i < chapters.length - 1 ? chapters[i + 1] : null;
    var html = '';
    function title(s) { return s.getAttribute('data-title'); }
    html += prev ? '<a class="prev" href="#' + prev.id + '"><small>Vorige</small><b>' + title(prev) + '</b></a>'
                 : '<a class="prev" href="#home"><small>Terug naar</small><b>Inhoudsopgave</b></a>';
    html += next ? '<a class="next" href="#' + next.id + '"><small>Volgende</small><b>' + title(next) + '</b></a>' : '<span></span>';
    pager.innerHTML = html;
  });

  /* ---------- Drie pijlers (Het Fonds BJP in 2025) ---------- */
  (function () {
    var fig = document.getElementById('drie-pijlers');
    if (!fig) return;
    var btns = Array.prototype.slice.call(fig.querySelectorAll('.pillar-btn'));
    var panels = btns.map(function (b) { return document.getElementById(b.getAttribute('aria-controls')); });
    var timers = [];
    var introDone = false;

    function stopIntro() {
      timers.forEach(clearTimeout); timers = [];
      btns.forEach(function (b) { b.classList.remove('is-intro'); });
      panels.forEach(function (p) { p.classList.remove('is-peek'); });
    }

    btns.forEach(function (b, i) {
      b.addEventListener('click', function () {
        introDone = true; stopIntro();
        var open = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', String(open));
        panels[i].classList.toggle('is-open', open);
      });
    });

    function playIntro() {
      if (introDone) return;
      introDone = true;
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      btns.forEach(function (b) { b.classList.add('is-intro'); });
      if (!reduce) {
        panels.forEach(function (p, i) {
          timers.push(setTimeout(function () { p.classList.add('is-peek'); }, 300 + i * 700));
        });
      }
      timers.push(setTimeout(stopIntro, reduce ? 1500 : 300 + panels.length * 700 + 900));
    }

    // Start de intro zodra de knoppen in beeld komen (bovenste 65% van het scherm).
    function check() {
      if (introDone) { window.removeEventListener('scroll', onScroll); return; }
      var r = btns[0].getBoundingClientRect();
      if (r.width && r.top < window.innerHeight * 0.65 && r.bottom > 0) {
        window.removeEventListener('scroll', onScroll);
        playIntro();
      }
    }
    var pending = false;
    function onScroll() {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(function () { pending = false; check(); });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('hashchange', function () { setTimeout(check, 50); });
    setTimeout(check, 50);
  })();

  /* ---------- Jaarrekening: kolomkeuze Totaal / RO / RBV op smalle schermen ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.fin-grouped'), function (fig) {
    var buttons = fig.querySelectorAll('.fin-switch button');
    Array.prototype.forEach.call(buttons, function (b) {
      b.addEventListener('click', function () {
        // Alle gegroepeerde tabellen tegelijk omzetten, zodat baten en lasten gelijk blijven.
        var key = b.getAttribute('data-show');
        Array.prototype.forEach.call(document.querySelectorAll('.fin-grouped'), function (f) {
          f.setAttribute('data-active', key);
          Array.prototype.forEach.call(f.querySelectorAll('.fin-switch button'), function (x) {
            x.setAttribute('aria-pressed', String(x.getAttribute('data-show') === key));
          });
        });
      });
    });
  });

  /* ---------- Router ----------
     Mobiel: één hoofdstuk tegelijk. Desktop: alles onder elkaar, doorscrollen,
     en de zijbalk volgt mee (scroll-spy). */
  var desktop = window.matchMedia('(min-width: 60rem)');
  var spyTargets = tocLinks.map(function (a) {
    return { link: a, el: document.getElementById(a.getAttribute('href').slice(1)) };
  }).filter(function (t) { return t.el; });
  var activeId = null;

  function setCurrent(sectionId, targetId) {
    tocLinks.forEach(function (a) {
      var h = a.getAttribute('href');
      if (h === '#' + sectionId || h === '#' + targetId) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    var sec = document.getElementById(sectionId);
    document.title = (!sec || sectionId === 'home') ? siteTitle : sec.getAttribute('data-title') + ' – ' + siteTitle;
  }

  function revealInSidebar() {
    if (!desktop.matches || !sidebar) return;
    var cur = sidebar.querySelectorAll('[aria-current="page"]');
    var a = cur[cur.length - 1];
    if (!a) { sidebar.scrollTop = 0; return; }
    var top = a.offsetTop, bottom = top + a.offsetHeight;
    if (top < sidebar.scrollTop + 60) sidebar.scrollTop = top - 60;
    else if (bottom > sidebar.scrollTop + sidebar.clientHeight - 60) sidebar.scrollTop = bottom - sidebar.clientHeight + 60;
  }

  function spy() {
    if (!desktop.matches) return;
    var line = window.innerHeight * 0.3;
    var hit = null;
    spyTargets.forEach(function (t) { if (t.el.getBoundingClientRect().top <= line) hit = t; });
    var targetId = hit ? hit.el.id : 'home';
    if (targetId === activeId) return;
    activeId = targetId;
    var sec = hit ? hit.el.closest('main > section') : null;
    var sectionId = sec ? sec.id : 'home';
    setCurrent(sectionId, targetId);
    revealInSidebar();
    try { history.replaceState(null, '', targetId === 'home' ? location.pathname + location.search : '#' + targetId); } catch (e) {}
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { ticking = false; spy(); });
  }, { passive: true });

  function route() {
    var id = '';
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { id = ''; }
    var target = id ? document.getElementById(id) : null;
    var current = target ? target.closest('main > section') : null;
    if (!current) { current = document.getElementById('home'); target = current; }
    setMenu(false);

    if (desktop.matches) {
      sections.forEach(function (s) { s.hidden = false; });
      if (firstLoad || id) target.scrollIntoView();
      activeId = null;
      spy();
      firstLoad = false;
      return;
    }

    sections.forEach(function (s) { s.hidden = (s !== current); });
    setCurrent(current.id, target.id);

    if (target !== current) {
      target.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
      var h1 = current.querySelector('h1');
      if (h1 && !firstLoad) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    }
    firstLoad = false;
  }

  window.addEventListener('hashchange', route);
  if (desktop.addEventListener) desktop.addEventListener('change', route);
  else if (desktop.addListener) desktop.addListener(route);
  route();
})();
