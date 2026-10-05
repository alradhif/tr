// Receives the selected project's data from TrackPlus (PptGeneratorFrame) and replaces the
// sample values in config.js, so the preview and the downloaded .pptx show real project data.
(function () {
  const EMPTY = 'لا توجد بيانات مسجلة';

  function clean(value) {
    return String(value == null ? '' : value).replace(/</g, '‹').replace(/>/g, '›').trim();
  }

  function setFields(sectionId, items) {
    const section = AVAILABLE_SECTIONS.find(s => s.id === sectionId);
    if (!section) return;
    section.fields = items.length ? items : [{ id: 'empty', label: EMPTY }];
    state.sectionFieldState[sectionId] = new Set(section.fields.map(f => f.id));
  }

  function applyData(data) {
    const p = data.project || {};
    const budget = Number(p.budget) || 0;
    const spent = Number(p.spent) || 0;
    Object.assign(PROJECT, {
      name: clean(p.name) || PROJECT.name,
      code: clean(p.code),
      department: clean(p.department) || '—',
      projectManager: clean(p.projectManager) || '—',
      sponsor: clean(p.sponsor) || '—',
      startDate: clean(p.startDate) || '—',
      endDate: clean(p.endDate) || '—',
      budget,
      budgetCurrency: clean(p.budgetCurrency) || 'SAR',
      statusLabel: clean(p.statusLabel) || '—',
      progress: Math.max(0, Math.min(100, Math.round(Number(p.progress) || 0)))
    });

    const phases = (data.phases || []).map((phase, i) => ({
      id: 'phase' + (i + 1),
      label: clean(phase.name),
      progress: Math.max(0, Math.min(100, Math.round(Number(phase.progress) || 0))),
      endDate: clean(phase.endDate).slice(0, 10)
    }));
    setFields('milestones', phases.map(ph => ({ id: ph.id, label: ph.label })));
    PLACEHOLDER_METRICS.phaseProgress = { labels: phases.map(ph => ph.label), values: phases.map(ph => ph.progress) };
    setFields('timeline', phases.map(ph => ({ id: ph.id, label: ph.endDate ? `${ph.label} (${ph.endDate})` : ph.label })));

    setFields('outputs', (data.outputs || []).map((name, i) => ({ id: 'output' + (i + 1), label: clean(name) })));

    const requests = (data.changeRequests || []).map((cr, i) => ({ id: 'cr' + (i + 1), title: clean(cr.title), status: clean(cr.status) }));
    setFields('changes', requests.map(cr => ({ id: cr.id, label: cr.title })));
    CHANGE_REQUEST_VALUES = {};
    requests.forEach(cr => { CHANGE_REQUEST_VALUES[cr.id] = { crId: cr.title, status: cr.status }; });
    if (!requests.length) CHANGE_REQUEST_VALUES = { empty: { crId: EMPTY, status: '' } };

    const scenarios = (data.scenarios || []).map((text, i) => ({ id: 'scenario' + (i + 1), label: clean(text) }));
    setFields('whatif', scenarios);
    WHATIF_VALUES = {};
    scenarios.forEach(sc => { WHATIF_VALUES[sc.id] = sc.label; });
    if (!scenarios.length) WHATIF_VALUES = { empty: EMPTY };

    const risks = data.risks || {};
    const riskValues = [Number(risks.high) || 0, Number(risks.medium) || 0, Number(risks.low) || 0];
    AVAILABLE_CHARTS.find(c => c.id === 'openRisks').sampleData[0].values = riskValues;

    PLACEHOLDER_METRICS.budgetSplit = { labels: ['مصروف', 'متبقي'], values: [spent, Math.max(0, budget - spent)] };

    // Charts: project-level figures only. The portfolio status and monthly risk charts have no
    // per-project source, so they are replaced by the phase schedule split or removed.
    const done = phases.filter(ph => ph.progress >= 100).length;
    const notStarted = phases.filter(ph => ph.progress <= 0).length;
    const statusChart = AVAILABLE_CHARTS.find(c => c.id === 'projectStatus');
    if (statusChart) {
      statusChart.label = 'مراحل المشروع حسب الجدول';
      statusChart.colors = ['17B26A', '2E90FA', 'E7E8EB'];
      statusChart.sampleData = [{ name: 'المراحل', labels: ['منتهية', 'جارية', 'لم تبدأ'], values: [done, phases.length - done - notStarted, notStarted] }];
    }
    const monthly = AVAILABLE_CHARTS.findIndex(c => c.id === 'risksByLevel');
    if (monthly >= 0) AVAILABLE_CHARTS.splice(monthly, 1);
    state.selectedCharts = state.selectedCharts.filter(id => AVAILABLE_CHARTS.some(c => c.id === id));
    const avg = AVAILABLE_CHARTS.find(c => c.id === 'avgProgress');
    if (avg) {
      avg.label = 'تقدم المشروع';
      avg.sampleData = [{ name: 'تقدم المشروع', labels: ['التقدم', 'المتبقي'], values: [PROJECT.progress, 100 - PROJECT.progress] }];
    }

    $('coverCode').textContent = PROJECT.code;
    $('coverDept').textContent = 'الجهة المنفذة:  ' + PROJECT.department;
    $('barFill').style.width = PROJECT.progress + '%';
    const barText = document.querySelector('#barFill + .bar-text');
    if (barText) barText.textContent = PROJECT.progress + '%';
    renderSectionSelector();
    renderChartSelector();
    renderPreview();
  }

  window.addEventListener('message', event => {
    if (event.origin !== window.location.origin) return;
    if (!event.data || event.data.type !== 'TRACKPLUS_PPT_DATA' || !event.data.payload) return;
    applyData(event.data.payload);
  });
})();
