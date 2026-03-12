const API_URL = process.env.NEXT_PUBLIC_API_URL;

type RequestOptions = RequestInit & {
  workspaceId?: string;
};

export async function api(path: string, options: RequestOptions = {}) {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('zent_token') : null;

  const headers = new Headers(options.headers);

  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.workspaceId) {
    headers.set('x-workspace-id', options.workspaceId);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message || 'Erro na requisição';

    throw new Error(message);
  }

  return data;
}