'use client';

import { useState } from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export type TaskFilters = {
  status?: string[];
  priority?: string[];
  assigneeIds?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
  searchTerm?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: TaskFilters) => void;
  availableAssignees: Array<{ id: string; name: string; avatarUrl: string | null }>;
};

export default function TaskFiltersModal({
  isOpen,
  onClose,
  onApplyFilters,
  availableAssignees,
}: Props) {
  const { themeClasses } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');

  const statuses = [
    { key: 'TODO', label: 'A fazer' },
    { key: 'IN_PROGRESS', label: 'Em progresso' },
    { key: 'IN_REVIEW', label: 'Em revisão' },
    { key: 'DONE', label: 'Concluído' },
    { key: 'ABORTED', label: 'Cancelado' },
  ];

  const priorities = [
    { key: 'LOW', label: 'Baixa' },
    { key: 'MEDIUM', label: 'Média' },
    { key: 'HIGH', label: 'Alta' },
    { key: 'URGENT', label: 'Urgente' },
  ];

  const toggleStatus = (status: string) => {
    setSelectedStatus((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const togglePriority = (priority: string) => {
    setSelectedPriority((prev) =>
      prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
    );
  };

  const toggleAssignee = (assigneeId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(assigneeId) ? prev.filter((a) => a !== assigneeId) : [...prev, assigneeId]
    );
  };

  const handleApplyFilters = () => {
    const filters: TaskFilters = {
      searchTerm: searchTerm.trim() || undefined,
      status: selectedStatus.length > 0 ? selectedStatus : undefined,
      priority: selectedPriority.length > 0 ? selectedPriority : undefined,
      assigneeIds: selectedAssignees.length > 0 ? selectedAssignees : undefined,
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
    setDueDateFrom('');
    setDueDateTo('');
    onApplyFilters({});
  };

  if (!isOpen) return null;

  const hasActiveFilters =
    searchTerm ||
    selectedStatus.length > 0 ||
    selectedPriority.length > 0 ||
    selectedAssignees.length > 0 ||
    dueDateFrom ||
    dueDateTo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl animate-in fade-in scale-95 duration-300 ${themeClasses.bg.primary} ${themeClasses.border.primary}`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 border-b p-6 flex items-center justify-between ${themeClasses.border.primary} ${themeClasses.bg.primary}`}
        >
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-violet-400" />
            <h2 className={`text-xl font-bold ${themeClasses.text.primary}`}>Filtrar Tasks</h2>
          </div>
          <button
            onClick={onClose}
            className={`rounded-lg p-2 transition-colors ${themeClasses.text.tertiary} hover:${themeClasses.bg.hover} hover:${themeClasses.text.primary}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Search Term */}
          <div>
            <label className={`mb-2 block text-sm font-medium ${themeClasses.text.secondary}`}>
              Buscar por nome
            </label>
            <input
              type="text"
              placeholder="Digite o nome da task..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 outline-none transition-all ${themeClasses.input} focus:border-violet-500 focus:ring-1 focus:ring-violet-500`}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className={`mb-3 block text-sm font-medium ${themeClasses.text.secondary}`}>
              Status
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {statuses.map((status) => (
                <button
                  key={status.key}
                  onClick={() => toggleStatus(status.key)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    selectedStatus.includes(status.key)
                      ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                      : `${themeClasses.border.primary} ${themeClasses.bg.secondary} ${themeClasses.text.secondary} hover:${themeClasses.bg.hover}`
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className={`mb-3 block text-sm font-medium ${themeClasses.text.secondary}`}>
              Prioridade
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {priorities.map((priority) => (
                <button
                  key={priority.key}
                  onClick={() => togglePriority(priority.key)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    selectedPriority.includes(priority.key)
                      ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                      : `${themeClasses.border.primary} ${themeClasses.bg.secondary} ${themeClasses.text.secondary} hover:${themeClasses.bg.hover}`
                  }`}
                >
                  {priority.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assignees Filter */}
          <div>
            <label className={`mb-3 block text-sm font-medium ${themeClasses.text.secondary}`}>
              Responsáveis
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {availableAssignees.map((assignee) => (
                <button
                  key={assignee.id}
                  onClick={() => toggleAssignee(assignee.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    selectedAssignees.includes(assignee.id)
                      ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                      : `${themeClasses.border.primary} ${themeClasses.bg.secondary} ${themeClasses.text.secondary} hover:${themeClasses.bg.hover}`
                  }`}
                >
                  {assignee.avatarUrl && (
                    <img
                      src={assignee.avatarUrl}
                      alt={assignee.name}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  )}
                  <span className="truncate">{assignee.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className={`mb-3 block text-sm font-medium ${themeClasses.text.secondary}`}>
              Intervalo de Data de Vencimento
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-xs ${themeClasses.text.tertiary}`}>De:</label>
                <input
                  type="date"
                  value={dueDateFrom}
                  onChange={(e) => setDueDateFrom(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all ${themeClasses.input} focus:border-violet-500 focus:ring-1 focus:ring-violet-500`}
                />
              </div>
              <div>
                <label className={`text-xs ${themeClasses.text.tertiary}`}>Até:</label>
                <input
                  type="date"
                  value={dueDateTo}
                  onChange={(e) => setDueDateTo(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all ${themeClasses.input} focus:border-violet-500 focus:ring-1 focus:ring-violet-500`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`sticky bottom-0 border-t p-4 flex gap-3 justify-end ${themeClasses.border.primary} ${themeClasses.bg.primary}`}
        >
          <button
            onClick={handleReset}
            disabled={!hasActiveFilters}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              hasActiveFilters
                ? `${themeClasses.text.secondary} hover:${themeClasses.bg.hover}`
                : `${themeClasses.text.hint} cursor-not-allowed opacity-50`
            }`}
          >
            <RotateCcw className="h-4 w-4" />
            Limpar
          </button>
          <button
            onClick={onClose}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${themeClasses.border.primary} ${themeClasses.bg.secondary} ${themeClasses.text.secondary} hover:${themeClasses.bg.hover} transition-all`}
          >
            Fechar
          </button>
          <button
            onClick={handleApplyFilters}
            className="rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 text-sm font-medium text-white transition-all hover:from-violet-600 hover:to-indigo-600"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  );
}
