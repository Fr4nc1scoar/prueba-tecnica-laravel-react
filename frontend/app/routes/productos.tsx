import { Link, useLoaderData, Form } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useState, useMemo } from "react";
import { API_URL, requireAuth } from "~/lib/auth.server";
import type { ApiResponseList, Producto } from "~/lib/types";
import {
  Package,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  XCircle,
  AlertTriangle,
  Boxes,
  CheckCircle,
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const { token } = await requireAuth(request);

  const res = await fetch(`${API_URL}/productos?per_page=100`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const data: ApiResponseList<Producto> = await res.json();

  return {
    productos: data.data || [],
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const { token } = await requireAuth(request);
  const formData = await request.formData();
  const id = formData.get("id");

  if (formData.get("_action") === "eliminar" && id) {
    await fetch(`${API_URL}/productos/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
  }

  return { ok: true };
}

export default function ProductosPage() {
  const { productos } = useLoaderData<typeof loader>();
  const [searchTerm, setSearchTerm] = useState("");

  const productosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return productos;
    const term = searchTerm.toLowerCase().trim();
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(term))
    );
  }, [productos, searchTerm]);

  // Métricas rápidas
  const totalProductos = productos.length;
  const stockSaludable = productos.filter((p) => p.stock > 10).length;
  const stockBajo = productos.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const agotados = productos.filter((p) => p.stock <= 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Catálogo de Productos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Mantenimiento y administración del inventario de productos
          </p>
        </div>

        <Link
          to="/productos/nuevo"
          className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition transform active:scale-98"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </Link>
      </div>

      {/* Colorful Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:border-indigo-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Catálogo</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">{totalProductos}</span>
            <span className="text-xs text-slate-400">ítems</span>
          </div>
        </div>

        {/* Saludable */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 bg-gradient-to-b from-white to-emerald-50/20 shadow-xs hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Stock Óptimo</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-900">{stockSaludable}</span>
            <span className="text-xs text-emerald-600 font-medium">&gt;10 unids</span>
          </div>
        </div>

        {/* Bajo */}
        <div className="bg-white rounded-2xl p-4 border border-amber-200/80 bg-gradient-to-b from-white to-amber-50/20 shadow-xs hover:border-amber-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Stock Bajo</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-amber-900">{stockBajo}</span>
            <span className="text-xs text-amber-600 font-medium">alerta de reposición</span>
          </div>
        </div>

        {/* Agotados */}
        <div className="bg-white rounded-2xl p-4 border border-rose-200/80 bg-gradient-to-b from-white to-rose-50/20 shadow-xs hover:border-rose-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Agotados</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-rose-900">{agotados}</span>
            <span className="text-xs text-rose-600 font-medium">0 en almacén</span>
          </div>
        </div>
      </div>

      {/* Dynamic Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Escribe para buscar al instante por nombre, SKU o descripción..."
            className="w-full pl-10 pr-10 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="text-xs font-semibold text-slate-500 whitespace-nowrap hidden sm:block">
          Mostrando <span className="text-indigo-600">{productosFiltrados.length}</span> de {productos.length}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {productosFiltrados.length === 0 ? (
          <div className="p-14 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No se encontraron productos</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm ? "No hay resultados que coincidan con tu búsqueda." : "No hay productos registrados en el catálogo."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4 text-right">Precio</th>
                  <th className="px-6 py-4 text-center">Stock</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productosFiltrados.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/80 transition group">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-slate-900">
                      <span className="bg-slate-100 text-indigo-700 font-mono px-2.5 py-1 rounded-md border border-slate-200/80">
                        {prod.sku}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{prod.nombre}</div>
                      {prod.descripcion && (
                        <div className="text-xs text-slate-500 line-clamp-1 max-w-md mt-0.5">
                          {prod.descripcion}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                      ${Number(prod.precio).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          prod.stock > 10
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : prod.stock > 0
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200 font-bold"
                        }`}
                      >
                        {prod.stock} unids.
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {prod.activo ? (
                        <span className="inline-flex items-center space-x-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Activo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                          <X className="w-3 h-3" />
                          <span>Inactivo</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center space-x-1.5 justify-end">
                        <Link
                          to={`/productos/${prod.id}/editar`}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Editar producto"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <Form
                          method="post"
                          className="inline"
                          onSubmit={(e) => {
                            if (!confirm(`¿Eliminar producto "${prod.nombre}"?`)) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <input type="hidden" name="_action" value="eliminar" />
                          <input type="hidden" name="id" value={prod.id} />
                          <button
                            type="submit"
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
