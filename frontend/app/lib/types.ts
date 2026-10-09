export interface Producto {
  id: number;
  sku: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  precio_formateado: string;
  stock: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PedidoItem {
  id: number;
  producto_id: number;
  nombre_producto: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
}

export interface Cliente {
  id: number;
  name: string;
  email: string;
}

export interface Pedido {
  id: number;
  numero_pedido: string;
  cliente_id: number;
  cliente?: Cliente;
  total: number;
  total_formateado: string;
  estado: "pendiente" | "pagado" | "cancelado";
  notas: string | null;
  items_count?: number;
  items?: PedidoItem[];
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface ApiResponseList<T> {
  data: T[];
  links?: PaginationLinks;
  meta?: PaginationMeta;
}
