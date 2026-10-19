import React, { useRef, useState } from 'react';
import { formatMRU } from '../../lib/utils';
import { LineChart, BarChart3 } from 'lucide-react';
import { Tooltip, TooltipBubble } from './Tooltip';

export interface MonthlyCollectionReport {
  mois: string;
  attendu: number;
  encaisse: number;
  taux: number;
  impayes: number;
}

interface CollectionChartProps {
  data: MonthlyCollectionReport[];
  className?: string;
}

export const CollectionChart: React.FC<CollectionChartProps> = ({
  data,
  className = '',
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxAttendu = Math.max(...data.map((d) => d.attendu), 1);
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 25;
  const usableWidth = 700;
  const usableHeight = chartHeight - paddingY * 2;

  // Calcul des coordonnées pour la courbe lissée (Bézier)
  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * (usableWidth - paddingX * 2);
    const y = chartHeight - paddingY - (d.encaisse / maxAttendu) * usableHeight;
    const yTarget = chartHeight - paddingY - (d.attendu / maxAttendu) * usableHeight;
    return { x, y, yTarget, ...d };
  });

  // Construction du chemin SVG Bézier cubique pour une courbe ultra-douce
  const generateBezierPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;

    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i !== pts.length - 2 ? pts[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    return path;
  };

  const linePath = generateBezierPath(points);
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : '';

  // Ligne de l'objectif attendu (en pointillés lissés)
  const targetLinePath = generateBezierPath(points.map((p) => ({ x: p.x, y: p.yTarget })));

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  // Point de la courbe ou barre survolé, vers lequel pointe l'infobulle de données.
  const hoveredAnchorRef = useRef<Element | null>(null);
  const hoverPoint = (idx: number, anchor: Element | null) => {
    hoveredAnchorRef.current = anchor;
    setHoveredIndex(idx);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-subtle pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-main flex items-center gap-2.5">
            <LineChart className="h-5 w-5 text-primary-text shrink-0" />
            <span>Évolution Chronologique des Encaissements</span>
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Suivi mensuel de la trésorerie : montant réel encaissé vs objectif budgétaire attendu.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Légende harmonieuse */}
          <div className="flex items-center gap-4 text-xs font-semibold text-secondary">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-primary shadow-xs" />
              <span>Encaissé Réel</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-surface-subtle border border-subtle" />
              <span>Attendu Total</span>
            </div>
          </div>

          {/* Toggle Type de Graphique */}
          <div className="flex items-center p-0.5 rounded-sm bg-surface-subtle border border-subtle">
            <Tooltip content="Affichage en Courbe">
              <button
                type="button"
                onClick={() => setChartType('line')}
                className={`p-1.5 rounded-sm text-xs font-bold flex items-center gap-1.5 transition-colors focus-halo cursor-pointer ${
                  chartType === 'line'
                    ? 'bg-surface text-primary-text shadow-xs border border-subtle'
                    : 'text-muted hover:text-main'
                }`}
                aria-label="Affichage en Courbe"
              >
                <LineChart className="h-4 w-4" />
                <span className="hidden md:inline">Courbe</span>
              </button>
            </Tooltip>
            <Tooltip content="Affichage en Barres">
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`p-1.5 rounded-sm text-xs font-bold flex items-center gap-1.5 transition-colors focus-halo cursor-pointer ${
                  chartType === 'bar'
                    ? 'bg-surface text-primary-text shadow-xs border border-subtle'
                    : 'text-muted hover:text-main'
                }`}
                aria-label="Affichage en Barres"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden md:inline">Barres</span>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Surface principale du graphique */}
      <div className="relative pt-2">
        {chartType === 'line' ? (
          <div className="relative overflow-x-auto">
            <svg
              viewBox={`0 0 ${usableWidth} ${chartHeight}`}
              className="w-full h-64 sm:h-72 overflow-visible"
            >
              <defs>
                {/* Dégradé doux d'aire */}
                <linearGradient id="collectionAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                </linearGradient>

                {/* Dégradé de la ligne principale */}
                <linearGradient id="collectionLineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--primary-text)" />
                  <stop offset="100%" stopColor="var(--primary)" />
                </linearGradient>
              </defs>

              {/* Lignes horizontales de repère */}
              {[0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = chartHeight - paddingY - ratio * usableHeight;
                return (
                  <g key={ratio}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={usableWidth - paddingX}
                      y2={y}
                      stroke="var(--border-subtle)"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 4}
                      textAnchor="end"
                      fill="var(--text-muted)"
                      className="text-xs font-medium tabular-nums"
                    >
                      {Math.round(ratio * 100)}%
                    </text>
                  </g>
                );
              })}

              {/* Ligne d'objectif Attendu (pointillés neutres) */}
              <path
                d={targetLinePath}
                fill="none"
                stroke="var(--border-strong)"
                strokeWidth="1.5"
                strokeDasharray="5 5"
              />

              {/* Aire colorée sous la courbe */}
              <path
                d={areaPath}
                fill="url(#collectionAreaGradient)"
                className="transition-all duration-300"
              />

              {/* Courbe principale Encaissé */}
              <path
                d={linePath}
                fill="none"
                stroke="url(#collectionLineGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />

              {/* Points interactifs au survol */}
              {points.map((p, idx) => {
                const isHovered = hoveredIndex === idx;

                return (
                  <g
                    key={p.mois}
                    className="cursor-pointer group"
                    onMouseEnter={(e) => hoverPoint(idx, e.currentTarget.querySelector('[data-chart-anchor]'))}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Zone d'accroche invisible large pour confort tactile */}
                    <rect
                      x={p.x - 20}
                      y={0}
                      width={40}
                      height={chartHeight}
                      fill="transparent"
                    />

                    {/* Ligne verticale de repère au survol */}
                    {isHovered && (
                      <line
                        x1={p.x}
                        y1={paddingY}
                        x2={p.x}
                        y2={chartHeight - paddingY}
                        stroke="var(--primary)"
                        strokeDasharray="3 3"
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Point cible objectif */}
                    <circle
                      cx={p.x}
                      cy={p.yTarget}
                      r={3}
                      fill="var(--border-strong)"
                    />

                    {/* Halo interactif au survol */}
                    {isHovered && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={12}
                        fill="var(--primary)"
                        fillOpacity="0.2"
                      />
                    )}

                    {/* Point principal encaissé */}
                    <circle
                      data-chart-anchor=""
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 6 : 4.5}
                      fill="var(--surface)"
                      stroke="var(--primary)"
                      strokeWidth={isHovered ? 3.5 : 2.5}
                      className="transition-all"
                    />

                    {/* Étiquette mois en bas */}
                    <text
                      x={p.x}
                      y={chartHeight - 6}
                      textAnchor="middle"
                      fill={isHovered ? 'var(--primary-text)' : 'var(--text-muted)'}
                      className={`text-xs font-semibold transition-colors ${
                        isHovered ? 'font-bold' : ''
                      }`}
                    >
                      {p.mois.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          /* Vue Barres Harmonisée */
          <div className="grid grid-cols-7 gap-3 sm:gap-6 items-end h-64 border-b border-subtle px-4 pt-4">
            {data.map((r, idx) => {
              const heightPercent = Math.min(Math.round((r.encaisse / maxAttendu) * 100), 100);
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={r.mois}
                  className="flex flex-col items-center gap-2.5 h-full justify-end group cursor-pointer focus-halo"
                  onMouseEnter={(e) => hoverPoint(idx, e.currentTarget.querySelector('[data-chart-anchor]'))}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div
                    className={`text-xs font-semibold tabular-nums transition-opacity ${
                      isHovered ? 'opacity-100 text-primary-text font-bold' : 'opacity-0 group-hover:opacity-100 text-secondary'
                    }`}
                  >
                    {r.taux}%
                  </div>

                  {/* Conteneur de barre : fond = Attendu total, remplissage = Encaissé réel */}
                  <div className="w-full max-w-[48px] bg-surface-subtle rounded-t-sm h-full flex items-end overflow-hidden relative border border-subtle shadow-xs">
                    <div
                      data-chart-anchor=""
                      className={`w-full rounded-t-sm transition-all duration-500 bg-primary ${
                        isHovered ? 'brightness-110' : ''
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>

                  <span
                    className={`text-xs font-semibold text-center truncate max-w-[80px] transition-colors ${
                      isHovered
                        ? 'text-primary-text font-bold'
                        : 'text-muted'
                    }`}
                  >
                    {r.mois.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Infobulle de données */}
        {activePoint && (
          <TooltipBubble
            anchorRef={hoveredAnchorRef}
            content={
              <span className="block space-y-1">
                <span className="flex items-center justify-between gap-4 border-b border-subtle pb-1">
                  <span className="font-bold text-main">{activePoint.mois}</span>
                  <span className="font-semibold tabular-nums text-secondary">{activePoint.taux}% recouvré</span>
                </span>
                <span className="flex items-center justify-between gap-4">
                  <span className="font-medium text-muted">Encaissé</span>
                  <span className="tabular-nums text-main font-bold">{formatMRU(activePoint.encaisse)}</span>
                </span>
                <span className="flex items-center justify-between gap-4">
                  <span className="font-medium text-muted">Attendu total</span>
                  <span className="tabular-nums text-secondary">{formatMRU(activePoint.attendu)}</span>
                </span>
                {activePoint.impayes > 0 && (
                  <span className="flex items-center justify-between gap-4 text-danger-text">
                    <span className="font-medium">Reste impayé</span>
                    <span className="tabular-nums font-bold">{formatMRU(activePoint.impayes)}</span>
                  </span>
                )}
              </span>
            }
          />
        )}
      </div>
    </div>
  );
};
