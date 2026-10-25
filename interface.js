const compactScreen = window.matchMedia('(max-width: 900px)');

function setDirectoryOpen(open) {
  document.getElementById('left-drawer').classList.toggle('drawer-open', open);
  document.body.classList.toggle('directory-open', open);
  document.getElementById('left-drawer-body').classList.toggle('hidden', !open);
  document.getElementById('left-drawer-toggle-text').textContent = open ? '收合永續目錄' : '展開永續目錄';
  document.querySelectorAll('[data-directory-toggle]').forEach(button => button.setAttribute('aria-expanded', String(open)));
  updatePanelState();
}

function updatePanelState() {
  const inspectorOpen = !document.getElementById('right-inspector').classList.contains('translate-x-[115%]');
  document.body.classList.toggle('panel-open', inspectorOpen || document.getElementById('left-drawer').classList.contains('drawer-open'));
  document.getElementById('right-inspector').inert = !inspectorOpen;
}

function exploreIsland() {
  const islands = ISLANDS_DATA.filter(island =>
    (!currentSdgFilter || island.sdgs.includes(currentSdgFilter)) &&
    (currentOrgFilter === 'ALL' || island.org === currentOrgFilter));
  const choices = islands.filter(island => island.id !== currentSelectedIslandId);
  const pool = choices.length ? choices : islands;
  if (pool.length) selectIsland(pool[Math.floor(Math.random() * pool.length)].id);
}

function zoomMap(factor) {
  autoRotateEnabled = false;
  camTargetPos = null;
  camLookAtPos = null;
  const offset = camera.position.clone().sub(controls.target);
  offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
  camera.position.copy(controls.target).add(offset);
  controls.update();
}

function toggleMetrics() {
  const open = document.body.classList.toggle('metrics-open');
  document.getElementById('metrics-toggle').setAttribute('aria-expanded', String(open));
}

function overviewPosition() {
  const distance = Math.max(compactScreen.matches ? 58 : 74, 34 / (Math.tan(camera.fov * Math.PI / 360) * camera.aspect));
  return new THREE.Vector3(7.5, distance * .65, 6.5 + distance * .76);
}

function initResponsiveInterface() {
  const header = document.getElementById('app-header');
  new ResizeObserver(() => {
    document.documentElement.style.setProperty('--panel-top', `${Math.ceil(header.getBoundingClientRect().bottom + 14)}px`);
  }).observe(header);
  new ResizeObserver(() => {
    if (typeof camera !== 'undefined' && camera) onWindowResize();
  }).observe(document.getElementById('canvas-container'));
  setDirectoryOpen(!compactScreen.matches);
  compactScreen.addEventListener('change', () => setDirectoryOpen(!compactScreen.matches));
  document.getElementById('search-input').setAttribute('aria-label', '搜尋永續島、據點或 SDGs');
  document.getElementById('clear-search-btn').setAttribute('aria-label', '清除搜尋');
  document.getElementById('toast-box').setAttribute('role', 'status');
  document.getElementById('toast-box').setAttribute('aria-live', 'polite');
  const modalClosers = { 'sdg-modal': closeSdgModal, 'avatar-modal': closeAvatarModal, 'intro-modal': closeIntroModal };
  let returnFocus = null;
  Object.entries(modalClosers).forEach(([id, close]) => {
    const modal = document.getElementById(id);
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    const heading = modal.querySelector('h2, h3');
    heading.id = `${id}-title`;
    modal.setAttribute('aria-labelledby', heading.id);
    modal.querySelector('button[onclick^="close"]').setAttribute('aria-label', '關閉視窗');
    modal.addEventListener('click', event => { if (event.target === modal) close(); });
    new MutationObserver(() => {
      if (!modal.classList.contains('hidden')) {
        returnFocus = document.activeElement;
        modal.querySelector('button, input, select').focus();
      } else if (returnFocus) {
        returnFocus.focus();
        returnFocus = null;
      }
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
  });
  document.addEventListener('keydown', event => {
    const modal = Object.keys(modalClosers).map(id => document.getElementById(id)).find(el => !el.classList.contains('hidden'));
    if (event.key === 'Escape') {
      if (modal) modalClosers[modal.id]();
      else { closeInspector(); if (compactScreen.matches) setDirectoryOpen(false); }
    }
    if (event.key === 'Tab' && modal) {
      const items = [...modal.querySelectorAll('button, a[href], input, select, [tabindex="0"]')].filter(el => el.getClientRects().length && !el.disabled);
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  document.getElementById('right-inspector').setAttribute('aria-label', '永續島詳情');
  document.getElementById('left-drawer').setAttribute('aria-label', '永續目錄');
}
