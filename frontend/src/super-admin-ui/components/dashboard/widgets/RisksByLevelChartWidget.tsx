import { useMemo, useRef, useState } from 'react'
import { Card } from '../../ui/Card'
import { useLiveField } from '../../../../features/portal/DashboardLiveContext'
import { WidgetBodyGate } from '../../../../features/portal/WidgetBodyGate'

const SEGMENTS = [
  { key: 'low', label: 'منخفض', color: '#17B26A' },
  { key: 'medium', label: 'متوسط', color: '#F79009' },
  { key: 'high', label: 'مرتفع', color: '#F04438' },
] as const;

const LEGEND_ITEMS = [...SEGMENTS].reverse();

const CURRENT_MONTH = new Date()
  .toLocaleString('en-US', { month: 'short' })
  .toUpperCase();

const CHART_W = 700;
const CHART_H = 230;
const PADDING_LEFT = 26;
const PADDING_BOTTOM = 26;
const PADDING_TOP = 10;
const SEGMENT_GAP = 3;
const SEGMENT_RADIUS = 4;
const BAR_WIDTH = 22;

function niceMax(value: number) {
  const step = 3;
  return Math.ceil(value / step) * step || step;
}

interface HoverInfo {
  x: number;
  y: number;
  label: string;
  value: number;
  color: string;
  segKey: string;
  month: string;
}

export function RisksByLevelChartWidget() {
  const risksByMonth = useLiveField('risksByMonth') ?? []
  const plotRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<HoverInfo | null>(null)

  const { ticks, maxValue, plotW, plotH } = useMemo(() => {
    const totals = risksByMonth.map((m) => m.low + m.medium + m.high)
    const max = niceMax(Math.max(...totals, 1))
    return {
      ticks: [0, max * 0.25, max * 0.5, max * 0.75, max],
      maxValue: max,
      plotW: CHART_W - PADDING_LEFT,
      plotH: CHART_H - PADDING_TOP - PADDING_BOTTOM,
    }
  }, [risksByMonth])

  const slotW = plotW / Math.max(risksByMonth.length, 1);
  const scaleY = (value: number) => (value / maxValue) * plotH;

  const handleEnter = (
    e: React.MouseEvent<SVGRectElement>,
    seg: { label: string; color: string; key: string },
    value: number,
    month: string,
  ) => {
    const container = plotRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setHover({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      label: seg.label,
      value,
      color: seg.color,
      segKey: seg.key,
      month,
    });
  };

  return (
    <Card className="widget-risks-chart">
      <div className="widget-risks-chart__header">
        <div className="widget-icon-header">
          <p className="widget-title">المخاطر المفتوحة حسب المستوى</p>
        </div>
        <div className="widget-risks-chart__legend">
          {LEGEND_ITEMS.map((item) => (
            <span key={item.key} className="widget-risks-chart__legend-item">
              <span
                className="widget-risks-chart__legend-dot"
                style={{ background: item.color }}
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <WidgetBodyGate isEmpty={risksByMonth.length === 0}>
      <div className="widget-risks-chart__plot" ref={plotRef}>
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          preserveAspectRatio="none"
          className="widget-risks-chart__svg"
        >
          {ticks.map((tick) => {
            const y = PADDING_TOP + (plotH - scaleY(tick));
            return (
              <text
                key={tick}
                x={PADDING_LEFT - 10}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="widget-risks-chart__tick"
              >
                {Math.round(tick)}
              </text>
            );
          })}

          {risksByMonth.map((row, i) => {
            const slotX = PADDING_LEFT + i * slotW;
            const barX = slotX + (slotW - BAR_WIDTH) / 2;
            const baseline = PADDING_TOP + plotH;
            const isActive = row.month === CURRENT_MONTH;

            let cursor = baseline;
            const segments = SEGMENTS.map((seg) => {
              const value = row[seg.key];
              if (!value) return null;
              const h = scaleY(value);
              const y = cursor - h;
              cursor = y - SEGMENT_GAP;
              return { ...seg, y, h, value };
            }).filter(Boolean) as {
              y: number;
              h: number;
              color: string;
              key: string;
              label: string;
              value: number;
            }[];

            return (
              <g key={row.month}>
                {segments.map((seg) => {
                  const isHovered =
                    hover?.month === row.month && hover?.segKey === seg.key;
                  return (
                    <rect
                      key={seg.key}
                      x={barX}
                      y={seg.y}
                      width={BAR_WIDTH}
                      height={Math.max(seg.h, SEGMENT_RADIUS * 2)}
                      rx={SEGMENT_RADIUS}
                      ry={SEGMENT_RADIUS}
                      fill={seg.color}
                      opacity={isHovered ? 0.75 : 1}
                      className="widget-risks-chart__segment"
                      onMouseEnter={(e) => handleEnter(e, seg, seg.value, row.month)}
                      onMouseMove={(e) => handleEnter(e, seg, seg.value, row.month)}
                      onMouseLeave={() => setHover(null)}
                    />
                  );
                })}
                <text
                  x={slotX + slotW / 2}
                  y={CHART_H - 6}
                  textAnchor="middle"
                  className={
                    isActive
                      ? 'widget-risks-chart__month widget-risks-chart__month--active'
                      : 'widget-risks-chart__month'
                  }
                >
                  {row.month}
                </text>
              </g>
            );
          })}
        </svg>

        {hover && (
          <div
            className="widget-risks-chart__tooltip"
            style={{ left: hover.x, top: hover.y }}
          >
            <span
              className="widget-risks-chart__tooltip-dot"
              style={{ background: hover.color }}
            />
            {hover.label}: <strong>{hover.value}</strong>
          </div>
        )}
      </div>
      </WidgetBodyGate>
    </Card>
  );
}
