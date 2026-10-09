import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useState, useMemo } from "react";
import { API_URL, requireAuth } from "~/lib/auth.server";
import type { Producto } from "~/lib/types";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  AlertCircle,
  Search,
  Package,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const { token, user } = await requireAuth(request);

  const res = await fetch(`${API_URL}/productos?activo=1&per_page=100`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const data = await res.json();
  const productos: Producto[] = data.data || [];

  return { productos, user };
}

export async function action({ request }: ActionFunctionArgs) {
  const { token, user } = await requireAuth(request);
  const formData = await request.formData();

  const notas = String(formData.get("notas") || "");
  const itemsJson = String(formData.get("items_json") || "[]");

  let items = [];
  try {
    items = JSON.parse(itemsJson);
  } catch {
    return {
      errors: { items: ["Formato de productos inválido."] },
    };
  }

  if (!items || items.length === 0) {
    return {
      errors: { items: ["Debe seleccionar al menos un producto para crear el pedido."] },
    };
  }

  const payload = {
    cliente_id: user.id,
    items: items.map((i: { producto_id: number; cantidad: number }) => ({
      producto_id: Number(i.producto_id),
      cantidad: Number(i.cantidad),
    })),
    notas,
  };

  const res = await fetch(`${API_URL}/pedidos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (res.status === 422) {
    return {
      errors: data.errors as Record<string, string[]>,
    };
  }

  if (!res.ok) {
    return {
      errorGeneral: data.message || "Error al procesar el pedido.",
    };
  }

  return redirect(`/pedidos/${data.data.id}`);
}

export default function NuevoPedidoPage() {
  const { productos, user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [notas, setNotas] = useState("");

  const productosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return productos;
    const term = searchTerm.toLowerCase().trim();
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term)
    );
  }, [productos, searchTerm]);

  const handleAdd = (productoId: number) => {
    setCart((prev) => ({
      ...prev,
      [productoId]: (prev[productoId] || 0) + 1,
    }));
  };

  const handleDecrease = (productoId: number) => {
    setCart((prev) => {
      const current = prev[productoId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[productoId];
        return next;
      }
      return { ...prev, [productoId]: current - 1 };
    });
  };

  const handleRemove = (productoId: number) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[productoId];
      return next;
    });
  };

  const cartEntries = useMemo(() => {
    return Object.entries(cart)
      .map(([idStr, cantidad]) => {
        const id = Number(idStr);
        const prod = productos.find((p) => p.id === id);
        return {
          producto_id: id,
          producto: prod,
          cantidad,
          subtotal: prod ? prod.precio * cantidad : 0,
        };
      })
      .filter((entry) => entry.producto !== undefined);
  }, [cart, productos]);

  const totalCalculado = useMemo(() => {
    return cartEntries.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cartEntries]);

  const itemsJsonPayload = useMemo(() => {
    return JSON.stringify(
      cartEntries.map((c) => ({
        producto_id: c.producto_id,
        cantidad: c.cantidad,
      }))
    );
  }, [cartEntries]);

  return (
    <div className="space-y-6">
      {/* Back and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/pedidos"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Pedidos</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Crear Nuevo Pedido
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Selecciona productos del catálogo y cantidades para generar la orden
          </p>
        </div>
      </div>

      {/* Error Banners */}
      {actionData?.errorGeneral && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-rose-700 text-sm shadow-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          <span>{actionData.errorGeneral}</span>
        </div>
      )}

      {actionData?.errors?.items && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-rose-700 text-sm shadow-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          <span>{actionData.errors.items[0]}</span>
        </div>
      )}

      {/* POS-Style 2 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Product Catalog Picker (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar productos por nombre o SKU..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition"
              />
            </div>
            <div className="text-xs font-semibold text-slate-500 whitespace-nowrap hidden sm:block">
              {productosFiltrados.length} disponibles
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
            {productosFiltrados.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                No se encontraron productos disponibles en el inventario.
              </div>
            ) : (
              productosFiltrados.map((prod) => {
                const qty = cart[prod.id] || 0;
                const sinStock = prod.stock <= 0;
                const isSelected = qty > 0;

                return (
                  <div
                    key={prod.id}
                    className={`p-4 flex items-center justify-between transition gap-4 ${
                      isSelected ? "bg-indigo-50/40" : "hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900 text-sm truncate">
                          {prod.nombre}
                        </span>
                        <span className="text-[10px] font-mono bg-slate-100 text-indigo-700 px-2 py-0.5 rounded-md border border-slate-200 font-bold">
                          {prod.sku}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
                        <span className="font-bold text-slate-900 text-sm font-mono">
                          ${Number(prod.precio).toFixed(2)}
                        </span>
                        <span>&bull;</span>
                        <span
                          className={
                            prod.stock > 5
                              ? "text-emerald-700 font-medium"
                              : prod.stock > 0
                              ? "text-amber-700 font-medium"
                              : "text-rose-600 font-bold"
                          }
                        >
                          Stock: {prod.stock} unids.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {qty > 0 ? (
                        <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-indigo-200 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleDecrease(prod.id)}
                            className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 flex items-center justify-center transition cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center font-bold text-xs font-mono text-indigo-700">
                            {qty}
                          </span>
                          <button
                            type="button"
                            disabled={qty >= prod.stock}
                            onClick={() => handleAdd(prod.id)}
                            className="w-7 h-7 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white flex items-center justify-center transition disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={sinStock}
                          onClick={() => handleAdd(prod.id)}
                          className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-semibold text-xs rounded-xl transition border border-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                        >
                          {sinStock ? "Agotado" : "Agregar"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Order Cart Ticket (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-slate-900 text-base">Resumen de la Orden</h2>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
              {cartEntries.length} {cartEntries.length === 1 ? "producto" : "productos"}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {cartEntries.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                <ShoppingCart className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                Haz clic en "Agregar" en los productos de la izquierda para incluirlos en el pedido.
              </div>
            ) : (
              cartEntries.map((item) => (
                <div
                  key={item.producto_id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="font-bold text-slate-900 truncate">
                      {item.producto?.nombre}
                    </p>
                    <p className="text-slate-500 font-mono mt-0.5">
                      {item.cantidad} &times; ${Number(item.producto?.precio || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      ${item.subtotal.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.producto_id)}
                      className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <Form method="post" className="space-y-4 pt-2 border-t border-slate-200">
            <input type="hidden" name="items_json" value={itemsJsonPayload} />

            <div>
              <label htmlFor="notas" className="block text-xs font-bold text-slate-700 mb-1">
                Notas del pedido (opcional)
              </label>
              <textarea
                id="notas"
                name="notas"
                rows={2}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Instrucciones especiales de entrega..."
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition"
              />
            </div>

            {/* Total Ticket Card */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md space-y-2">
              <div className="flex justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span>Líneas de productos</span>
                <span className="font-bold text-slate-300">{cartEntries.length}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs uppercase font-bold tracking-wider text-indigo-300">
                  Total Estimado
                </span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  ${totalCalculado.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || cartEntries.length === 0}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm py-3.5 px-4 rounded-xl shadow-md shadow-indigo-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? "Procesando pedido..." : "Confirmar y Crear Pedido"}</span>
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
