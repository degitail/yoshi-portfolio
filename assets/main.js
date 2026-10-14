// Shared behavior: mobile nav toggle + scroll reveal + cats + hedgehog
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Illustrations generated with Codex (assets/codex/)
  var IMG = 'assets/codex/';
  var CAT_BACK = '<img class="intro-cat" src="' + IMG + 'cat-scratch.png" alt="">';
  // Tail is a separate layer behind the body so it can rotate around its base
  var CAT_SIT =
    '<img class="tail" src="' + IMG + 'cat-sit-tail.png" alt="">' +
    '<img class="body" src="' + IMG + 'cat-sit.png" alt="">';
  var HEDGEHOG =
    '<img class="f1" src="' + IMG + 'hedgehog-walk-1.png" alt="">' +
    '<img class="f2" src="' + IMG + 'hedgehog-walk-2.png" alt="">';

  // --- Opening animation (once per tab session; head script sets .intro-pending) ---
  var root = document.documentElement;
  if (root.classList.contains('intro-pending')) {
    var intro = document.createElement('div');
    intro.className = 'intro';
    intro.setAttribute('aria-hidden', 'true');
    intro.innerHTML = '<div class="intro-stage">' +
      '<span class="intro-claw"></span><span class="intro-claw"></span><span class="intro-claw"></span>' +
      '<span class="intro-claw"></span><span class="intro-claw"></span><span class="intro-claw"></span>' +
      CAT_BACK + '</div><div class="intro-skip">click to skip</div>';
    document.body.appendChild(intro);
    root.classList.remove('intro-pending');
    var finish = function () { intro.classList.add('is-done'); intro.remove(); };
    intro.addEventListener('animationend', function (e) { if (e.target === intro) finish(); });
    intro.addEventListener('click', finish);
    try { sessionStorage.setItem('introSeen', '1'); } catch (e) {}
  }

  // --- Resident cat: tail flaps harder the faster you scroll ---
  var dock = document.createElement('div');
  dock.className = 'cat-dock';
  dock.innerHTML = CAT_SIT;
  document.body.appendChild(dock);
  var tail = dock.querySelector('.tail');
  if (tail && !reduceMotion) {
    var lastY = window.scrollY, amp = 0, phase = 0;
    window.addEventListener('scroll', function () {
      var dy = Math.abs(window.scrollY - lastY);
      lastY = window.scrollY;
      amp = Math.min(38, amp + dy * 0.35);
    }, { passive: true });
    (function tick() {
      amp *= 0.94;
      phase += 0.12 + amp * 0.012;          // faster flaps while scrolling
      var idle = Math.sin(phase * 0.35) * 4; // slow sway when still
      tail.style.transform = 'rotate(' + (idle + Math.sin(phase) * amp).toFixed(2) + 'deg)';
      requestAnimationFrame(tick);
    })();
  }

  // --- Hedgehog: wanders along the bottom while the page is still, freezes while scrolling ---
  var hog = document.createElement('div');
  hog.className = 'hedgehog';
  hog.innerHTML = HEDGEHOG;
  document.body.appendChild(hog);
  if (!reduceMotion) {
    var START = 16, SPEED = 28, TURN_GAP = 60; // px, px/s, gap kept from the cat
    var hx = START, dir = 1, lastScrollAt = -1e9, lastT = null;
    window.addEventListener('scroll', function () { lastScrollAt = performance.now(); }, { passive: true });
    (function walk(t) {
      var dt = lastT === null ? 0 : Math.min(0.05, (t - lastT) / 1000);
      lastT = t;
      var moving = t - lastScrollAt > 250;
      hog.classList.toggle('walking', moving);
      if (moving) {
        // U-turn point: some distance to the left of the resident cat
        var turnAt = dock.getBoundingClientRect().left - TURN_GAP - hog.offsetWidth;
        hx += dir * SPEED * dt;
        if (dir > 0 && hx >= turnAt) { hx = Math.max(START, turnAt); dir = -1; }
        else if (dir < 0 && hx <= START) { hx = START; dir = 1; }
      }
      hog.style.transform = 'translateX(' + hx.toFixed(1) + 'px) scaleX(' + dir + ')';
      requestAnimationFrame(walk);
    })(performance.now());
  }

  // --- Mobile nav ---
  var header = document.querySelector('header');
  var burger = document.querySelector('.nav-burger');
  if (header && burger) {
    burger.addEventListener('click', function () {
      var open = header.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    });
    // Close the panel when a nav link is chosen (same-page anchors)
    header.querySelectorAll('nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        header.classList.remove('nav-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // --- Scroll reveal ---
  var targets = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduceMotion) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  targets.forEach(function (el, i) {
    el.style.transitionDelay = (i % 3) * 70 + 'ms';
    io.observe(el);
  });
})();
