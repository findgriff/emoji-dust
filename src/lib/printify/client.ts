/**
 * Minimal Printify v1 API client.
 *
 * Auth: Bearer token from PRINTIFY_API_TOKEN.
 * Base: https://api.printify.com/v1
 * Rate limits: 600 req / min globally; 200 req / 30 min for product/upload writes.
 *
 * This client is intentionally thin — no caching, no retries. Caller orchestrates.
 */

const BASE = 'https://api.printify.com/v1';

function token() {
  const t = process.env.PRINTIFY_API_TOKEN;
  if (!t) throw new Error('PRINTIFY_API_TOKEN missing in env');
  return t;
}

async function request<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token()}`,
      'Content-Type': 'application/json',
      'User-Agent': 'emoji-dust/0.1',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Printify ${method} ${path} → ${res.status}: ${text.slice(0, 400)}`);
  }
  return (await res.json()) as T;
}

// ─── Types (only what we use) ───────────────────────────────────────────

export type PrintifyShop = {
  id: number;
  title: string;
  sales_channel: string;
};

export type PrintifyVariant = {
  id: number;
  title: string;
  options: { color?: string; size?: string };
  placeholders: Array<{ position: string; height: number; width: number }>;
};

export type PrintifyUpload = {
  id: string;
  file_name: string;
  height: number;
  width: number;
  size: number;
  mime_type: string;
  preview_url: string;
};

export type PrintifyProduct = {
  id: string;
  shop_id: number;
  title: string;
  description: string;
  blueprint_id: number;
  print_provider_id: number;
  variants: Array<{ id: number; price: number; is_enabled: boolean }>;
  images: Array<{ src: string; variant_ids: number[]; position: string; is_default: boolean }>;
  external?: { handle?: string }; // populated for Pop-Up published products
};

// ─── Endpoints ───────────────────────────────────────────────────────────

export const printify = {
  shops: () => request<PrintifyShop[]>('GET', '/shops.json'),

  catalog: {
    blueprints: () => request<unknown[]>('GET', '/catalog/blueprints.json'),
    providers: (blueprintId: number) =>
      request<unknown[]>('GET', `/catalog/blueprints/${blueprintId}/print_providers.json`),
    variants: (blueprintId: number, providerId: number) =>
      request<{ variants: PrintifyVariant[] }>(
        'GET',
        `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`,
      ),
  },

  uploads: {
    /** Upload a base64-encoded image. Pass the raw base64 (no data: prefix). */
    fromBase64: (file_name: string, contents: string) =>
      request<PrintifyUpload>('POST', '/uploads/images.json', { file_name, contents }),

    /** Upload from a public URL (Printify fetches it). */
    fromUrl: (file_name: string, url: string) =>
      request<PrintifyUpload>('POST', '/uploads/images.json', { file_name, url }),
  },

  products: {
    list: (shopId: number) =>
      request<{ data: PrintifyProduct[] }>('GET', `/shops/${shopId}/products.json`),
    create: (shopId: number, payload: unknown) =>
      request<PrintifyProduct>('POST', `/shops/${shopId}/products.json`, payload),
    publish: (shopId: number, productId: string) =>
      request<{ status: string }>('POST', `/shops/${shopId}/products/${productId}/publish.json`, {
        title: true,
        description: true,
        images: true,
        variants: true,
        tags: true,
      }),
  },
};
