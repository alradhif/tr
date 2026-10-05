

let state = {
  logoDataUrl: null,
  font: 'Tajawal',
  primary: '#0B3D2E',
  secondary: '#C9A961',
  accent: '#E8DCC4',
  fontColor: '#0B3D2E',

  
  
  
  selectedSections: AVAILABLE_SECTIONS.filter(s => s.core).map(s => s.id),

  
  
  selectedCharts: [],

  
  
  
  
  
  sectionFieldState: {}
};
AVAILABLE_SECTIONS.forEach(s => {
  state.sectionFieldState[s.id] = new Set((s.fields || []).map(f => f.id));
});

function $(id) { return document.getElementById(id); }

function applyPreset(p) {
  state.font = p.font; state.primary = p.primary;
  state.secondary = p.secondary; state.accent = p.accent;
  state.fontColor = p.primary;
  $('fontSelect').value = p.font;
  $('primaryColor').value = p.primary;
  $('secondaryColor').value = p.secondary;
  $('accentColor').value = p.accent;
  $('fontColorInput').value = p.primary;
  $('primaryHex').textContent = p.primary.toUpperCase();
  $('secondaryHex').textContent = p.secondary.toUpperCase();
  $('accentHex').textContent = p.accent.toUpperCase();
  $('fontColorHex').textContent = p.primary.toUpperCase();
  updateFontPreview();
  renderPreview();
}

function fmt(n) { return new Intl.NumberFormat('ar-SA').format(n); }

function overviewFieldValues() {
  return {
    manager: PROJECT.projectManager,
    sponsor: PROJECT.sponsor,
    startDate: PROJECT.startDate,
    endDate: PROJECT.endDate,
    budget: fmt(PROJECT.budget) + ' ' + PROJECT.budgetCurrency,
    status: PROJECT.statusLabel
  };
}
function milestonesFieldValues() {
  const p = PLACEHOLDER_METRICS.phaseProgress;
  return { phase1: p.values[0], phase2: p.values[1], phase3: p.values[2], phase4: p.values[3] };
}
function changesFieldValues() {
  return {
    approved: { crId: 'CR-01', status: 'معتمد' },
    inReview: { crId: 'CR-02', status: 'قيد المراجعة' },
    rejected: { crId: 'CR-03', status: 'مرفوض' }
  };
}
function risksFieldValues() {
  const r = AVAILABLE_CHARTS.find(c => c.id === 'openRisks').sampleData[0];
  return { high: r.values[0], medium: r.values[1], low: r.values[2] };
}
function financeFieldValues() {
  const b = PLACEHOLDER_METRICS.budgetSplit;
  const [spent, remaining] = b.values;
  return {
    totalBudget: fmt(PROJECT.budget) + ' ' + PROJECT.budgetCurrency,
    spent: fmt(spent) + ' ' + PROJECT.budgetCurrency,
    remaining: fmt(remaining) + ' ' + PROJECT.budgetCurrency
  };
}
function whatifFieldValues() {
  return {
    supplyDelay: 'ماذا لو تأخر التوريد؟',
    budgetIncrease: 'ماذا لو زادت الميزانية المطلوبة؟',
    scopeChange: 'ماذا لو تغيّر نطاق المشروع؟'
  };
}
const SECTION_FIELD_VALUE_FNS = {
  overview: overviewFieldValues,
  milestones: milestonesFieldValues,
  changes: changesFieldValues,
  risks: risksFieldValues,
  finance: financeFieldValues,
  whatif: whatifFieldValues
};

function getCheckedFieldItems(sectionId) {
  const section = AVAILABLE_SECTIONS.find(s => s.id === sectionId);
  if (!section) return [];
  const checkedIds = state.sectionFieldState[sectionId] || new Set();
  const valuesFn = SECTION_FIELD_VALUE_FNS[sectionId];
  const values = valuesFn ? valuesFn() : null;
  return (section.fields || [])
    .filter(f => checkedIds.has(f.id))
    .map(f => ({ id: f.id, label: f.label, value: values ? values[f.id] : f.label }));
}

function removeSection(id) {
  state.selectedSections = state.selectedSections.filter(sid => sid !== id);
  const section = AVAILABLE_SECTIONS.find(s => s.id === id);
  state.sectionFieldState[id] = new Set((section && section.fields || []).map(f => f.id));
  renderSectionSelector();
  renderPreview();
}

function toggleSectionField(sectionId, fieldId) {
  const section = AVAILABLE_SECTIONS.find(s => s.id === sectionId);
  if (!section) return;
  const checked = state.sectionFieldState[sectionId];
  if (!checked) return;

  if (checked.has(fieldId)) {
    if (checked.size <= 1) {
      if (section.core) return; 
      checked.delete(fieldId);
      removeSection(sectionId); 
      return;
    }
    checked.delete(fieldId);
  } else {
    checked.add(fieldId);
  }

  renderSectionSelector();
  renderPreview();
}

function renderPreview() {
  $('coverInner').style.background = state.primary;
  $('coverInner').style.fontFamily = state.font;
  $('coverInner').style.color = '#FFFFFF';
  $('coverTitle').style.color = '#FFFFFF'; 
  $('leftBar').style.background = state.secondary;
  $('topBar').style.background = state.accent;
  $('coverCode').style.color = state.accent;
  $('coverUnderline').style.background = state.secondary;
  $('coverDept').style.color = 'rgba(255,255,255,0.75)';
  $('coverDate').style.color = 'rgba(255,255,255,0.6)';
  
  $('overviewInner').style.fontFamily = state.font;
  $('overviewTitle').style.color = state.fontColor;
  $('overviewHead').style.borderBottomColor = state.secondary;
  $('progressLabel').style.color = state.fontColor;
  $('barFill').style.background = state.secondary;
  
  $('coverTitle').textContent = PROJECT.name;
  $('coverDate').textContent = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  
  if (state.logoDataUrl) {
    $('coverLogo').src = state.logoDataUrl;
    $('coverLogo').style.background = 'rgba(255,255,255,0.1)';
    $('coverLogo').style.borderRadius = '6px';
    $('coverLogo').style.padding = '4px';
    $('logoCorner').style.display = 'block';
    $('overviewLogo').src = state.logoDataUrl;
    $('overviewLogo').style.display = 'block';
  } else {
    $('logoCorner').style.display = 'none';
    $('overviewLogo').style.display = 'none';
  }
  
  const stats = getCheckedFieldItems('overview');
  $('overviewStats').innerHTML = stats.map(s => `
    <div class="stat">
      <div class="side" style="background:${state.secondary}"></div>
      <div class="label">${s.label}</div>
      <div class="value" style="color:${state.fontColor}">${s.value}</div>
    </div>
  `).join('');

  
  
  
  
  
  showCarouselSlide(carouselIndex);
}

const SLIDE_DOM_IDS = ['cover', 'overviewSlide', 'sectionSlide'];

function domIdForSlide(id) {
  if (id === 'cover') return 'cover';
  if (id === 'overview') return 'overviewSlide';
  return 'sectionSlide';
}

function getSlideOrder() {
  const order = [{ id: 'cover', label: 'الغلاف' }];
  AVAILABLE_SECTIONS
    .filter(s => state.selectedSections.includes(s.id))
    .forEach(s => order.push({ id: s.id, label: s.label }));
  if (state.selectedCharts.length) {
    order.push({ id: 'dashboard', label: 'لوحة المعلومات' });
  }
  return order;
}

let carouselOrder = getSlideOrder();
let carouselIndex = 0;
let totalSlidesCount = carouselOrder.length;

function updateSlideBadge() {
  const totalAr = totalSlidesCount.toLocaleString('ar-SA');
  const numAr = (carouselIndex + 1).toLocaleString('ar-SA');
  const current = carouselOrder[carouselIndex];
  $('slideBadge').textContent = `سلايد ${numAr} / ${totalAr} — ${current ? current.label : ''}`;
}

function showCarouselSlide(i) {
  
  carouselOrder = getSlideOrder();
  totalSlidesCount = carouselOrder.length;
  carouselIndex = ((i % carouselOrder.length) + carouselOrder.length) % carouselOrder.length;

  const activeSlide = carouselOrder[carouselIndex];
  const activeDomId = domIdForSlide(activeSlide.id);

  SLIDE_DOM_IDS.forEach(domId => {
    $(domId).style.display = domId === activeDomId ? '' : 'none';
  });

  if (activeDomId === 'sectionSlide') {
    renderGenericSectionSlide(activeSlide.id, activeSlide.label);
  }

  updateSlideBadge();
}

const SECTION_PREVIEW_BUILDERS = {
  milestones: buildMilestonesPreview,
  outputs: buildOutputsPreview,
  timeline: buildTimelinePreview,
  changes: buildChangesPreview,
  risks: buildRisksPreview,
  whatif: buildWhatIfPreview,
  finance: buildFinancePreview,
  dashboard: buildDashboardPreview
};

function renderGenericSectionSlide(id, label) {
  $('sectionInner').style.fontFamily = state.font;
  $('sectionTitle').textContent = label;
  $('sectionTitle').style.color = state.fontColor;
  $('sectionHead').style.borderBottomColor = state.secondary;

  if (state.logoDataUrl) {
    $('sectionLogo').src = state.logoDataUrl;
    $('sectionLogo').style.display = 'block';
  } else {
    $('sectionLogo').style.display = 'none';
  }

  const builder = SECTION_PREVIEW_BUILDERS[id];
  $('sectionBody').innerHTML = builder ? builder() : '';
}

function buildMilestonesPreview() {
  const phases = getCheckedFieldItems('milestones');
  return phases.map(p => `
    <div class="pv-row">
      <div class="pv-row-label" style="color:${state.fontColor}">${p.label}</div>
      <div class="pv-row-bar-wrap">
        <div class="pv-row-bar-fill" style="width:${p.value}%;background:${state.secondary}"></div>
      </div>
      <div class="pv-row-value" style="color:${state.accent};font-weight:700;">${p.value}%</div>
    </div>
  `).join('');
}

function buildOutputsPreview() {
  const outputs = getCheckedFieldItems('outputs').map(f => f.value);
  return `<div class="pv-cards-grid cols-2">` + outputs.map(label => `
    <div class="pv-card align-right">
      <div class="pv-card-top-accent" style="background:${state.accent}"></div>
      <div class="pv-card-value" style="font-size:0.95vw;color:${state.fontColor}">${label}</div>
    </div>
  `).join('') + `</div>`;
}

function buildTimelinePreview() {
  const milestones = getCheckedFieldItems('timeline').map(f => f.value);
  const dots = milestones.map((label, i) => {
    
    
    const pct = milestones.length > 1 ? (i / (milestones.length - 1)) * 100 : 50;
    return `
      <div class="dot" style="right:${pct}%;background:${state.secondary}"></div>
      <div class="dot-label" style="right:${pct}%;color:${state.fontColor}">${label}</div>
    `;
  }).join('');
  return `
    <div class="pv-daterange" style="color:#64748B">من ${PROJECT.startDate} إلى ${PROJECT.endDate}</div>
    <div class="pv-timeline"><div class="line"></div>${dots}</div>
  `;
}

function buildChangesPreview() {
  const rows = getCheckedFieldItems('changes').map(f => ({ id: f.value.crId, status: f.value.status }));
  return rows.map(r => `
    <div class="pv-row">
      <div class="pv-row-label" style="color:${state.fontColor}">${r.id}</div>
      <div class="pv-row-value">${r.status}</div>
    </div>
  `).join('');
}

function buildRisksPreview() {
  const items = getCheckedFieldItems('risks');
  return `<div class="pv-cards-grid cols-3">` + items.map(item => `
    <div class="pv-card">
      <div class="pv-card-value" style="color:${state.fontColor}">${item.value}</div>
      <div class="pv-card-label">${item.label}</div>
    </div>
  `).join('') + `</div>`;
}

function buildWhatIfPreview() {
  const scenarios = getCheckedFieldItems('whatif').map(f => f.value);
  return scenarios.map(label => `
    <div class="pv-row has-accent">
      <div class="pv-accent-bar" style="background:${state.secondary}"></div>
      <div class="pv-row-label" style="color:${state.fontColor}">${label}</div>
    </div>
  `).join('');
}

function buildFinancePreview() {
  const cards = getCheckedFieldItems('finance');
  return `<div class="pv-cards-grid cols-3">` + cards.map(c => `
    <div class="pv-card">
      <div class="pv-card-top-accent" style="background:${state.accent}"></div>
      <div class="pv-card-label">${c.label}</div>
      <div class="pv-card-value" style="font-size:1.05vw;color:${state.fontColor}">${c.value}</div>
    </div>
  `).join('') + `</div>`;
}

function buildDashboardPreview() {
  const selected = state.selectedCharts
    .map(id => AVAILABLE_CHARTS.find(c => c.id === id))
    .filter(Boolean);

  if (!selected.length) return '';

  
  
  
  return `<div class="pv-cards-grid cols-2">` + selected.map(chart => {
    const imgDataUrl = renderDashboardChartImage(chart, state.font, {
      primary: state.primary, secondary: state.secondary, accent: state.accent
    });
    return `
      <div class="pv-card pv-dashboard-card">
        <div class="pv-card-label" style="font-weight:700;color:${state.fontColor}">${chart.label}</div>
        <img class="pv-dashboard-card-img" src="${imgDataUrl}" alt="${chart.label}" />
      </div>
    `;
  }).join('') + `</div>`;
}

$('prevSlideBtn').addEventListener('click', () => showCarouselSlide(carouselIndex - 1));
$('nextSlideBtn').addEventListener('click', () => showCarouselSlide(carouselIndex + 1));

$('fontSelect').addEventListener('change', e => {
  state.font = e.target.value;
  updateFontPreview();
  renderPreview();
});

function updateFontPreview() {
  $('fontPreview').style.fontFamily = state.font;
  $('fontPreview').textContent = state.font + ' — أبجد هوز حطي كلمن';
}

function updateFontCount() {
  const total = $('fontSelect').querySelectorAll('option').length;
  $('fontCount').textContent = `(${total} خطاً)`;
}
['primaryColor', 'secondaryColor', 'accentColor'].forEach(id => {
  const key = id.replace('Color', '');
  $(id).addEventListener('input', e => {
    state[key] = e.target.value;
    $(key + 'Hex').textContent = e.target.value.toUpperCase();
    renderPreview();
  });
});

$('fontColorInput').addEventListener('input', e => {
  state.fontColor = e.target.value;
  $('fontColorHex').textContent = e.target.value.toUpperCase();
  renderPreview();
});

$('logoInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    state.logoDataUrl = ev.target.result;
    $('logoImg').src = state.logoDataUrl;
    $('logoPreview').style.display = 'block';
    $('logoLabel').style.display = 'none';
    renderPreview();
  };
  reader.readAsDataURL(file);
});

$('logoRemove').addEventListener('click', e => {
  e.preventDefault();
  state.logoDataUrl = null;
  $('logoInput').value = '';
  $('logoPreview').style.display = 'none';
  $('logoLabel').style.display = 'block';
  renderPreview();
});

document.querySelectorAll('.preset').forEach(p => {
  p.addEventListener('click', () => applyPreset(PRESETS[p.dataset.preset]));
});

const TRASH_ICON_SVG = `
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
    <path d="M10 11v6M14 11v6"></path>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
  </svg>`;

function sectionRowHTML(section, deletable) {
  const fields = section.fields || [];
  const checked = state.sectionFieldState[section.id] || new Set();
  return `
    <div class="section-row" data-section-id="${section.id}">
      <button type="button" class="row-delete-btn" ${deletable ? '' : 'disabled'}
        title="${deletable ? 'إزالة القسم' : 'قسم أساسي — لا يمكن حذفه'}" aria-label="حذف القسم">
        ${TRASH_ICON_SVG}
      </button>
      <div class="section-row-body">
        <div class="section-row-head">
          <span class="dot"></span>
          <span class="name">${section.label}</span>
        </div>
        ${fields.length ? `
          <div class="chip-row">
            ${fields.map(f => {
              const isChecked = checked.has(f.id);
              return `
                <button type="button" class="chip ${isChecked ? 'chip--checked' : 'chip--unchecked'}"
                  data-field-id="${f.id}"
                  title="${isChecked ? 'إخفاء هذه البيانات من الشريحة' : 'إظهار هذه البيانات في الشريحة'}"
                  aria-pressed="${isChecked}">
                  <span class="chip-text">${f.label}</span>
                  <span class="chip-check">${isChecked ? '✓' : ''}</span>
                </button>`;
            }).join('')}
          </div>` : ''}
      </div>
    </div>`;
}

function renderSectionSelector() {
  const coreSections = AVAILABLE_SECTIONS.filter(s => s.core);
  const optionalSections = AVAILABLE_SECTIONS.filter(s => !s.core);
  const addedOptional = optionalSections.filter(s => state.selectedSections.includes(s.id));
  const notAdded = optionalSections.filter(s => !state.selectedSections.includes(s.id));

  $('sectionList').innerHTML =
    coreSections.map(s => sectionRowHTML(s, false)).join('') +
    addedOptional.map(s => sectionRowHTML(s, true)).join('');

  $('addSectionPanel').innerHTML = notAdded.length
    ? notAdded.map(s => `<div class="option" data-id="${s.id}">المشاريع - ${s.label}</div>`).join('')
    : `<div class="empty">تمت إضافة جميع الأقسام</div>`;
}

$('sectionList').addEventListener('click', e => {
  const delBtn = e.target.closest('.row-delete-btn');
  if (delBtn) {
    if (delBtn.disabled) return;
    const row = delBtn.closest('.section-row');
    removeSection(row.dataset.sectionId);
    return;
  }

  const chip = e.target.closest('.chip');
  if (chip) {
    const row = chip.closest('.section-row');
    toggleSectionField(row.dataset.sectionId, chip.dataset.fieldId);
  }
});

const addSectionBtn = $('addSectionBtn');
const addSectionPanel = $('addSectionPanel');
addSectionBtn.addEventListener('click', e => {
  e.stopPropagation();
  const willOpen = !addSectionPanel.classList.contains('open');
  addSectionPanel.classList.toggle('open', willOpen);
  addSectionBtn.setAttribute('aria-expanded', String(willOpen));
});
addSectionPanel.addEventListener('click', e => {
  const opt = e.target.closest('.option');
  if (!opt) return;
  const id = opt.dataset.id;
  if (!state.selectedSections.includes(id)) {
    state.selectedSections.push(id);
  }
  addSectionPanel.classList.remove('open');
  addSectionBtn.setAttribute('aria-expanded', 'false');
  renderSectionSelector();
  renderPreview();
});
document.addEventListener('click', e => {
  if (!addSectionPanel.classList.contains('open')) return;
  if (e.target.closest('.add-section-row')) return;
  addSectionPanel.classList.remove('open');
  addSectionBtn.setAttribute('aria-expanded', 'false');
});

function renderChartSelector() {
  $('chartChecklist').innerHTML = AVAILABLE_CHARTS.map(c => `
    <label class="chart-checkbox-item">
      <input type="checkbox" value="${c.id}" ${state.selectedCharts.includes(c.id) ? 'checked' : ''}>
      <span>${c.label}</span>
    </label>
  `).join('');
}

$('chartChecklist').addEventListener('change', e => {
  const cb = e.target.closest('input[type="checkbox"]');
  if (!cb) return;
  if (cb.checked) {
    if (!state.selectedCharts.includes(cb.value)) state.selectedCharts.push(cb.value);
  } else {
    state.selectedCharts = state.selectedCharts.filter(id => id !== cb.value);
  }
  renderPreview();
});

function showStatus(text, kind) {
  
  if (kind === 'success' || kind === 'error') return;
  const el = $('status');
  el.textContent = text;
  el.className = 'status-bar show ' + (kind || '');
  setTimeout(() => el.classList.remove('show'), 3000);
}

function hex(c) { return (c || '').replace('#', '').toUpperCase(); }

async function buildPptx() {
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_WIDE';
  pres.rtlMode = true;
  pres.title = PROJECT.name;
  
  
  const s1 = pres.addSlide();
  s1.background = { color: hex(state.primary) };
  
  s1.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.35, h: 7.5,
    fill: { color: hex(state.secondary) }, line: { color: hex(state.secondary), width: 0 }
  });
  s1.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 13.3, h: 0.12,
    fill: { color: hex(state.accent) }, line: { color: hex(state.accent), width: 0 }
  });
  
  if (state.logoDataUrl) {
    s1.addImage({ data: state.logoDataUrl, x: 11.7, y: 0.5, w: 1.0, h: 1.0 });
  }
  
  s1.addText(PROJECT.name, {
    x: 0.7, y: 2.7, w: 11.9, h: 1.4,
    fontFace: state.font, fontSize: 44, bold: true, color: 'FFFFFF',
    align: 'right', rtlMode: true, valign: 'middle', margin: 0
  });
  s1.addText(PROJECT.code, {
    x: 0.7, y: 4.1, w: 11.9, h: 0.5,
    fontFace: state.font, fontSize: 18, color: hex(state.accent),
    align: 'right', rtlMode: true, margin: 0
  });
  s1.addShape(pres.shapes.LINE, {
    x: 11.1, y: 4.8, w: 1.5, h: 0,
    line: { color: hex(state.secondary), width: 3 }
  });
  s1.addText('الجهة المنفذة:  ' + PROJECT.department, {
    x: 0.7, y: 5.1, w: 11.9, h: 0.4,
    fontFace: state.font, fontSize: 14, color: 'CCD3E0',
    align: 'right', rtlMode: true, margin: 0
  });
  s1.addText(new Date().toLocaleDateString('ar-SA', { year:'numeric', month:'long', day:'numeric' }), {
    x: 0.7, y: 6.7, w: 11.9, h: 0.4,
    fontFace: state.font, fontSize: 12, italic: true, color: 'A8B0C0',
    align: 'right', rtlMode: true, margin: 0
  });
  
  
  const sectionBuilders = {
    buildOverviewSlide, buildMilestonesSlide, buildOutputsSlide,
    buildTimelineSlide, buildChangeRequestsSlide, buildRisksSlide,
    buildWhatIfSlide, buildFinanceSlide
  };
  AVAILABLE_SECTIONS
    .filter(s => state.selectedSections.includes(s.id))
    .forEach(s => {
      const builder = sectionBuilders[s.slideBuilder];
      if (builder) builder(pres);
    });

  
  if (state.selectedCharts.length) {
    buildDashboardSlide(pres);
  }

  return pres;
}

function addSlideHeader(pres, slide, title) {
  slide.background = { color: 'FFFFFF' };
  slide.addText(title, {
    x: 0.6, y: 0.35, w: 12.1, h: 0.6,
    fontFace: state.font, fontSize: 28, bold: true, color: hex(state.fontColor),
    align: 'right', rtlMode: true, margin: 0
  });
  slide.addShape(pres.shapes.LINE, {
    x: 0.6, y: 1.0, w: 12.1, h: 0,
    line: { color: hex(state.secondary), width: 1.5 }
  });
  if (state.logoDataUrl) {
    slide.addImage({ data: state.logoDataUrl, x: 0.6, y: 0.3, w: 0.8, h: 0.8 });
  }
}

function buildOverviewSlide(pres) {
  const s2 = pres.addSlide();
  addSlideHeader(pres, s2, 'نظرة عامة على المشروع');

  const stats = getCheckedFieldItems('overview');
  const cardW = 3.9, cardH = 1.05, gap = 0.2, x0 = 0.6, y0 = 1.4;
  stats.forEach((stat, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = x0 + col * (cardW + gap);
    const y = y0 + row * (cardH + gap);
    s2.addShape(pres.shapes.RECTANGLE, {
      x, y, w: cardW, h: cardH,
      fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 0.75 }
    });
    s2.addShape(pres.shapes.RECTANGLE, {
      x: x + cardW - 0.08, y, w: 0.08, h: cardH,
      fill: { color: hex(state.secondary) }, line: { color: hex(state.secondary), width: 0 }
    });
    s2.addText(stat.label, {
      x: x + 0.2, y: y + 0.1, w: cardW - 0.4, h: 0.35,
      fontFace: state.font, fontSize: 11, color: '64748B',
      align: 'right', rtlMode: true, margin: 0
    });
    s2.addText(String(stat.value), {
      x: x + 0.2, y: y + 0.45, w: cardW - 0.4, h: 0.55,
      fontFace: state.font, fontSize: 16, bold: true, color: hex(state.fontColor),
      align: 'right', rtlMode: true, valign: 'middle', margin: 0
    });
  });

  s2.addText('نسبة الإنجاز', {
    x: 0.6, y: 4.0, w: 12.1, h: 0.4,
    fontFace: state.font, fontSize: 16, bold: true, color: hex(state.fontColor),
    align: 'right', rtlMode: true, margin: 0
  });
  const barX = 0.6, barY = 4.55, barW = 12.1, barH = 0.45;
  s2.addShape(pres.shapes.RECTANGLE, {
    x: barX, y: barY, w: barW, h: barH,
    fill: { color: 'F1F5F9' }, line: { color: 'E2E8F0', width: 0.5 }
  });
  const fillW = (barW * PROJECT.progress) / 100;
  s2.addShape(pres.shapes.RECTANGLE, {
    x: barX + barW - fillW, y: barY, w: fillW, h: barH,
    fill: { color: hex(state.secondary) }, line: { color: hex(state.secondary), width: 0 }
  });
  s2.addText(PROJECT.progress + '%', {
    x: barX, y: barY, w: barW, h: barH,
    fontFace: state.font, fontSize: 16, bold: true, color: 'FFFFFF',
    align: 'center', valign: 'middle', margin: 0
  });
}

function buildMilestonesSlide(pres) {
  const s = pres.addSlide();
  addSlideHeader(pres, s, 'مراحل المشروع');

  const phases = getCheckedFieldItems('milestones');

  const rowH = 0.85, x0 = 0.6, y0 = 1.4, w = 12.1;
  phases.forEach((p, i) => {
    const y = y0 + i * (rowH + 0.15);
    s.addShape(pres.shapes.RECTANGLE, {
      x: x0, y, w, h: rowH,
      fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 0.75 }
    });
    s.addText(p.label, {
      x: x0 + 0.3, y, w: 3.2, h: rowH,
      fontFace: state.font, fontSize: 15, bold: true, color: hex(state.fontColor),
      align: 'right', rtlMode: true, valign: 'middle', margin: 0
    });
    const barX = x0 + 3.7, barW = w - 3.7 - 1.5, barH = 0.35, barY = y + (rowH - barH) / 2;
    s.addShape(pres.shapes.RECTANGLE, {
      x: barX, y: barY, w: barW, h: barH,
      fill: { color: 'F1F5F9' }, line: { color: 'E2E8F0', width: 0.5 }
    });
    const fillW = (barW * p.value) / 100;
    s.addShape(pres.shapes.RECTANGLE, {
      x: barX + barW - fillW, y: barY, w: fillW, h: barH,
      fill: { color: hex(state.secondary) }, line: { color: hex(state.secondary), width: 0 }
    });
    s.addText(p.value + '%', {
      x: x0 + w - 1.2, y, w: 1.0, h: rowH,
      fontFace: state.font, fontSize: 14, bold: true, color: hex(state.accent),
      align: 'center', valign: 'middle', margin: 0
    });
  });
}

function buildOutputsSlide(pres) {
  const s = pres.addSlide();
  addSlideHeader(pres, s, 'المخرجات');

  const outputs = getCheckedFieldItems('outputs').map(f => f.value);
  const cardW = 5.95, cardH = 1.0, gapX = 0.2, gapY = 0.2, x0 = 0.6, y0 = 1.4;
  outputs.forEach((label, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = x0 + col * (cardW + gapX);
    const y = y0 + row * (cardH + gapY);
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: cardW, h: cardH,
      fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 0.75 }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + cardW - 0.08, y, w: 0.08, h: cardH,
      fill: { color: hex(state.accent) }, line: { color: hex(state.accent), width: 0 }
    });
    s.addText(label, {
      x: x + 0.25, y, w: cardW - 0.5, h: cardH,
      fontFace: state.font, fontSize: 14, bold: true, color: hex(state.fontColor),
      align: 'right', rtlMode: true, valign: 'middle', margin: 0
    });
  });
}

function buildTimelineSlide(pres) {
  const s = pres.addSlide();
  addSlideHeader(pres, s, 'الجدول الزمني');

  s.addText(`من ${PROJECT.startDate}  إلى  ${PROJECT.endDate}`, {
    x: 0.6, y: 1.3, w: 12.1, h: 0.4,
    fontFace: state.font, fontSize: 14, color: '64748B',
    align: 'right', rtlMode: true, margin: 0
  });
  const lineY = 3.2, lineX0 = 0.9, lineX1 = 12.4;
  s.addShape(pres.shapes.LINE, {
    x: lineX0, y: lineY, w: lineX1 - lineX0, h: 0,
    line: { color: 'E2E8F0', width: 2 }
  });
  const milestones = getCheckedFieldItems('timeline').map(f => f.value);
  
  const step = milestones.length > 1 ? (lineX1 - lineX0) / (milestones.length - 1) : 0;
  milestones.forEach((label, i) => {
    const x = milestones.length > 1 ? lineX1 - i * step : (lineX0 + lineX1) / 2; 
    s.addShape(pres.shapes.OVAL, {
      x: x - 0.09, y: lineY - 0.09, w: 0.18, h: 0.18,
      fill: { color: hex(state.secondary) }, line: { color: 'FFFFFF', width: 1.5 }
    });
    s.addText(label, {
      x: x - 1.0, y: lineY + 0.25, w: 2.0, h: 0.6,
      fontFace: state.font, fontSize: 11, color: hex(state.fontColor),
      align: 'center', rtlMode: true, margin: 0
    });
  });
}

function buildChangeRequestsSlide(pres) {
  const s = pres.addSlide();
  addSlideHeader(pres, s, 'طلبات التغيير');

  const rows = [
    { id: 'CR-01', status: 'معتمد' },
    { id: 'CR-02', status: 'قيد المراجعة' },
    { id: 'CR-03', status: 'مرفوض' }
  ];
  const rowH = 0.65, x0 = 0.6, y0 = 1.4, w = 12.1;
  rows.forEach((r, i) => {
    const y = y0 + i * (rowH + 0.12);
    s.addShape(pres.shapes.RECTANGLE, {
      x: x0, y, w, h: rowH,
      fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 0.75 }
    });
    s.addText(r.id, {
      x: x0 + 0.3, y, w: 3, h: rowH,
      fontFace: state.font, fontSize: 14, bold: true, color: hex(state.fontColor),
      align: 'right', rtlMode: true, valign: 'middle', margin: 0
    });
    s.addText(r.status, {
      x: x0 + 0.3, y, w: w - 0.6, h: rowH,
      fontFace: state.font, fontSize: 13, color: '475569',
      align: 'left', rtlMode: true, valign: 'middle', margin: 0
    });
  });
}

function buildRisksSlide(pres) {
  const s = pres.addSlide();
  addSlideHeader(pres, s, 'المخاطر');

  const riskChart = AVAILABLE_CHARTS.find(c => c.id === 'openRisks').sampleData[0];
  const items = riskChart.labels.map((label, i) => ({ label, value: riskChart.values[i] }));
  const cardW = 3.9, cardH = 1.6, gap = 0.2, x0 = 0.6, y0 = 1.6;
  items.forEach((item, i) => {
    const x = x0 + i * (cardW + gap);
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: y0, w: cardW, h: cardH,
      fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 0.75 }
    });
    s.addText(String(item.value), {
      x, y: y0 + 0.2, w: cardW, h: 0.8,
      fontFace: state.font, fontSize: 32, bold: true, color: hex(state.fontColor),
      align: 'center', margin: 0
    });
    s.addText(item.label, {
      x, y: y0 + 1.0, w: cardW, h: 0.4,
      fontFace: state.font, fontSize: 13, color: '64748B',
      align: 'center', rtlMode: true, margin: 0
    });
  });
}

function buildWhatIfSlide(pres) {
  const s = pres.addSlide();
  addSlideHeader(pres, s, 'ماذا لو ؟');

  const scenarios = [
    'ماذا لو تأخر التوريد؟',
    'ماذا لو زادت الميزانية المطلوبة؟',
    'ماذا لو تغيّر نطاق المشروع؟'
  ];
  const rowH = 0.75, x0 = 0.6, y0 = 1.4, w = 12.1;
  scenarios.forEach((label, i) => {
    const y = y0 + i * (rowH + 0.15);
    s.addShape(pres.shapes.RECTANGLE, {
      x: x0, y, w, h: rowH,
      fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 0.75 }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: x0, y, w: 0.08, h: rowH,
      fill: { color: hex(state.secondary) }, line: { color: hex(state.secondary), width: 0 }
    });
    s.addText(label, {
      x: x0 + 0.3, y, w: w - 0.6, h: rowH,
      fontFace: state.font, fontSize: 14, bold: true, color: hex(state.fontColor),
      align: 'right', rtlMode: true, valign: 'middle', margin: 0
    });
  });
}

function buildFinanceSlide(pres) {
  const s = pres.addSlide();
  addSlideHeader(pres, s, 'الأصول والمالية');

  const budgetChart = PLACEHOLDER_METRICS.budgetSplit;
  const [spent, remaining] = budgetChart.values;
  const cards = [
    { label: 'الميزانية الإجمالية', value: fmt(PROJECT.budget) + ' ' + PROJECT.budgetCurrency },
    { label: 'المصروف',            value: fmt(spent) + ' ' + PROJECT.budgetCurrency },
    { label: 'المتبقي',             value: fmt(remaining) + ' ' + PROJECT.budgetCurrency }
  ];
  const cardW = 3.9, cardH = 1.4, gap = 0.2, x0 = 0.6, y0 = 1.6;
  cards.forEach((c, i) => {
    const x = x0 + i * (cardW + gap);
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: y0, w: cardW, h: cardH,
      fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 0.75 }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: y0, w: cardW, h: 0.08,
      fill: { color: hex(state.accent) }, line: { color: hex(state.accent), width: 0 }
    });
    s.addText(c.label, {
      x, y: y0 + 0.25, w: cardW, h: 0.4,
      fontFace: state.font, fontSize: 12, color: '64748B',
      align: 'center', rtlMode: true, margin: 0
    });
    s.addText(c.value, {
      x, y: y0 + 0.7, w: cardW, h: 0.5,
      fontFace: state.font, fontSize: 16, bold: true, color: hex(state.fontColor),
      align: 'center', margin: 0
    });
  });
}

function buildDashboardSlide(pres) {
  const s = pres.addSlide();
  addSlideHeader(pres, s, 'لوحة المعلومات');

  const selected = state.selectedCharts
    .map(id => AVAILABLE_CHARTS.find(c => c.id === id))
    .filter(Boolean);

  const cols = 2, cellW = 5.95, cellH = 2.55, gapX = 0.2, gapY = 0.2, x0 = 0.6, y0 = 1.3;

  selected.forEach((chart, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = x0 + col * (cellW + gapX);
    const y = y0 + row * (cellH + gapY);

    s.addText(chart.label, {
      x, y, w: cellW, h: 0.3,
      fontFace: state.font, fontSize: 12, bold: true, color: hex(state.fontColor),
      align: 'right', rtlMode: true, margin: 0
    });

    const imgDataUrl = renderDashboardChartImage(chart, state.font, {
      primary: state.primary, secondary: state.secondary, accent: state.accent
    });
    s.addImage({
      data: imgDataUrl,
      x, y: y + 0.3, w: cellW, h: cellH - 0.3
    });
  });
}

$('downloadBtn').addEventListener('click', async () => {
  const btn = $('downloadBtn');
  btn.disabled = true;
  btn.textContent = 'جاري التوليد...';
  showStatus('جاري بناء العرض...');
  
  try {
    const pres = await buildPptx();
    const safeName = PROJECT.name.replace(/\s+/g, '-').slice(0, 40);
    await pres.writeFile({ fileName: `${safeName}.pptx` });
    showStatus('✓ تم تنزيل العرض بنجاح', 'success');
  } catch (err) {
    console.error(err);
    showStatus('✕ حدث خطأ: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '⬇  تنزيل العرض (.pptx)';
  }
});

updateFontCount();
updateFontPreview();
renderSectionSelector();
renderChartSelector();
renderPreview();
