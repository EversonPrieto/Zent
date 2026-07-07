'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Filter, RotateCcw, Search, Tag, Users, Calendar, Flag, Clock } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export type TaskFilters = {
  status?: string[];
  priority?: string[];
  assigneeIds?: string[];
  labelIds?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
  searchTerm?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: TaskFilters) => void;
  availableAssignees: Array<{ id: string; name: string; avatarUrl: string | null }>;
  availableLabels?: Array<{ id: string; name: string; color: string }>;
};

// Constantes auxiliares visuais
const sectionTitleClass = 'mb-3 flex items-center gap-2 text-sm font-semibold';
const filterButtonBaseClass = 'rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all duration-200 w-full text-left';
const primaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]';
const secondaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all duration-200';

export default function TaskFiltersModal({
  isOpen,
  onClose,
  onApplyFilters,
  availableAssignees,
  availableLabels,
}: Props) {
  const { themeClasses } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');

  const statuses = [
    { key: 'TODO', label: 'A fazer', color: 'text-zinc-400', dot: 'bg-zinc-400' },
    { key: 'IN_PROGRESS', label: 'Em progresso', color: 'text-blue-400', dot: 'bg-blue-400' },
    { key: 'IN_REVIEW', label: 'Em revisão', color: 'text-amber-400', dot: 'bg-amber-400' },
    { key: 'DONE', label: 'Concluído', color: 'text-emerald-400', dot: 'bg-emerald-400' },
    { key: 'ABORTED', label: 'Cancelado', color: 'text-red-400', dot: 'bg-red-400' },
  ];

  const priorities = [
    { key: 'LOW', label: 'Baixa', color: 'text-blue-400', dot: 'bg-blue-400' },
    { key: 'MEDIUM', label: 'Média', color: 'text-amber-400', dot: 'bg-amber-400' },
    { key: 'HIGH', label: 'Alta', color: 'text-orange-400', dot: 'bg-orange-400' },
    { key: 'URGENT', label: 'Urgente', color: 'text-red-400', dot: 'bg-red-400' },
  ];

  const toggleStatus = (status: string) => {
    setSelectedStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const togglePriority = (priority: string) => {
    setSelectedPriority((prev) =>
      prev.includes(priority)
        ? prev.filter((p) => p !== priority)
        : [...prev, priority],
    );
  };

  const toggleAssignee = (assigneeId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(assigneeId)
        ? prev.filter((a) => a !== assigneeId)
        : [...prev, assigneeId],
    );
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId)
        ? prev.filter((l) => l !== labelId)
        : [...prev, labelId],
    );
  };

  const handleApplyFilters = () => {
    const filters: TaskFilters = {
      searchTerm: searchTerm.trim() || undefined,
      status: selectedStatus.length > 0 ? selectedStatus : undefined,
      priority: selectedPriority.length > 0 ? selectedPriority : undefined,
      assigneeIds: selectedAssignees.length > 0 ? selectedAssignees : undefined,
      labelIds: selectedLabels.length > 0 ? selectedLabels : undefined,
      dueDateFrom: dueDateFrom || undefined,
      dueDateTo: dueDateTo || undefined,
    };

    onApplyFilters(filters);
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedStatus([]);
    setSelectedPriority([]);
    setSelectedAssignees([]);
    setSelectedLabels([]);
    setDueDateFrom('');
    setDueDateTo('');
    onApplyFilters({});
  };

  if (!isOpen || !mounted) return null;

  const hasActiveFilters =
    Boolean(searchTerm) ||
    selectedStatus.length > 0 ||
    selectedPriority.length > 0 ||
    selectedAssignees.length > 0 ||
    selectedLabels.length > 0 ||
    Boolean(dueDateFrom) ||
    Boolean(dueDateTo);

  const activeFilterCount = [
    searchTerm ? 1 : 0,
    selectedStatus.length,
    selectedPriority.length,
    selectedAssignees.length,
    selectedLabels.length,
    dueDateFrom ? 1 : 0,
    dueDateTo ? 1 : 0,
  ].reduce((sum, count) => sum + (count || 0), 0);

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] isolate flex items-center justify-center overflow-hidden bg-black/60 p-3 backdrop-blur-sm animate-in fade-in duration-200 sm:p-6">
      <div
        className={`relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} shadow-2xl shadow-black/20 animate-in zoom-in-95 duration-300`}
      >
        {/* Header */}
        <div className={`flex-shrink-0 border-b ${themeClasses.border.primary} px-5 py-4 sm:px-6 sm:py-5`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-violet-500/10 p-2">
                  <Filter className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold tracking-tight ${themeClasses.text.primary}`}>
                    Filtrar Tasks
                  </h2>
                  {activeFilterCount > 0 && (
                    <p className={`text-xs font-medium text-violet-400 mt-0.5`}>
                      {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''} ativo{activeFilterCount > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`flex-shrink-0 rounded-xl p-2 transition-all duration-200 ${themeClasses.text.tertiary} hover:bg-zinc-800/50 hover:text-white hover:scale-105 active:scale-95`}
              aria-label="Fechar filtros"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-5 sm:px-6 sm:py-6">
          <div className="space-y-6">
            {/* Search */}
            <div>
              <label className={`${sectionTitleClass} ${themeClasses.text.secondary}`}>
                <Search className="h-4 w-4 text-violet-400" />
                Buscar por nome
              </label>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Digite o nome da task..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} ${themeClasses.text.primary} py-3 pl-11 pr-4 text-sm outline-none transition-all duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-zinc-500`}
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className={`${sectionTitleClass} ${themeClasses.text.secondary}`}>
                <Clock className="h-4 w-4 text-violet-400" />
                Status
              </label>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {statuses.map((status) => {
                  const isSelected = selectedStatus.includes(status.key);
                  return (
                    <button
                      key={status.key}
                      onClick={() => toggleStatus(status.key)}
                      className={`${filterButtonBaseClass} flex items-center gap-3 ${
                        isSelected
                          ? 'border-violet-500 bg-violet-500/10 text-violet-300 shadow-lg shadow-violet-500/10'
                          : `${themeClasses.border.primary} ${themeClasses.bg.subtle} ${themeClasses.text.secondary} hover:border-violet-500/30 hover:shadow-md`
                      }`}
                    >
                      <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${status.dot} ${isSelected ? 'shadow-[0_0_8px_currentColor]' : ''}`} />
                      <span className="font-medium truncate">{status.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className={`${sectionTitleClass} ${themeClasses.text.secondary}`}>
                <Flag className="h-4 w-4 text-violet-400" />
                Prioridade
              </label>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {priorities.map((priority) => {
                  const isSelected = selectedPriority.includes(priority.key);
                  return (
                    <button
                      key={priority.key}
                      onClick={() => togglePriority(priority.key)}
                      className={`${filterButtonBaseClass} flex items-center gap-3 ${
                        isSelected
                          ? 'border-violet-500 bg-violet-500/10 text-violet-300 shadow-lg shadow-violet-500/10'
                          : `${themeClasses.border.primary} ${themeClasses.bg.subtle} ${themeClasses.text.secondary} hover:border-violet-500/30 hover:shadow-md`
                      }`}
                    >
                      <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${priority.dot} ${isSelected ? 'shadow-[0_0_8px_currentColor]' : ''}`} />
                      <span className="font-medium truncate">{priority.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assignees */}
            <div>
              <label className={`${sectionTitleClass} ${themeClasses.text.secondary}`}>
                <Users className="h-4 w-4 text-violet-400" />
                Responsáveis
              </label>

              {availableAssignees.length === 0 ? (
                <div className={`rounded-xl border-2 border-dashed ${themeClasses.border.primary} px-4 py-8 text-center`}>
                  <Users className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                  <p className={`text-sm ${themeClasses.text.tertiary}`}>
                    Nenhum responsável disponível
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {availableAssignees.map((assignee) => {
                    const isSelected = selectedAssignees.includes(assignee.id);
                    return (
                      <button
                        key={assignee.id}
                        onClick={() => toggleAssignee(assignee.id)}
                        className={`${filterButtonBaseClass} flex items-center gap-3 ${
                          isSelected
                            ? 'border-violet-500 bg-violet-500/10 text-violet-300 shadow-lg shadow-violet-500/10'
                            : `${themeClasses.border.primary} ${themeClasses.bg.subtle} ${themeClasses.text.secondary} hover:border-violet-500/30 hover:shadow-md`
                        }`}
                        title={assignee.name}
                      >
                        {assignee.avatarUrl ? (
                          <img
                            src={assignee.avatarUrl}
                            alt={assignee.name}
                            className="h-7 w-7 flex-shrink-0 rounded-full object-cover ring-1 ring-white/10"
                          />
                        ) : (
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-xs font-bold ring-1 ring-white/10">
                            {assignee.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium truncate">{assignee.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Labels */}
            <div>
              <label className={`${sectionTitleClass} ${themeClasses.text.secondary}`}>
                <Tag className="h-4 w-4 text-violet-400" />
                Labels
              </label>

              {(availableLabels ?? []).length === 0 ? (
                <div className={`rounded-xl border-2 border-dashed ${themeClasses.border.primary} px-4 py-8 text-center`}>
                  <Tag className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                  <p className={`text-sm ${themeClasses.text.tertiary}`}>
                    Nenhuma label disponível
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {(availableLabels ?? []).map((label) => {
                    const isSelected = selectedLabels.includes(label.id);
                    return (
                      <button
                        key={label.id}
                        onClick={() => toggleLabel(label.id)}
                        className={`${filterButtonBaseClass} flex items-center gap-3 ${
                          isSelected
                            ? 'border-violet-500 bg-violet-500/10 text-violet-300 shadow-lg shadow-violet-500/10'
                            : `${themeClasses.border.primary} ${themeClasses.bg.subtle} ${themeClasses.text.secondary} hover:border-violet-500/30 hover:shadow-md`
                        }`}
                        title={label.name}
                      >
                        <div
                          className={`h-3 w-3 rounded-full flex-shrink-0 ${isSelected ? 'shadow-[0_0_8px_currentColor]' : ''}`}
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="font-medium truncate">{label.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Date Range */}
            <div>
              <label className={`${sectionTitleClass} ${themeClasses.text.secondary}`}>
                <Calendar className="h-4 w-4 text-violet-400" />
                Data de Vencimento
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={`mb-1.5 block text-xs font-medium ${themeClasses.text.tertiary}`}>
                    De
                  </label>
                  <input
                    type="date"
                    value={dueDateFrom}
                    onChange={(e) => setDueDateFrom(e.target.value)}
                    className={`w-full rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} ${themeClasses.text.primary} px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
                  />
                </div>

                <div>
                  <label className={`mb-1.5 block text-xs font-medium ${themeClasses.text.tertiary}`}>
                    Até
                  </label>
                  <input
                    type="date"
                    value={dueDateTo}
                    onChange={(e) => setDueDateTo(e.target.value)}
                    className={`w-full rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} ${themeClasses.text.primary} px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex-shrink-0 border-t ${themeClasses.border.primary} px-5 py-4 sm:px-6 sm:py-5`}>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:gap-3">
            <button
              onClick={handleReset}
              disabled={!hasActiveFilters}
              className={`${secondaryButtonClass} text-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              <RotateCcw className="h-4 w-4" />
              Limpar filtros
            </button>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
              <button
                onClick={onClose}
                className={`${secondaryButtonClass} ${themeClasses.text.tertiary} hover:text-white hover:bg-zinc-800/50`}
              >
                Cancelar
              </button>

              <button
                onClick={handleApplyFilters}
                className={primaryButtonClass}
              >
                <Filter className="h-4 w-4" />
                Aplicar filtros
                {activeFilterCount > 0 && (
                  <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>,
    document.body,
  );
}