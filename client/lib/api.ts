const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include', // send the httpOnly auth cookie
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  }

  return data as T;
}

// ---- Auth ----
export interface User {
  id: string;
  name: string;
  email: string;
}

export const authApi = {
  signup: (name: string, email: string, password: string) =>
    request<{ user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  signin: (email: string, password: string) =>
    request<{ user: User }>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  me: () => request<{ user: User }>('/auth/me'),
};

// ---- Items ----
export interface Item {
  id: string;
  name: string;
  description?: string | null;
  barcode?: string | null;
  sku?: string | null;
  category?: string | null;
  unit: string;
  quantity: number;
  costPrice: string | number;
  sellingPrice: string | number;
  reorderLevel: number;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ItemInput {
  name: string;
  description?: string;
  barcode?: string;
  sku?: string;
  category?: string;
  unit?: string;
  quantity?: number;
  costPrice?: number;
  sellingPrice?: number;
  reorderLevel?: number;
  imageUrl?: string;
}

export const itemsApi = {
  list: (params: { q?: string; barcode?: string; page?: number; pageSize?: number } = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') search.set(k, String(v));
    });
    const qs = search.toString();
    return request<{ items: Item[]; total: number }>(`/items${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => request<{ item: Item & { movements: Movement[] } }>(`/items/${id}`),
  getByBarcode: (code: string) => request<{ item: Item }>(`/items/barcode/${encodeURIComponent(code)}`),
  create: (data: ItemInput) =>
    request<{ item: Item }>('/items', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<ItemInput> & { isActive?: boolean }) =>
    request<{ item: Item }>(`/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => request<{ message: string }>(`/items/${id}`, { method: 'DELETE' }),
};

// ---- Movements ----
export interface Movement {
  id: string;
  type: 'STOCK_IN' | 'STOCK_OUT';
  quantity: number;
  unitPrice: string | number;
  reference?: string | null;
  note?: string | null;
  createdAt: string;
  item?: { id: string; name: string; barcode?: string | null; unit: string };
}

export interface MovementInput {
  itemId: string;
  type: 'STOCK_IN' | 'STOCK_OUT';
  quantity: number;
  unitPrice?: number;
  reference?: string;
  note?: string;
}

export const movementsApi = {
  list: (params: { itemId?: string; type?: string; page?: number; pageSize?: number } = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') search.set(k, String(v));
    });
    const qs = search.toString();
    return request<{ movements: Movement[]; total: number }>(`/movements${qs ? `?${qs}` : ''}`);
  },
  create: (data: MovementInput) =>
    request<{ movement: Movement; item: Item }>('/movements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  remove: (id: string) => request<{ message: string }>(`/movements/${id}`, { method: 'DELETE' }),
};
