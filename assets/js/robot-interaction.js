import { RobotArmRig } from './robot-arm-rig.js';

(() => {
  'use strict';
  const hero = document.querySelector('.hero');
  const scene = document.querySelector('.robot-scene');
  const arm = document.querySelector('.robot-arm');
  const cards = [...document.querySelectorAll('.glass-card')];
  if (!hero || !scene || !arm || !cards.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const status = document.querySelector('#pickup-status');
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const rad = Math.PI / 180;
  let ready = false,
    selected = null,
    busy = false,
    frame = 0,
    lastTime = 0;
  let navigationTimer = 0,
    gripTimer = 0,
    geometry,
    rig;
  const neutral = () => ({ shoulder: 0, elbow: 0, wrist: 0, curl: 0 });
  let pose = neutral();
  let target = { ...pose };
  let contactTarget;

  function measure() {
    rig.resize();
    geometry = { finger: rig.render(neutral()), cards: new Map() };
    const nav = document.querySelector('.floating-cards');
    cards.forEach((card) => {
      const angle =
        parseFloat(getComputedStyle(card).getPropertyValue('--angle')) * rad;
      const w = card.offsetWidth,
        h = card.offsetHeight;
      const cx = nav.offsetLeft + card.offsetLeft + w / 2;
      const cy = nav.offsetTop + card.offsetTop + h / 2;
      // Touch the closest card edge, rather than reaching for an arbitrary point
      // inside it. This keeps all three cards within the articulated hand's reach.
      const hx = geometry.finger.x - cx,
        hy = geometry.finger.y - cy;
      const localX = hx * Math.cos(angle) + hy * Math.sin(angle);
      const localY = -hx * Math.sin(angle) + hy * Math.cos(angle);
      const edges = [
        { x: clamp(localX, -w / 2 + 18, w / 2 - 18), y: -h / 2 },
        { x: clamp(localX, -w / 2 + 18, w / 2 - 18), y: h / 2 },
        { x: -w / 2, y: clamp(localY, -h / 2 + 18, h / 2 - 18) },
        { x: w / 2, y: clamp(localY, -h / 2 + 18, h / 2 - 18) },
      ];
      edges.sort(
        (a, b) =>
          Math.hypot(a.x - localX, a.y - localY) -
          Math.hypot(b.x - localX, b.y - localY),
      );
      // Approach the upper part of the outside edge. This gives the lowered
      // arm enough reach to pinch the card without folding the wrist inward.
      const { x: ax, y: ay } =
        card.classList.contains('card-secondary') && hero.clientWidth > 960
          ? { x: w / 2, y: -h / 2 + 18 }
          : edges[0];
      geometry.cards.set(card, {
        approach:
          card.classList.contains('card-secondary') && hero.clientWidth > 960
            ? 'lower-arm'
            : 'nearest-edge',
        x: cx + ax * Math.cos(angle) - ay * Math.sin(angle),
        y: cy + ax * Math.sin(angle) + ay * Math.cos(angle),
        left: cx - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
      });
    });
  }
  function aim(card) {
    if (!ready || reduced.matches || busy) return;
    if (selected !== card) {
      cards.forEach((item) =>
        item.classList.toggle('is-target', item === card),
      );
      selected = card;
    }
    if (!card) {
      target = neutral();
      wake();
      return;
    }
    contactTarget = geometry.cards.get(card);
    target = rig.reach(contactTarget);
    wake();
  }
  function wake() {
    if (!frame) {
      lastTime = 0;
      frame = requestAnimationFrame(tick);
    }
  }
  function tick(time) {
    frame = 0;
    const alpha =
      1 - Math.exp(-Math.min(lastTime ? time - lastTime : 16, 40) / 130);
    lastTime = time;
    let remaining = 0;
    for (const key of ['shoulder', 'elbow', 'wrist', 'curl']) {
      pose[key] += (target[key] - pose[key]) * alpha;
      remaining += Math.abs(target[key] - pose[key]);
    }
    const hand = rig.render(pose);
    cards.forEach((card) => {
      const anchor = geometry.cards.get(card);
      card.classList.toggle(
        'is-touching',
        card === selected &&
          Math.hypot(hand.x - anchor.x, hand.y - anchor.y) < 5,
      );
      // The hand reaches the stationary click target, including while gripping.
      card.style.setProperty('--dx', '0px');
      card.style.setProperty('--dy', '0px');
    });
    if (remaining > 0.015) frame = requestAnimationFrame(tick);
  }
  function reset() {
    clearTimeout(navigationTimer);
    clearTimeout(gripTimer);
    busy = false;
    selected = null;
    hero.classList.remove('is-gripping');
    cards.forEach((card) =>
      card.classList.remove('is-target', 'is-picked', 'is-touching'),
    );
    if (status) status.textContent = '';
    target = neutral();
    if (reduced.matches) {
      cancelAnimationFrame(frame);
      frame = 0;
      pose = { ...target };
      cards.forEach((card) => {
        card.style.removeProperty('--dx');
        card.style.removeProperty('--dy');
      });
      if (ready) measure();
    } else if (ready) wake();
  }
  hero.addEventListener('pointermove', (event) => {
    if (
      !ready ||
      busy ||
      reduced.matches ||
      !finePointer.matches ||
      event.pointerType === 'touch'
    )
      return;
    const box = hero.getBoundingClientRect();
    const pointer = { x: event.clientX - box.left, y: event.clientY - box.top };
    const hit = event.target.closest('.glass-card');
    let nearest = hit,
      distance = 130;
    if (!hit)
      geometry.cards.forEach((rect, card) => {
        const dx = Math.max(
          rect.left - pointer.x,
          0,
          pointer.x - rect.left - rect.width,
        );
        const dy = Math.max(
          rect.top - pointer.y,
          0,
          pointer.y - rect.top - rect.height,
        );
        if (Math.hypot(dx, dy) < distance) {
          distance = Math.hypot(dx, dy);
          nearest = card;
        }
      });
    aim(nearest, pointer);
  });
  hero.addEventListener('pointerleave', () => {
    if (!busy && !cards.includes(document.activeElement)) aim(null);
  });
  cards.forEach((card) => {
    card.addEventListener('focus', () => aim(card));
    card.addEventListener('blur', () => {
      if (!busy) aim(null);
    });
    card.addEventListener('click', (event) => {
      // Preserve native new-tab, download and reduced-motion navigation.
      if (
        !ready ||
        reduced.matches ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        card.target === '_blank' ||
        card.hasAttribute('download')
      )
        return;
      event.preventDefault();
      if (busy) return;
      aim(card);
      busy = true;
      selected = card;
      card.classList.add('is-picked');
      if (status)
        status.textContent = `Opening ${card.querySelector('.card-title').textContent}`;
      gripTimer = setTimeout(() => {
        hero.classList.add('is-gripping');
        target = rig.reach(contactTarget, 1);
        wake();
      }, 420);
      navigationTimer = setTimeout(() => {
        if (card.dataset.writingCategory) {
          document.dispatchEvent(
            new CustomEvent('writing:select', {
              detail: { category: card.dataset.writingCategory },
            }),
          );
          reset();
          return;
        }
        const url = new URL(card.href);
        if (
          url.origin === location.origin &&
          url.pathname === location.pathname &&
          url.hash
        ) {
          const destination = document.getElementById(url.hash.slice(1));
          if (destination) {
            history.pushState(null, '', url.hash);
            destination.scrollIntoView({ behavior: 'smooth' });
            destination.focus({ preventScroll: true });
          }
          reset();
        } else location.assign(card.href);
      }, 950);
    });
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') reset();
  });
  window.addEventListener('pagehide', reset);
  window.addEventListener('pageshow', reset);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else if (ready) {
      if (cards.includes(document.activeElement)) aim(document.activeElement);
      wake();
    }
  });
  const resize = new ResizeObserver(() => {
    if (ready) {
      const active =
        selected ||
        (cards.includes(document.activeElement)
          ? document.activeElement
          : null);
      measure();
      if (active && !reduced.matches) {
        selected = active;
        contactTarget = geometry.cards.get(active);
        target = rig.reach(
          contactTarget,
          hero.classList.contains('is-gripping') ? 1 : 0,
        );
        pose = { ...target };
        rig.render(pose);
        wake();
      }
    }
  });
  resize.observe(hero);
  reduced.addEventListener('change', reset);
  Promise.all(
    [...scene.querySelectorAll('.robot-body, .robot-arm img')].map((image) =>
      image.decode(),
    ),
  )
    .then(() => {
      rig = new RobotArmRig(
        arm.querySelector('canvas'),
        arm.querySelector('.arm-open'),
        scene,
      );
      ready = true;
      measure();
      hero.classList.add('is-rigged', 'mesh-ready');
      arm.querySelector('canvas').addEventListener('webglcontextlost', () => {
        reset();
        cancelAnimationFrame(frame);
        frame = 0;
        ready = false;
        hero.classList.remove('is-rigged', 'mesh-ready');
      });
    })
    .catch(() => {
      /* Original illustration and native links remain usable. */
    });
})();
