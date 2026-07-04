'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

export interface Label {
  id: string;
  name: string;
  color: string;
}

const LABELS_UPDATED_EVENT = 'zent:labels-updated';

function sortLabels(labels: Label[]) {
  return [...labels].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

function notifyLabelsUpdated(workspaceId: string) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent(LABELS_UPDATED_EVENT, {
      detail: { workspaceId },
    }),
  );
}

export function useLabels(workspaceId: string) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadLabels = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!workspaceId) {
        setLabels([]);
        return;
      }

      const silent = options?.silent ?? false;

      try {
        if (!silent) setLoading(true);
        setError('');

        const data = await api('/labels', { workspaceId });

        setLabels(sortLabels(Array.isArray(data) ? data : []));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar labels');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [workspaceId],
  );

  useEffect(() => {
    if (!workspaceId) {
      setLabels([]);
      return;
    }

    loadLabels();

    const handleLabelsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ workspaceId?: string }>;
      const updatedWorkspaceId = customEvent.detail?.workspaceId;

      if (updatedWorkspaceId && updatedWorkspaceId !== workspaceId) return;

      loadLabels({ silent: true });
    };

    window.addEventListener(LABELS_UPDATED_EVENT, handleLabelsUpdated);

    return () => {
      window.removeEventListener(LABELS_UPDATED_EVENT, handleLabelsUpdated);
    };
  }, [workspaceId, loadLabels]);

  async function createLabel(name: string, color: string) {
    try {
      const created = await api('/labels', {
        workspaceId,
        method: 'POST',
        body: {
          name,
          color,
        },
      });

      setLabels((prev) => {
        const alreadyExists = prev.some((label) => label.id === created.id);
        if (alreadyExists) return prev;

        return sortLabels([...prev, created]);
      });

      notifyLabelsUpdated(workspaceId);

      return created as Label;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Erro ao criar label',
      );
    }
  }

  async function updateLabel(id: string, name?: string, color?: string) {
    try {
      const updated = await api(`/labels/${id}`, {
        workspaceId,
        method: 'PATCH',
        body: {
          name,
          color,
        },
      });

      setLabels((prev) =>
        sortLabels(prev.map((label) => (label.id === id ? updated : label))),
      );

      notifyLabelsUpdated(workspaceId);

      return updated as Label;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Erro ao atualizar label',
      );
    }
  }

  async function deleteLabel(id: string) {
    try {
      await api(`/labels/${id}`, {
        workspaceId,
        method: 'DELETE',
      });

      setLabels((prev) => prev.filter((label) => label.id !== id));

      notifyLabelsUpdated(workspaceId);
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Erro ao deletar label',
      );
    }
  }

  return {
    labels,
    loading,
    error,
    createLabel,
    updateLabel,
    deleteLabel,
    reloadLabels: loadLabels,
  };
}