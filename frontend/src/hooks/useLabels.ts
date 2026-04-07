'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export interface Label {
  id: string;
  name: string;
  color: string;
}

export function useLabels(workspaceId: string) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!workspaceId) return;

    async function load() {
      try {
        setLoading(true);
        const data = await api('/labels', { workspaceId });
        setLabels(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar labels');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [workspaceId]);

  async function createLabel(name: string, color: string) {
    try {
      const created = await api('/labels', {
        workspaceId,
        method: 'POST',
        body: JSON.stringify({ name, color }),
      });
      setLabels((prev) => [...prev, created]);
      return created;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar label');
    }
  }

  async function updateLabel(id: string, name?: string, color?: string) {
    try {
      const updated = await api(`/labels/${id}`, {
        workspaceId,
        method: 'PATCH',
        body: JSON.stringify({ name, color }),
      });
      setLabels((prev) => prev.map((l) => (l.id === id ? updated : l)));
      return updated;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar label');
    }
  }

  async function deleteLabel(id: string) {
    try {
      await api(`/labels/${id}`, { workspaceId, method: 'DELETE' });
      setLabels((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao deletar label');
    }
  }

  return { labels, loading, error, createLabel, updateLabel, deleteLabel };
}
