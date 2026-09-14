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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <LineChart className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Évolution Chronologique des Encaissements</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Suivi mensuel de la trésorerie : montant réel encaissé vs objectif budgétaire attendu.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Légende harmonieuse */}
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-600 dark:bg-blue-500 shadow-xs" />
              <span>Encaissé Réel</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span>Attendu Total</span>
            </div>
          </div>

          {/* Toggle Type de Graphique */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
            <Tooltip content="Affichage en Courbe">
              <button
                type="button"
                onClick={() => setChartType('line')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  chartType === 'line'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                aria-label="Affichage en Courbe"
              >
                <LineChart className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Courbe</span>
              </button>
            </Tooltip>
            <Tooltip content="Affichage en Barres">
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  chartType === 'bar'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                aria-label="Affichage en Barres"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Barres</span>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="relative pt-2 pb-2 select-none">
        {chartType === 'line' ? (
          <div className="w-full relative overflow-hidden">
            <svg
              viewBox={`0 0 ${usableWidth} ${chartHeight}`}
              className="w-full h-64 sm:h-72 overflow-visible"
            >
              <defs>
                {/* Dégradé doux d'aire */}
                <linearGradient id="blueAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>

                {/* Dégradé de la ligne principale */}
                <linearGradient id="blueLineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
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
                      stroke="currentColor"
                      className="text-slate-200/80 dark:text-slate-800/80"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="fill-slate-400 dark:fill-slate-500 text-[9px] font-mono"
                    >
                      {Math.round(ratio * 100)}%
                    </text>
                  </g>
                );
              })}

              {/* Ligne d'objectif Attendu (pointillés gris neutre élégant) */}
              <path
                d={targetLinePath}
                fill="none"
                stroke="currentColor"
                className="text-slate-300 dark:text-slate-700"
                strokeWidth="1.5"
                strokeDasharray="5 5"
              />

              {/* Aire colorée sous la courbe */}
              <path
                d={areaPath}
                fill="url(#blueAreaGradient)"
                className="transition-all duration-300"
              />

              {/* Courbe principale Encaissé */}
              <path
                d={linePath}
                fill="none"
                stroke="url(#blueLineGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300 filter drop-shadow-xs"
              />

              {/* Ligne verticale de repère au survol */}
              {activePoint && (
                <line
                  x1={activePoint.x}
                  y1={paddingY}
                  x2={activePoint.x}
                  y2={chartHeight - paddingY}
                  stroke="currentColor"
                  className="text-blue-500/60 dark:text-blue-400/60"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}

              {/* Points de données interactifs */}
              {points.map((p, idx) => {
                const isHovered = hoveredIndex === idx;
                return (
                  <g
                    key={p.mois}
                    className="cursor-pointer"
                    onMouseEnter={(e) => hoverPoint(idx, e.currentTarget.querySelector('[data-chart-anchor]'))}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Zone de contact élargie transparente pour faciliter le survol tactile/souris */}
                    <circle cx={p.x} cy={p.y} r={18} fill="transparent" />

                    {/* Point cible attendu */}
                    <circle
                      cx={p.x}
                      cy={p.yTarget}
                      r={3}
                      className="fill-slate-400 dark:fill-slate-600"
                    />

                    {/* Halo interactif au survol */}
                    {isHovered && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={12}
                        className="fill-blue-500/20 dark:fill-blue-400/30 animate-pulse"
                      />
                    )}

                    {/* Point principal encaissé */}
                    <circle
                      data-chart-anchor=""
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 6 : 4.5}
                      className="fill-white dark:fill-slate-900 stroke-blue-600 dark:stroke-blue-400 transition-all"
                      strokeWidth={isHovered ? 3.5 : 2.5}
                    />

                    {/* Étiquette mois en bas */}
                    <text
                      x={p.x}
                      y={chartHeight - 6}
                      textAnchor="middle"
                      className={`text-[11px] font-bold transition-colors ${
                        isHovered
                          ? 'fill-blue-600 dark:fill-blue-400 font-extrabold'
                          : 'fill-slate-500 dark:fill-slate-400'
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
          /* Vue Barres Harmonisée (Bleu cohérent pour Encaissé, Slate neutre pour Attendu) */
          <div className="grid grid-cols-7 gap-3 sm:gap-6 items-end h-64 border-b border-slate-200 dark:border-slate-800 px-4 pt-4">
            {data.map((r, idx) => {
              const heightPercent = Math.min(Math.round((r.encaisse / maxAttendu) * 100), 100);
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={r.mois}
                  className="flex flex-col items-center gap-2.5 h-full justify-end group cursor-pointer"
                  onMouseEnter={(e) => hoverPoint(idx, e.currentTarget.querySelector('[data-chart-anchor]'))}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div
                    className={`text-xs font-mono font-bold transition-opacity ${
                      isHovered ? 'opacity-100 text-blue-600 dark:text-blue-400' : 'opacity-0 group-hover:opacity-100 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {r.taux}%
                  </div>

                  {/* Conteneur de barre : fond = Attendu total, remplissage = Encaissé réel */}
                  <div className="w-full max-w-[48px] bg-slate-100 dark:bg-slate-800 rounded-t-xl h-full flex items-end overflow-hidden relative border border-slate-200/70 dark:border-slate-700/70 shadow-2xs">
                    <div
                      data-chart-anchor=""
                      className={`w-full rounded-t-xl transition-all duration-500 bg-blue-600 dark:bg-blue-500 ${
                        isHovered ? 'brightness-110' : ''
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>

                  <span
                    className={`text-xs font-bold text-center truncate max-w-[80px] transition-colors ${
                      isHovered
                        ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {r.mois.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Infobulle de données : même bulle que les autres tooltips de l'application */}
        {activePoint && (
          <TooltipBubble
            anchorRef={hoveredAnchorRef}
            content={
              <span className="block space-y-1">
                <span className="flex items-center justify-between gap-4 border-b border-white/15 pb-1">
                  <span className="font-bold">{activePoint.mois}</span>
                  <span className="font-mono font-medium text-slate-300">{activePoint.taux}% recouvré</span>
                </span>
                <span className="flex items-center justify-between gap-4">
                  <span className="font-medium text-slate-300">Encaissé</span>
                  <span className="font-mono">{formatMRU(activePoint.encaisse)}</span>
                </span>
                <span className="flex items-center justify-between gap-4">
                  <span className="font-medium text-slate-300">Attendu total</span>
                  <span className="font-mono">{formatMRU(activePoint.attendu)}</span>
                </span>
                {activePoint.impayes > 0 && (
                  <span className="flex items-center justify-between gap-4 text-rose-300">
                    <span className="font-medium">Reste impayé</span>
                    <span className="font-mono">{formatMRU(activePoint.impayes)}</span>
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
