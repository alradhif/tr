

const CHART_IMG_W = 900;
const CHART_IMG_H = 340;
const CHART_IMG_SCALE = 3; 

function makeChartCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w * CHART_IMG_SCALE;
  canvas.height = h * CHART_IMG_SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(CHART_IMG_SCALE, CHART_IMG_SCALE);
  return { canvas, ctx };
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function donutChartToDataURL({ labels, values, colors, valueSuffix = '', legendStyle = 'plain', font = 'Tajawal' }) {
  const W = CHART_IMG_W, H = CHART_IMG_H;
  const { canvas, ctx } = makeChartCanvas(W, H);

  const total = values.reduce((a, b) => a + b, 0) || 1;
  const outerR = Math.min(H * 0.46, 118);
  const innerR = outerR * 0.6;
  const cx = W * 0.2, cy = H / 2;
  const padRad = (2 * Math.PI) / 180; 

  let angle = -Math.PI / 2;
  values.forEach((v, i) => {
    const sweep = (v / total) * Math.PI * 2;
    const a0 = angle + padRad / 2;
    const a1 = angle + sweep - padRad / 2;
    if (a1 > a0) {
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, a0, a1, false);
      ctx.arc(cx, cy, innerR, a1, a0, true);
      ctx.closePath();
      ctx.fillStyle = '#' + colors[i % colors.length];
      ctx.fill();
    }
    angle += sweep;
  });

  
  const legendX0 = W * 0.42;
  const legendX1 = W - 16;
  const rowH = H / labels.length;
  ctx.textBaseline = 'middle';

  labels.forEach((label, i) => {
    const rowTop = rowH * i + rowH * 0.14;
    const rowH2 = rowH * 0.72;
    const midY = rowTop + rowH2 / 2;
    const color = '#' + colors[i % colors.length];

    if (legendStyle === 'pill') {
      roundRect(ctx, legendX0, rowTop, legendX1 - legendX0, rowH2, 10);
      ctx.fillStyle = '#f4f4f5';
      ctx.fill();
    }

    
    ctx.font = `700 15px ${font}, "Segoe UI", sans-serif`;
    const rightEdge = legendX1 - 14;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#18181b';
    ctx.fillText(label, rightEdge, midY);
    const labelW = ctx.measureText(label).width;
    const dotX = rightEdge - labelW - 10;
    ctx.beginPath();
    ctx.arc(dotX, midY, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    
    const valueText = String(values[i]) + valueSuffix;
    ctx.font = `700 15px ${font}, "Segoe UI", sans-serif`;
    if (legendStyle === 'pill') {
      ctx.fillStyle = '#18181b';
      ctx.textAlign = 'left';
      ctx.fillText(valueText, legendX0 + 14, midY);
    } else {
      
      
      
      const labelColLeft = rightEdge - Math.max(labelW + 14, W * 0.16);
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText(valueText, (legendX0 + labelColLeft) / 2, midY);
    }
  });

  return canvas.toDataURL('image/png');
}

function stackedBarChartToDataURL({ months, series, currentMonth, font = 'Tajawal' }) {
  const W = CHART_IMG_W, H = CHART_IMG_H;
  const { canvas, ctx } = makeChartCanvas(W, H);

  const legendH = 34;
  const plotTop = legendH + 16;
  const plotBottom = H - 32;
  const plotLeft = 46;
  const plotRight = W - 10;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;

  
  
  
  ctx.font = `700 13px ${font}, "Segoe UI", sans-serif`;
  ctx.textBaseline = 'middle';
  let lx = plotRight;
  [...series].reverse().forEach((item) => {
    const textW = ctx.measureText(item.label).width;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#18181b';
    ctx.fillText(item.label, lx, legendH / 2 + 2);
    const dotX = lx - textW - 10;
    ctx.beginPath();
    ctx.arc(dotX, legendH / 2 + 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#' + item.color;
    ctx.fill();
    lx = dotX - 18;
  });

  
  
  const totals = months.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] || 0), 0));
  const maxTotal = Math.max(...totals, 0);
  const step = 3;
  const niceMax = Math.ceil(maxTotal / step) * step || step;

  ctx.font = `12px ${font}, "Segoe UI", sans-serif`;
  ctx.fillStyle = '#71717a';
  ctx.textAlign = 'right';
  [0, 0.25, 0.5, 0.75, 1].forEach((f) => {
    const t = Math.round(niceMax * f);
    const y = plotBottom - f * plotH;
    ctx.fillText(String(t), plotLeft - 10, y + 4);
  });

  
  const slotW = plotW / months.length;
  const barW = Math.min(30, slotW * 0.46);
  const gap = 3, radius = 5;

  months.forEach((month, mi) => {
    const slotX = plotLeft + mi * slotW;
    const barX = slotX + (slotW - barW) / 2;
    let cursorY = plotBottom;

    series.forEach((s) => {
      const v = s.values[mi] || 0;
      if (!v) return;
      const segH = (v / niceMax) * plotH;
      const y = cursorY - segH;
      roundRect(ctx, barX, y, barW, Math.max(segH, radius * 2), radius);
      ctx.fillStyle = '#' + s.color;
      ctx.fill();
      cursorY = y - gap;
    });

    const isActive = month === currentMonth;
    ctx.font = isActive ? `700 12px ${font}, "Segoe UI", sans-serif` : `12px ${font}, "Segoe UI", sans-serif`;
    ctx.fillStyle = isActive ? '#18181b' : '#a1a1aa';
    ctx.textAlign = 'center';
    ctx.fillText(month, slotX + slotW / 2, plotBottom + 22);
  });

  return canvas.toDataURL('image/png');
}

function hexToHsl(hex) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const toHex = v => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return (toHex(r) + toHex(g) + toHex(b)).toUpperCase();
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  };
}

function colorDistance(hexA, hexB) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

const MIN_SLICE_DISTANCE = 70; 

function ensureDistinguishable(colorsHex) {
  const hsls = colorsHex.map(hexToHsl);
  for (let i = 1; i < hsls.length; i++) {
    let guard = 0;
    while (guard < 16) {
      const current = hslToHex(hsls[i].h, hsls[i].s, hsls[i].l);
      const clash = hsls.slice(0, i).some((prev, j) =>
        colorDistance(current, hslToHex(prev.h, prev.s, prev.l)) < MIN_SLICE_DISTANCE
      );
      if (!clash) break;
      if (guard < 10) {
        
        
        const dir = hsls[i].l >= 50 ? 1 : -1;
        hsls[i].l = Math.max(14, Math.min(88, hsls[i].l + dir * (8 + guard)));
      } else {
        
        
        hsls[i].h = (hsls[i].h + 35) % 360;
      }
      guard++;
    }
  }
  return hsls.map(c => hslToHex(c.h, c.s, c.l));
}

function brandChartPalette(count, brandColors) {
  const pool = [brandColors && brandColors.primary, brandColors && brandColors.secondary, brandColors && brandColors.accent]
    .filter(Boolean);
  if (!pool.length) return null;

  const raw = [];
  for (let i = 0; i < count; i++) {
    if (i < pool.length) {
      raw.push(pool[i].toUpperCase().replace('#', ''));
    } else {
      const src = hexToHsl(pool[i % pool.length]);
      const variant = Math.floor(i / pool.length);
      raw.push(hslToHex(src.h + variant * 40, src.s, src.l));
    }
  }
  return ensureDistinguishable(raw);
}

function renderDashboardChartImage(chart, font, brandColors) {
  if (chart.type === 'doughnut') {
    const d = chart.sampleData[0];
    
    
    
    
    
    let colors;
    if (chart.id === 'avgProgress' && brandColors && brandColors.primary) {
      const p = hexToHsl(brandColors.primary);
      colors = [
        brandColors.primary.toUpperCase().replace('#', ''),
        hslToHex(p.h, Math.max(8, p.s * 0.25), 92)
      ];
    } else {
      colors = brandChartPalette(d.labels.length, brandColors) || chart.colors;
    }
    return donutChartToDataURL({
      labels: d.labels,
      values: d.values,
      colors,
      valueSuffix: (chart.id === 'projectStatus' || chart.id === 'avgProgress') ? '%' : '',
      legendStyle: chart.id === 'projectStatus' ? 'pill' : 'plain',
      font
    });
  }

  const colors = brandChartPalette(chart.sampleData.length, brandColors) || chart.colors;
  const currentMonth = new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const months = chart.sampleData[0].labels;
  const series = chart.sampleData.map((s, i) => ({
    label: s.name,
    color: colors[i % colors.length],
    values: s.values
  }));
  return stackedBarChartToDataURL({ months, series, currentMonth, font });
}
