export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://atmos-insight-ml.onrender.com/api";

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Request to ${endpoint} failed with status ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
