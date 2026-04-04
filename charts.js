// NormEval Dashboard — charts.js
// ECharts initialization for all charts
// Architecture: all data comes from pre-computed DATA_* constants in data.js

const COLORS = {
  blue: '#5b8def',
  green: '#4ecb71',
  orange: '#f0983e',
  red: '#ef5b5b',
  purple: '#a78bfa',
  cyan: '#22d3ee',
  bg: '#1c1f2e',
  border: '#2a2d42',
  text: '#e4e6f0',
  textMuted: '#6b6f89',
  textSecondary: '#9498b3',
};

const AXIS_COLORS = { ND: COLORS.blue, PE: COLORS.green, CI: COLORS.orange };

// Common dark theme options
function baseTheme() {
  return {
    backgroundColor: 'transparent',
    textStyle: { color: COLORS.textSecondary, fontFamily: 'Inter, sans-serif' },
    legend: { textStyle: { color: COLORS.textSecondary } },
    tooltip: {
      backgroundColor: '#1c1f2e',
      borderColor: '#2a2d42',
      textStyle: { color: COLORS.text, fontSize: 12 },
    },
  };
}

// Lazy chart init map
const chartInstances = {};
function getChart(id) {
  if (!chartInstances[id]) {
    const el = document.getElementById(id);
    if (!el) return null;
    chartInstances[id] = echarts.init(el, null, { renderer: 'canvas' });
  }
  return chartInstances[id];
}

// ============================================================
// Tab 1: Overview — Gates Donut
// ============================================================
function renderGatesDonut() {
  const chart = getChart('chart-gates-donut');
  if (!chart) return;
  const d = DATA_OVERVIEW;
  const failReasons = d.fail_reasons;
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: Object.assign(baseTheme().tooltip, { trigger: 'item' }),
    series: [{
      type: 'pie',
      radius: ['45%', '72%'],
      center: ['50%', '52%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#1c1f2e', borderWidth: 2 },
      label: { color: COLORS.text, fontSize: 11 },
      data: [
        { value: d.n_pass, name: 'Pass (' + d.n_pass + ')', itemStyle: { color: COLORS.green } },
        { value: failReasons.nd_only, name: 'Fail: ND gate (' + failReasons.nd_only + ')', itemStyle: { color: COLORS.red } },
        { value: failReasons.data_only, name: 'Fail: Data gate (' + failReasons.data_only + ')', itemStyle: { color: COLORS.orange } },
        { value: failReasons.both, name: 'Fail: Both (' + failReasons.both + ')', itemStyle: { color: '#8b5cf6' } },
      ]
    }]
  }));
}

// ============================================================
// Tab 1: Overview — Tradition Frequency Bar
// ============================================================
function renderTraditionFreqBar() {
  const chart = getChart('chart-tradition-freq');
  if (!chart) return;
  const d = DATA_OVERVIEW.tradition_freq;
  const tColors = [COLORS.purple, COLORS.blue, COLORS.orange, COLORS.red, COLORS.cyan];
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: Object.assign(baseTheme().tooltip, { trigger: 'axis' }),
    xAxis: {
      type: 'category',
      data: d.map(function(t) { return t.name; }),
      axisLabel: { color: COLORS.textSecondary, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'value',
      name: 'Benchmarks',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.border } },
    },
    series: [{
      type: 'bar',
      data: d.map(function(t, i) {
        return { value: t.count, itemStyle: { color: tColors[i], borderRadius: [4, 4, 0, 0] } };
      }),
      barWidth: '50%',
      label: { show: true, position: 'top', color: COLORS.text, fontSize: 12, fontWeight: 600 }
    }]
  }));
}

// ============================================================
// Tab 3: Feature Matrix Heatmap
// ============================================================
function renderFeatureHeatmap() {
  var chart = getChart('chart-feature-heatmap');
  if (!chart) return;
  var fm = DATA_FEATURE_MATRIX;
  var heatData = [];
  // Normalize columns to 0-100 for color mapping
  var colMins = [], colMaxes = [];
  for (var c = 0; c < fm.columns.length; c++) {
    var minV = Infinity, maxV = -Infinity;
    for (var r = 0; r < fm.data.length; r++) {
      var v = fm.data[r][c];
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
    colMins.push(minV);
    colMaxes.push(maxV);
  }

  for (var r = 0; r < fm.data.length; r++) {
    for (var c = 0; c < fm.columns.length; c++) {
      var raw = fm.data[r][c];
      var norm = colMaxes[c] === colMins[c] ? 50 : ((raw - colMins[c]) / (colMaxes[c] - colMins[c])) * 100;
      heatData.push([c, r, Math.round(norm), raw]);
    }
  }

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      backgroundColor: '#1c1f2e',
      borderColor: '#2a2d42',
      textStyle: { color: COLORS.text, fontSize: 11 },
      formatter: function(p) {
        return '<b>' + fm.row_names[p.value[1]] + '</b><br/>' +
               fm.columns[p.value[0]] + ': ' + p.value[3] +
               ' <span style="color:' + AXIS_COLORS[fm.column_axes[p.value[0]]] + '">(' +
               fm.column_axes[p.value[0]] + ')</span>';
      }
    },
    grid: { left: 200, right: 40, top: 60, bottom: 30 },
    xAxis: {
      type: 'category',
      data: fm.columns,
      position: 'top',
      axisLabel: { color: COLORS.textSecondary, fontSize: 10, rotate: 30 },
      axisLine: { lineStyle: { color: COLORS.border } },
      splitArea: { show: false },
    },
    yAxis: {
      type: 'category',
      data: fm.row_names,
      inverse: true,
      axisLabel: {
        color: function(value, index) {
          return fm.passes_gates[index] ? COLORS.green : COLORS.textMuted;
        },
        fontSize: 10,
        width: 180,
        overflow: 'truncate'
      },
      axisLine: { lineStyle: { color: COLORS.border } },
      splitArea: { show: false },
    },
    visualMap: {
      min: 0, max: 100,
      calculable: false, show: false,
      inRange: {
        color: ['#1a1a2e', '#1a3a5c', '#2563eb', '#60a5fa', '#93c5fd']
      }
    },
    series: [{
      type: 'heatmap',
      data: heatData,
      emphasis: { itemStyle: { borderColor: '#fff', borderWidth: 1 } },
      itemStyle: { borderColor: '#0f1117', borderWidth: 1, borderRadius: 2 },
    }]
  }));
}

// ============================================================
// Tab 4: Tradition Heatmap
// ============================================================
function renderTraditionHeatmap() {
  var chart = getChart('chart-tradition-heatmap');
  if (!chart) return;
  var tc = DATA_TRADITION_COVERAGE;
  var heatData = [];
  for (var r = 0; r < tc.heatmap.length; r++) {
    for (var c = 0; c < tc.traditions.length; c++) {
      heatData.push([c, r, tc.heatmap[r][c]]);
    }
  }
  var tColors = [COLORS.purple, COLORS.blue, COLORS.orange, COLORS.red, COLORS.cyan];
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      backgroundColor: '#1c1f2e', borderColor: '#2a2d42',
      textStyle: { color: COLORS.text, fontSize: 11 },
      formatter: function(p) {
        return '<b>' + tc.benchmark_names[p.value[1]] + '</b><br/>' +
               tc.traditions[p.value[0]] + ': ' + p.value[2];
      }
    },
    grid: { left: 200, right: 40, top: 50, bottom: 30 },
    xAxis: {
      type: 'category',
      data: tc.traditions,
      position: 'top',
      axisLabel: { color: COLORS.textSecondary, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'category',
      data: tc.benchmark_names,
      inverse: true,
      axisLabel: {
        color: function(value, index) {
          return tc.passes_gates[index] ? COLORS.green : COLORS.textMuted;
        },
        fontSize: 10, width: 180, overflow: 'truncate'
      },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    visualMap: {
      min: 0, max: 100, show: true, orient: 'horizontal',
      left: 'center', bottom: 0,
      textStyle: { color: COLORS.textMuted },
      inRange: {
        color: ['#1a1a2e', '#3b0764', '#7c3aed', '#a78bfa', '#c4b5fd']
      }
    },
    series: [{
      type: 'heatmap',
      data: heatData,
      itemStyle: { borderColor: '#0f1117', borderWidth: 1, borderRadius: 2 },
      emphasis: { itemStyle: { borderColor: '#fff', borderWidth: 1 } },
    }]
  }));
}

function renderTraditionBar() {
  var chart = getChart('chart-tradition-bar');
  if (!chart) return;
  var d = DATA_TRADITION_COVERAGE.frequency;
  var tColors = [COLORS.purple, COLORS.blue, COLORS.orange, COLORS.red, COLORS.cyan];
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: Object.assign(baseTheme().tooltip, { trigger: 'axis' }),
    xAxis: {
      type: 'value',
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'category',
      data: d.map(function(t) { return t.name; }),
      axisLabel: { color: COLORS.textSecondary, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    series: [{
      type: 'bar',
      data: d.map(function(t, i) {
        return { value: t.count, itemStyle: { color: tColors[i], borderRadius: [0, 4, 4, 0] } };
      }),
      label: { show: true, position: 'right', color: COLORS.text, fontSize: 12, fontWeight: 600 }
    }]
  }));
}

function renderEntropy() {
  var chart = getChart('chart-entropy');
  if (!chart) return;
  var tc = DATA_TRADITION_COVERAGE;
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      backgroundColor: '#1c1f2e', borderColor: '#2a2d42',
      textStyle: { color: COLORS.text, fontSize: 11 },
      trigger: 'axis',
      formatter: function(params) {
        var p = params[0];
        return '<b>' + tc.benchmark_names[p.dataIndex] + '</b><br/>Entropy: ' + p.value;
      }
    },
    grid: { left: 200, right: 30, top: 10, bottom: 30 },
    xAxis: {
      type: 'value', name: 'Shannon Entropy (bits)',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'category',
      data: tc.benchmark_names,
      inverse: true,
      axisLabel: { color: COLORS.textMuted, fontSize: 9, width: 170, overflow: 'truncate' },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    series: [{
      type: 'bar',
      data: tc.entropies.map(function(e, i) {
        return {
          value: e,
          itemStyle: { color: tc.passes_gates[i] ? COLORS.green : COLORS.textMuted, borderRadius: [0, 3, 3, 0] }
        };
      }),
      barWidth: 8,
    }]
  }));
}

// ============================================================
// Tab 5: Composite Scoring — ND vs PE Scatter
// ============================================================
function renderNDPEScatter() {
  var chart = getChart('chart-nd-pe-scatter');
  if (!chart) return;
  var scatter = DATA_COMPOSITE_SCORING.scatter;
  var passData = [], failData = [];
  for (var i = 0; i < scatter.length; i++) {
    var s = scatter[i];
    var item = [s.nd, s.pe, s.ci, s.name, s.composite];
    if (s.passes) passData.push(item);
    else failData.push(item);
  }

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      backgroundColor: '#1c1f2e', borderColor: '#2a2d42',
      textStyle: { color: COLORS.text, fontSize: 11 },
      formatter: function(p) {
        var d = p.data;
        return '<b>' + d[3] + '</b><br/>' +
               'ND: ' + d[0] + ' | PE: ' + d[1] + ' | CI: ' + d[2] +
               '<br/>Composite: ' + d[4];
      }
    },
    legend: {
      data: ['Pass Gates', 'Fail Gates'],
      textStyle: { color: COLORS.textSecondary },
      top: 5,
    },
    grid: { left: 60, right: 30, top: 50, bottom: 50 },
    xAxis: {
      type: 'value', name: 'Normative Depth (ND)',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.border } },
      min: 10, max: 95,
    },
    yAxis: {
      type: 'value', name: 'Practical Ecosystem (PE)',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.border } },
      min: 20, max: 100,
    },
    series: [
      {
        name: 'Pass Gates', type: 'scatter',
        data: passData,
        symbolSize: function(d) { return Math.max(8, d[2] / 3); },
        itemStyle: { color: COLORS.green, opacity: 0.85 },
        label: {
          show: true, formatter: function(p) { return p.data[3].substring(0, 12); },
          position: 'right', color: COLORS.textSecondary, fontSize: 9,
        },
      },
      {
        name: 'Fail Gates', type: 'scatter',
        data: failData,
        symbolSize: function(d) { return Math.max(8, d[2] / 3); },
        itemStyle: { color: COLORS.red, opacity: 0.5 },
      },
    ]
  }));
}

function renderGateSensitivity() {
  var chart = getChart('chart-gate-sensitivity');
  if (!chart) return;
  var gt = DATA_COMPOSITE_SCORING.gate_threshold;
  var thresholds = Object.keys(gt).sort();
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: Object.assign(baseTheme().tooltip, { trigger: 'axis' }),
    xAxis: {
      type: 'category',
      data: thresholds.map(function(k) { return k.replace('ND_gate_', 'ND >= '); }),
      axisLabel: { color: COLORS.textSecondary, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'value', name: 'Passing Count',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.border } },
      min: 10, max: 20,
    },
    series: [{
      type: 'line',
      data: thresholds.map(function(k) { return gt[k]; }),
      itemStyle: { color: COLORS.blue },
      lineStyle: { width: 2 },
      symbol: 'circle',
      symbolSize: 8,
      label: { show: true, position: 'top', color: COLORS.text, fontSize: 12, fontWeight: 600 },
      markLine: {
        silent: true,
        data: [{ yAxis: 15, lineStyle: { color: COLORS.orange, type: 'dashed' }, label: { formatter: 'Current Top 15', color: COLORS.orange } }]
      }
    }]
  }));
}

// ============================================================
// Tab 6: Trials
// ============================================================
function renderTrialsBar() {
  var chart = getChart('chart-trials-bar');
  if (!chart) return;
  var trials = DATA_TRIAL_DATA.trials;
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: Object.assign(baseTheme().tooltip, { trigger: 'axis' }),
    legend: { data: ['Accuracy', 'Discriminative Power'], textStyle: { color: COLORS.textSecondary }, top: 5 },
    grid: { left: 50, right: 20, top: 50, bottom: 40 },
    xAxis: {
      type: 'category',
      data: trials.map(function(t) { return t.id; }),
      axisLabel: { color: COLORS.textSecondary, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'value', name: '%',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.border } },
      min: 0, max: 100,
    },
    series: [
      {
        name: 'Accuracy', type: 'bar',
        data: trials.map(function(t) {
          return { value: t.accuracy, itemStyle: { color: COLORS.green, borderRadius: [4, 4, 0, 0] } };
        }),
        barGap: '10%',
      },
      {
        name: 'Discriminative Power', type: 'bar',
        data: trials.map(function(t) {
          return { value: t.discriminative, itemStyle: { color: COLORS.blue, borderRadius: [4, 4, 0, 0] } };
        }),
      },
    ]
  }));
}

function renderDifficultyPie() {
  var chart = getChart('chart-difficulty-pie');
  if (!chart) return;
  var dd = DATA_TRIAL_DATA.difficulty_distribution;
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: Object.assign(baseTheme().tooltip, { trigger: 'item' }),
    series: [{
      type: 'pie',
      radius: ['40%', '68%'],
      center: ['50%', '55%'],
      itemStyle: { borderRadius: 6, borderColor: '#1c1f2e', borderWidth: 2 },
      label: { color: COLORS.text, fontSize: 11 },
      data: [
        { value: dd.Easy, name: 'Easy (' + dd.Easy + ')', itemStyle: { color: COLORS.green } },
        { value: dd.Medium, name: 'Medium (' + dd.Medium + ')', itemStyle: { color: COLORS.orange } },
        { value: dd.Hard, name: 'Hard (' + dd.Hard + ')', itemStyle: { color: COLORS.red } },
      ]
    }]
  }));
}

// ============================================================
// Tab 7: Data Availability
// ============================================================
function renderHostBar() {
  var chart = getChart('chart-host-bar');
  if (!chart) return;
  var d = DATA_AVAILABILITY.host_distribution;
  var hostColors = { GitHub: COLORS.green, HuggingFace: COLORS.purple, Other: COLORS.blue, None: COLORS.red };
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: Object.assign(baseTheme().tooltip, { trigger: 'axis' }),
    xAxis: {
      type: 'category',
      data: d.map(function(h) { return h.name; }),
      axisLabel: { color: COLORS.textSecondary, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'value', name: 'Count',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.border } },
    },
    series: [{
      type: 'bar',
      data: d.map(function(h) {
        return { value: h.count, itemStyle: { color: hostColors[h.name] || COLORS.blue, borderRadius: [4, 4, 0, 0] } };
      }),
      label: { show: true, position: 'top', color: COLORS.text, fontSize: 12, fontWeight: 600 }
    }]
  }));
}

function renderLicensePie() {
  var chart = getChart('chart-license-pie');
  if (!chart) return;
  var d = DATA_AVAILABILITY.license_distribution;
  var licColors = [COLORS.blue, COLORS.green, COLORS.orange, COLORS.purple, COLORS.cyan, COLORS.red];
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: Object.assign(baseTheme().tooltip, { trigger: 'item' }),
    series: [{
      type: 'pie',
      radius: ['35%', '68%'],
      center: ['50%', '55%'],
      itemStyle: { borderRadius: 6, borderColor: '#1c1f2e', borderWidth: 2 },
      label: { color: COLORS.text, fontSize: 10 },
      data: d.map(function(l, i) {
        return { value: l.count, name: l.name + ' (' + l.count + ')', itemStyle: { color: licColors[i % licColors.length] } };
      })
    }]
  }));
}

// ============================================================
// Tab 9: Gaps — Care Ethics Prototype Dimensions
// ============================================================
function renderCarePrototypeDims() {
  var chart = getChart('chart-care-dims');
  if (!chart) return;
  var cp = DATA_GAPS.care_prototype;
  if (!cp) return;
  var dims = cp.dimensions;
  var dimColors = [COLORS.green, COLORS.blue, COLORS.orange, COLORS.purple];
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: Object.assign(baseTheme().tooltip, { trigger: 'axis' }),
    grid: { left: 120, right: 50, top: 20, bottom: 30 },
    xAxis: {
      type: 'value', name: '%', min: 80, max: 100,
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'category',
      data: dims.map(function(d) { return d.name; }),
      axisLabel: { color: COLORS.textSecondary, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    series: [{
      type: 'bar',
      data: dims.map(function(d, i) {
        return {
          value: d.pct,
          itemStyle: { color: dimColors[i], borderRadius: [0, 4, 4, 0] }
        };
      }),
      label: {
        show: true, position: 'right', color: COLORS.text, fontSize: 12, fontWeight: 600,
        formatter: function(p) { return p.value + '%'; }
      }
    }]
  }));
}

// ============================================================
// Tab 9: Gaps — Void Bar
// ============================================================
function renderVoidBar() {
  var chart = getChart('chart-void-bar');
  if (!chart) return;
  var freq = DATA_OVERVIEW.tradition_freq;
  var tColors = [COLORS.purple, COLORS.blue, COLORS.orange, COLORS.red, COLORS.cyan];
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: Object.assign(baseTheme().tooltip, { trigger: 'axis' }),
    grid: { left: 120, right: 40, top: 20, bottom: 30 },
    xAxis: {
      type: 'value', name: 'Benchmarks >= 50',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.border } },
      max: 30,
    },
    yAxis: {
      type: 'category',
      data: freq.map(function(t) { return t.name; }),
      axisLabel: { color: COLORS.textSecondary, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    series: [{
      type: 'bar',
      data: freq.map(function(t, i) {
        return {
          value: t.count,
          itemStyle: {
            color: t.count <= 2 ? COLORS.red : tColors[i],
            borderRadius: [0, 4, 4, 0]
          }
        };
      }),
      label: {
        show: true, position: 'right', color: COLORS.text, fontSize: 12, fontWeight: 600,
        formatter: function(p) { return p.value + (p.value <= 2 ? ' (VOID)' : ''); }
      }
    }]
  }));
}


// ============================================================
// Render all charts (called from app.js on tab show)
// ============================================================
function renderOverviewCharts() {
  renderGatesDonut();
  renderTraditionFreqBar();
}

function renderFeatureCharts() {
  renderFeatureHeatmap();
}

function renderTraditionCharts() {
  renderTraditionHeatmap();
  renderTraditionBar();
  renderEntropy();
}

function renderCompositeCharts() {
  renderNDPEScatter();
  renderGateSensitivity();
}

function renderTrialCharts() {
  renderTrialsBar();
  renderDifficultyPie();
}

function renderDataCharts() {
  renderHostBar();
  renderLicensePie();
}

function renderGapsCharts() {
  renderVoidBar();
  renderCarePrototypeDims();
}

// Resize handler
window.addEventListener('resize', function() {
  Object.values(chartInstances).forEach(function(c) { c.resize(); });
});
