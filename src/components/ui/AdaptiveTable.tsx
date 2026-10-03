import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { LayoutGrid, Table as TableIcon, Inbox } from 'lucide-react';

export interface AdaptiveColumn<T> {
  id: string;
  header: React.ReactNode;
  /** Custom render for desktop table cell */
  render?: (item: T, index: number) => React.ReactNode;
  /** Property accessor or fallback value renderer */
  accessor?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'center' | 'right';

  /**
   * Mobile card semantics:
   * - 'avatar': Rendered as leading visual in card header
   * - 'title': Primary heading of card
   * - 'subtitle': Muted secondary info under title
   * - 'badge': Right-aligned status/pill in card header
   * - 'key-fact': Rendered in the 2-column key facts grid (default)
   * - 'action': Rendered in the bottom full-width action bar
   * - 'ignore': Do not show in the default mobile card
   */
  cardRole?: 'avatar' | 'title' | 'subtitle' | 'badge' | 'key-fact' | 'action' | 'ignore';
  /** Custom label to show in the mobile card key-facts grid (defaults to header) */
  cardLabel?: React.ReactNode;
  /** Hide entirely on the card view */
  hideOnCard?: boolean;
}

export interface AdaptiveTableProps<T> {
  data: T[];
  columns: AdaptiveColumn<T>[];
  keyExtractor: (item: T, index: number) => string;

  /** Custom Card Renderer for maximum flexibility when a page requires custom mobile layout */
  renderCustomCard?: (item: T, index: number) => React.ReactNode;

  /** Empty & Loading states */
  emptyState?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  isLoading?: boolean;

  /** Selection / Checkbox support */
  selectable?: boolean;
  isSelected?: (item: T) => boolean;
  onToggleSelect?: (item: T) => void;
  isAllSelected?: boolean;
  onToggleSelectAll?: () => void;

  /** Click handlers */
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T, index: number) => string;

  /** Styling overrides */
  className?: string;
  tableClassName?: string;
  cardsContainerClassName?: string;
  cardClassName?: string;
  /** Whether to wrap the table in an outer rounded card (set false if parent already provides it) */
  bordered?: boolean;

  /** Optional toggle to force table or cards view */
  showViewToggle?: boolean;
  defaultView?: 'auto' | 'table' | 'cards';
}

export function AdaptiveTable<T>({
  data,
  columns,
  keyExtractor,
  renderCustomCard,
  emptyState,
  emptyTitle = 'Aucune donnée disponible',
  emptyDescription = 'Aucun élément ne correspond aux critères actuels.',
  isLoading = false,
  selectable = false,
  isSelected,
  onToggleSelect,
  isAllSelected = false,
  onToggleSelectAll,
  onRowClick,
  rowClassName,
  className,
  tableClassName,
  cardsContainerClassName,
  cardClassName,
  bordered = true,
  showViewToggle = false,
  defaultView = 'auto',
}: AdaptiveTableProps<T>) {
  const [activeView, setActiveView] = useState<'auto' | 'table' | 'cards'>(defaultView);

  // Categorize columns for default mobile card synthesis
  const avatarCol = columns.find((c) => c.cardRole === 'avatar');
  const titleCol = columns.find((c) => c.cardRole === 'title');
  const subtitleCol = columns.find((c) => c.cardRole === 'subtitle');
  const badgeCol = columns.find((c) => c.cardRole === 'badge');
  const actionCols = columns.filter((c) => c.cardRole === 'action');
  const keyFactCols = columns.filter(
    (c) =>
      !c.hideOnCard &&
      c.cardRole !== 'avatar' &&
      c.cardRole !== 'title' &&
      c.cardRole !== 'subtitle' &&
      c.cardRole !== 'badge' &&
      c.cardRole !== 'action' &&
      c.cardRole !== 'ignore'
  );

  const getCellContent = (col: AdaptiveColumn<T>, item: T, index: number): React.ReactNode => {
    if (col.render) return col.render(item, index);
    if (col.accessor) return col.accessor(item);
    return null;
  };

  // Render Default Empty State
  const renderEmpty = () => {
    if (emptyState) return emptyState;
    return (
      <div className="py-12 px-4 text-center space-y-3">
        <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
          <Inbox className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{emptyTitle}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">{emptyDescription}</p>
      </div>
    );
  };

  // Render Table View (Desktop & Tablet)
  const renderTableContent = () => (
    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
      <table className={cn('w-full text-left text-xs border-collapse', tableClassName)}>
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {selectable && (
              <th className="py-3.5 px-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Sélectionner tous les éléments"
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
            )}
            {columns.map((col) => {
              const alignClass =
                col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left';
              return (
                <th
                  key={col.id}
                  className={cn(
                    'py-3.5 px-4 whitespace-nowrap',
                    alignClass,
                    col.headerClassName,
                    col.className
                  )}
                >
                  {col.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="py-8"
              >
                {renderEmpty()}
              </td>
            </tr>
          ) : (
            data.map((item, index) => {
              const key = keyExtractor(item, index);
              const checked = isSelected ? isSelected(item) : false;
              const extraRowClass = rowClassName ? rowClassName(item, index) : '';

              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    'transition-colors duration-150',
                    onRowClick && 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40',
                    checked && 'bg-blue-50/60 dark:bg-blue-950/30',
                    extraRowClass
                  )}
                >
                  {selectable && (
                    <td
                      className="py-3.5 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleSelect?.(item)}
                        aria-label="Sélectionner la ligne"
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                  )}
                  {columns.map((col) => {
                    const alignClass =
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                        ? 'text-right'
                        : 'text-left';
                    return (
                      <td
                        key={col.id}
                        className={cn('py-3.5 px-4', alignClass, col.className)}
                      >
                        {getCellContent(col, item, index)}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  const renderTable = () => {
    if (!bordered) return renderTableContent();
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        {renderTableContent()}
      </div>
    );
  };

  // Render Mobile Cards View
  const renderCards = () => {
    if (data.length === 0) {
      return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          {renderEmpty()}
        </div>
      );
    }

    return (
      <div className={cn('space-y-3', cardsContainerClassName)}>
        {/* Mobile select all banner if selectable */}
        {selectable && onToggleSelectAll && (
          <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800/60 rounded-lg text-xs text-slate-600 dark:text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onToggleSelectAll}
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span>Tout sélectionner</span>
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {data.filter((i) => isSelected?.(i)).length}/{data.length}
            </span>
          </div>
        )}

        {data.map((item, index) => {
          if (renderCustomCard) {
            return (
              <React.Fragment key={keyExtractor(item, index)}>
                {renderCustomCard(item, index)}
              </React.Fragment>
            );
          }

          const key = keyExtractor(item, index);
          const checked = isSelected ? isSelected(item) : false;
          const extraRowClass = rowClassName ? rowClassName(item, index) : '';

          return (
            <div
              key={key}
              onClick={() => onRowClick?.(item)}
              className={cn(
                'rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs transition-all duration-150 space-y-3 text-left',
                onRowClick && 'cursor-pointer active:scale-[0.99] hover:border-slate-300 dark:hover:border-slate-700',
                checked && 'ring-2 ring-blue-500 bg-blue-50/30 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800',
                cardClassName,
                extraRowClass
              )}
            >
              {/* Card Top: Checkbox, Avatar, Title, Subtitle, Badge */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {selectable && (
                    <div
                      className="pt-0.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleSelect?.(item)}
                        aria-label="Sélectionner cet élément"
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                  )}

                  {avatarCol && (
                    <div className="shrink-0">
                      {getCellContent(avatarCol, item, index)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    {titleCol ? (
                      <div className="font-bold text-slate-900 dark:text-white text-sm leading-snug truncate">
                        {getCellContent(titleCol, item, index)}
                      </div>
                    ) : (
                      // Fallback: use first column content as title
                      <div className="font-bold text-slate-900 dark:text-white text-sm leading-snug truncate">
                        {getCellContent(columns[0], item, index)}
                      </div>
                    )}

                    {subtitleCol && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {getCellContent(subtitleCol, item, index)}
                      </div>
                    )}
                  </div>
                </div>

                {badgeCol && (
                  <div className="shrink-0 ml-1">
                    {getCellContent(badgeCol, item, index)}
                  </div>
                )}
              </div>

              {/* Card Middle: Key Facts Grid */}
              {keyFactCols.length > 0 && (
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  {keyFactCols.map((col) => {
                    const label = col.cardLabel ?? col.header;
                    return (
                      <div key={col.id} className="min-w-0">
                        <span className="block text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate mb-0.5">
                          {label}
                        </span>
                        <div className="text-slate-700 dark:text-slate-200 font-medium truncate">
                          {getCellContent(col, item, index)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Card Bottom: Thumb-friendly Actions */}
              {actionCols.length > 0 && (
                <div
                  className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {actionCols.map((col) => (
                    <React.Fragment key={col.id}>
                      {getCellContent(col, item, index)}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={cn('w-full py-12 flex items-center justify-center', className)}>
        <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Optional manual toggle view button */}
      {showViewToggle && (
        <div className="flex items-center justify-end mb-3 gap-1">
          <div className="inline-flex rounded-lg p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setActiveView('table')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-all',
                activeView === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tableau</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('cards')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-all',
                activeView === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cartes</span>
            </button>
          </div>
        </div>
      )}

      {/* When activeView is 'auto': CSS media queries switch seamlessly with zero layout jump */}
      {activeView === 'auto' && (
        <>
          <div className="hidden md:block">
            {renderTable()}
          </div>
          <div className="block md:hidden">
            {renderCards()}
          </div>
        </>
      )}

      {/* If forced to table */}
      {activeView === 'table' && renderTable()}

      {/* If forced to cards */}
      {activeView === 'cards' && renderCards()}
    </div>
  );
}
