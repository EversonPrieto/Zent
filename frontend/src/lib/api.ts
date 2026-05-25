const API_URL = process.env.NEXT_PUBLIC_API_URL;

type RequestOptions = Omit<RequestInit, 'body'> & {
  workspaceId?: string;
  body?: any; 
};

export async function api(path: string, options: RequestOptions = {}) {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('zent_token') : null;

  const headers = new Headers(options.headers);

  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    console.warn('[API] No token found in localStorage');
  }

  if (options.workspaceId) {
    headers.set('x-workspace-id', options.workspaceId);
  }

  console.log(`[API] Request to: ${path}`, { token: !!token, workspaceId: options.workspaceId });

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body:
      options.body && typeof options.body !== 'string'
        ? JSON.stringify(options.body)
        : options.body,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message || 'Erro na requisição';

    console.error(`[API] Error response:`, { status: response.status, path, message, data });
    throw new Error(message);
  }

  return data;
}