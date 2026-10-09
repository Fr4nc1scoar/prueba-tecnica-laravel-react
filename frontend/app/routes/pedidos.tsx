import { Link, useLoaderData, useSearchParams, Form } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { API_URL, requireAuth } from "~/lib/auth.server";
import type { ApiResponseList, Pedido } from "~/lib/types";
import {
  ShoppingBag,
  PlusCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CreditCard,
  AlertCircle,
  User,
} from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const { token } = await requireAuth(request);
  const url = new URL(request.url);
  const estado = url.searchParams.get("estado") || "";
  const page = url.searchParams.get("page") || "1";

  const apiUrl = new URL(`${API_URL}/pedidos`);
  if (estado && estado !== "todos") {
    apiUrl.searchParams.set("estado", estado);
  }
  apiUrl.searchParams.set("page", page);
  apiUrl.searchParams.set("per_page", "8");

  const res = await fetch(apiUrl.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Response("Error al cargar pedidos.", { status: res.status });
  }

  const data: ApiResponseList<Pedido> = await res.json();

  // También consultamos métricas rápidas (sin paginar para los cards)
  let stats = { total: data.meta?.total || 0, pendientes: 0, pagados: 0, cancelados: 0 };
  try {
    const allRes = await fetch(`${API_URL}/pedidos?per_page=100`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (allRes.ok) {
      const allData: ApiResponseList<Pedido> = await allRes.json();
      stats.total = allData.meta?.total || allData.data.length;
      stats.pendientes = allData.data.filter((p) => p.estado === "pendiente").length;
      stats.pagados = allData.data.filter((p) => p.estado === "pagado").length;
      stats.cancelados = allData.data.filter((p) => p.estado === "cancelado").length;
    }
  } catch {
    // Si falla la consulta de stats, usamos valores por defecto
  }

  return {
    pedidos: data.data,
    meta: data.meta,
    estadoFiltro: estado || "todos",
    stats,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const { token } = await requireAuth(request);
  const formData = await request.formData();
  const pedidoId = formData.get("pedido_id");
  const actionType = formData.get("_action");

  if (actionType === "pagar" && pedidoId) {
    await fetch(`${API_URL}/webhooks/pago`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        evento_id: `evt_order_${Date.now()}_${pedidoId}`,
        pedido_id: Number(pedidoId),
        metodo: "tarjeta",
      }),
    });
  }

  if (actionType === "cancelar" && pedidoId) {
    await fetch(`${API_URL}/pedidos/${pedidoId}/cancelar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
  }

  return { ok: true };
}

export default function PedidosPage() {
  const { pedidos, meta, estadoFiltro, stats } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleFilterChange = (nuevoEstado: string) => {
    const params = new URLSearchParams(searchParams);
    if (nuevoEstado === "todos") {
      params.delete("estado");
    } else {
      params.set("estado", nuevoEstado);
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  const getStatusBadge = (estado: Pedido["estado"]) => {
    switch (estado) {
      case "pagado":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Pagado</span>
          </span>
        );
      case "pendiente":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Pendiente</span>
          </span>
        );
      case "cancelado":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Cancelado</span>
          </span>
        );
      default:
        return <span>{estado}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Gestión de Pedidos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Consulta y administra las órdenes generadas en el sistema
          </p>
        </div>

        <Link
          to="/pedidos/nuevo"
          className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition transform active:scale-98"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Crear Pedido</span>
        </Link>
      </div>

      {/* Colorful Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:border-indigo-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Pedidos</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-400">registrados</span>
          </div>
        </div>

        {/* Pendientes Card */}
        <div className="bg-white rounded-2xl p-4 border border-amber-200/90 bg-gradient-to-b from-white to-amber-50/30 shadow-xs hover:border-amber-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700">Pendientes</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-amber-900">{stats.pendientes}</span>
            <span className="text-xs text-amber-600 font-medium">por pagar</span>
          </div>
        </div>

        {/* Pagados Card */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-200/90 bg-gradient-to-b from-white to-emerald-50/30 shadow-xs hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700">Pagados</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-900">{stats.pagados}</span>
            <span className="text-xs text-emerald-600 font-medium">completados</span>
          </div>
        </div>

        {/* Cancelados Card */}
        <div className="bg-white rounded-2xl p-4 border border-rose-200/90 bg-gradient-to-b from-white to-rose-50/30 shadow-xs hover:border-rose-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-700">Cancelados</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-rose-900">{stats.cancelados}</span>
            <span className="text-xs text-rose-600 font-medium">stock devuelto</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
          <Filter className="w-4 h-4 text-indigo-500" />
          <span>Filtro de Estado:</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "todos", label: "Todos", count: stats.total },
            { id: "pendiente", label: "Pendientes", count: stats.pendientes },
            { id: "pagado", label: "Pagados", count: stats.pagados },
            { id: "cancelado", label: "Cancelados", count: stats.cancelados },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => handleFilterChange(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                estadoFiltro === f.id
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                  : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  estadoFiltro === f.id ? "bg-indigo-700/60 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {pedidos.length === 0 ? (
          <div className="p-14 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No se encontraron pedidos</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              No hay pedidos que coincidan con el filtro seleccionado. Puedes crear uno nuevo en cualquier momento.
            </p>
            <div className="mt-5">
              <Link
                to="/pedidos/nuevo"
                className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Crear el primer pedido</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Nº Pedido</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Ítems</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pedidos.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-slate-50/80 transition group">
                    {/* Order Number */}
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center space-x-1.5 font-mono text-xs font-bold text-indigo-700 bg-indigo-50/80 border border-indigo-200/60 px-2.5 py-1 rounded-lg">
                        <span>{pedido.numero_pedido}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase">
                          {(pedido.cliente?.name || "C").charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-xs">
                            {pedido.cliente?.name || "Cliente"}
                          </div>
                          <div className="text-[11px] text-slate-400">{pedido.cliente?.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Items count */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center space-x-1 text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                        <span>{pedido.items_count ?? pedido.items?.length ?? 0}</span>
                        <span>prod.</span>
                      </span>
                    </td>

                    {/* Total */}
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 text-sm font-mono tracking-tight">
                        {pedido.total_formateado}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      {getStatusBadge(pedido.estado)}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(pedido.created_at).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center space-x-1.5 justify-end">
                        {pedido.estado === "pendiente" && (
                          <>
                            {/* Pagar Button (hits webhook) */}
                            <Form method="post" className="inline">
                              <input type="hidden" name="_action" value="pagar" />
                              <input type="hidden" name="pedido_id" value={pedido.id} />
                              <button
                                type="submit"
                                className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer shadow-2xs hover:scale-102"
                                title="Marcar como pagado"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Pagar</span>
                              </button>
                            </Form>

                            {/* Cancelar Button */}
                            <Form
                              method="post"
                              className="inline"
                              onSubmit={(e) => {
                                if (!confirm(`¿Cancelar el pedido ${pedido.numero_pedido}?`)) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              <input type="hidden" name="_action" value="cancelar" />
                              <input type="hidden" name="pedido_id" value={pedido.id} />
                              <button
                                type="submit"
                                className="inline-flex items-center space-x-1 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50/80 hover:bg-rose-100 border border-rose-200/70 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                                title="Cancelar pedido"
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                <span>Cancelar</span>
                              </button>
                            </Form>
                          </>
                        )}

                        {/* View Detail Link */}
                        <Link
                          to={`/pedidos/${pedido.id}`}
                          className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/60 hover:bg-indigo-100/80 px-2.5 py-1.5 rounded-lg transition"
                        >
                          <span>Detalles</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Mostrando <span className="font-bold text-slate-800">{meta.from}</span> a{" "}
              <span className="font-bold text-slate-800">{meta.to}</span> de{" "}
              <span className="font-bold text-slate-800">{meta.total}</span> pedidos
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const p = new URLSearchParams(searchParams);
                  p.set("page", String(meta.current_page - 1));
                  setSearchParams(p);
                }}
                disabled={meta.current_page <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center space-x-1 font-medium shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
              <span className="px-2 font-semibold text-slate-700">
                {meta.current_page} / {meta.last_page}
              </span>
              <button
                onClick={() => {
                  const p = new URLSearchParams(searchParams);
                  p.set("page", String(meta.current_page + 1));
                  setSearchParams(p);
                }}
                disabled={meta.current_page >= meta.last_page}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center space-x-1 font-medium shadow-2xs"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
