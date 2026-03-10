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

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Erro na requisição');
  }

  return response.json();
}