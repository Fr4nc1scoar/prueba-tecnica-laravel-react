import { Link, useLoaderData, Form } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { API_URL, requireAuth } from "~/lib/auth.server";
import type { Pedido } from "~/lib/types";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  Calendar,
  User,
  Package,
  FileText,
} from "lucide-react";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { token } = await requireAuth(request);
  const pedidoId = params.id;

  const res = await fetch(`${API_URL}/pedidos/${pedidoId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Response("Pedido no encontrado", { status: 404 });
  }

  const data = await res.json();
  const pedido: Pedido = data.data;

  return { pedido };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { token } = await requireAuth(request);
  const formData = await request.formData();
  const pedidoId = params.id;
  const actionType = formData.get("_action") || "pagar";

  if (actionType === "pagar" && pedidoId) {
    await fetch(`${API_URL}/webhooks/pago`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        evento_id: `evt_detail_${Date.now()}_${pedidoId}`,
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

export default function DetallePedidoPage() {
  const { pedido } = useLoaderData<typeof loader>();

  const getStatusBadge = (estado: Pedido["estado"]) => {
    switch (estado) {
      case "pagado":
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pagado</span>
          </span>
        );
      case "pendiente":
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pendiente de Pago</span>
          </span>
        );
      case "cancelado":
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Cancelado</span>
          </span>
        );
      default:
        return <span>{estado}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/pedidos"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al listado de pedidos</span>
        </Link>
      </div>

      {/* Main Order Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
                  {pedido.numero_pedido}
                </h1>
                {getStatusBadge(pedido.estado)}
              </div>
              <div className="flex items-center space-x-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Registrado: {new Date(pedido.created_at).toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
              </div>
            </div>

            {/* Quick Actions if Pending */}
            {pedido.estado === "pendiente" && (
              <div className="flex flex-wrap items-center gap-2.5">
                <Form method="post">
                  <input type="hidden" name="_action" value="pagar" />
                  <button
                    type="submit"
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Marcar como Pagado</span>
                  </button>
                </Form>

                <Form
                  method="post"
                  onSubmit={(e) => {
                    if (
                      !confirm(
                        `¿Estás seguro de cancelar el pedido ${pedido.numero_pedido}? Se devolverá el stock a los productos.`
                      )
                    ) {
                      e.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="_action" value="cancelar" />
                  <button
                    type="submit"
                    className="inline-flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Cancelar Pedido</span>
                  </button>
                </Form>
              </div>
            )}
          </div>

          {/* Customer & Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                {(pedido.cliente?.name || "C").charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Cliente Registrado
                </span>
                <div className="font-bold text-slate-900 text-sm">{pedido.cliente?.name || "Cliente"}</div>
                <div className="text-slate-500">{pedido.cliente?.email}</div>
              </div>
            </div>

            {pedido.notas ? (
              <div className="border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4 pt-3 sm:pt-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Notas u Observaciones
                </span>
                <p className="text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200">
                  {pedido.notas}
                </p>
              </div>
            ) : (
              <div className="border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4 pt-3 sm:pt-0 flex items-center text-slate-400">
                <FileText className="w-4 h-4 mr-1.5" />
                <span>Sin notas adicionales registradas</span>
              </div>
            )}
          </div>

          {/* Products Table */}
          <div className="mt-8">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center space-x-2">
              <Package className="w-4 h-4 text-indigo-600" />
              <span>Desglose de Productos ({pedido.items?.length || 0})</span>
            </h2>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Producto</th>
                    <th className="px-5 py-3.5 text-center">Cantidad</th>
                    <th className="px-5 py-3.5 text-right">Precio Unitario</th>
                    <th className="px-5 py-3.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pedido.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {item.nombre_producto}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-block bg-slate-100 text-slate-800 font-bold text-xs px-2.5 py-1 rounded-md">
                          {item.cantidad}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-slate-600">
                        ${Number(item.precio_unitario).toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-bold text-slate-900">
                        ${Number(item.subtotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total Breakdown Ticket */}
          <div className="mt-8 flex justify-end">
            <div className="w-full sm:w-80 bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-lg shadow-indigo-950/20">
              <div className="flex justify-between items-center text-xs text-slate-400 pb-3 border-b border-slate-800">
                <span>Subtotal Ítems</span>
                <span className="font-mono text-slate-300 font-semibold">{pedido.total_formateado}</span>
              </div>
              <div className="flex justify-between items-center pt-3">
                <span className="text-xs uppercase font-bold tracking-wider text-indigo-300">Total a Pagar</span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {pedido.total_formateado}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
