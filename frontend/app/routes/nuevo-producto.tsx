import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { API_URL, requireAuth } from "~/lib/auth.server";
import { ArrowLeft, PackagePlus, AlertCircle, PlusCircle } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request);
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const { token } = await requireAuth(request);
  const formData = await request.formData();

  const payload = {
    sku: String(formData.get("sku") || "").trim(),
    nombre: String(formData.get("nombre") || "").trim(),
    descripcion: String(formData.get("descripcion") || "").trim() || null,
    precio: formData.get("precio") ? Number(formData.get("precio")) : "",
    stock: formData.get("stock") !== "" ? Number(formData.get("stock")) : "",
    activo: formData.get("activo") === "on",
  };

  const res = await fetch(`${API_URL}/productos`, {
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
      valoresPrevios: payload,
    };
  }

  if (!res.ok) {
    return {
      errorGeneral: data.message || "Error al crear el producto.",
      valoresPrevios: payload,
    };
  }

  return redirect("/productos");
}

export default function NuevoProductoPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const prev = actionData?.valoresPrevios;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          to="/productos"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al catálogo</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
            <PackagePlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Registrar Nuevo Producto</h1>
            <p className="text-xs text-slate-500">
              Completa los datos del producto para añadirlo al catálogo
            </p>
          </div>
        </div>

        {actionData?.errorGeneral && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-rose-700 text-sm shadow-2xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
            <span>{actionData.errorGeneral}</span>
          </div>
        )}

        <Form method="post" className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SKU */}
            <div>
              <label htmlFor="sku" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Código SKU <span className="text-rose-500">*</span>
              </label>
              <input
                id="sku"
                name="sku"
                type="text"
                required
                defaultValue={(prev?.sku as string) || ""}
                placeholder="PROD-001"
                className={`w-full text-sm rounded-xl border p-2.5 font-mono focus:outline-none focus:ring-2 transition ${
                  actionData?.errors?.sku
                    ? "border-rose-500 focus:ring-rose-200"
                    : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                }`}
              />
              {actionData?.errors?.sku && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {actionData.errors.sku[0]}
                </p>
              )}
            </div>

            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Nombre del Producto <span className="text-rose-500">*</span>
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                defaultValue={(prev?.nombre as string) || ""}
                placeholder="Ej. Teclado Mecánico RGB"
                className={`w-full text-sm rounded-xl border p-2.5 focus:outline-none focus:ring-2 transition ${
                  actionData?.errors?.nombre
                    ? "border-rose-500 focus:ring-rose-200"
                    : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                }`}
              />
              {actionData?.errors?.nombre && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {actionData.errors.nombre[0]}
                </p>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="descripcion" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Descripción detallada
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows={3}
              defaultValue={(prev?.descripcion as string) || ""}
              placeholder="Especificaciones o detalles opcionales..."
              className="w-full text-sm rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-100 transition"
            />
            {actionData?.errors?.descripcion && (
              <p className="mt-1 text-xs text-rose-600 font-medium">
                {actionData.errors.descripcion[0]}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Precio */}
            <div>
              <label htmlFor="precio" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Precio Unitario ($) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">
                  $
                </span>
                <input
                  id="precio"
                  name="precio"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={(prev?.precio as string) || ""}
                  placeholder="0.00"
                  className={`w-full pl-8 pr-3 py-2.5 text-sm rounded-xl border font-mono focus:outline-none focus:ring-2 transition ${
                    actionData?.errors?.precio
                      ? "border-rose-500 focus:ring-rose-200"
                      : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                  }`}
                />
              </div>
              {actionData?.errors?.precio && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {actionData.errors.precio[0]}
                </p>
              )}
            </div>

            {/* Stock */}
            <div>
              <label htmlFor="stock" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Stock Inicial <span className="text-rose-500">*</span>
              </label>
              <input
                id="stock"
                name="stock"
                type="number"
                min="0"
                required
                defaultValue={(prev?.stock as string) || "10"}
                className={`w-full text-sm rounded-xl border p-2.5 font-mono focus:outline-none focus:ring-2 transition ${
                  actionData?.errors?.stock
                    ? "border-rose-500 focus:ring-rose-200"
                    : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                }`}
              />
              {actionData?.errors?.stock && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {actionData.errors.stock[0]}
                </p>
              )}
            </div>
          </div>

          {/* Activo / Inactivo */}
          <div className="pt-2">
            <label className="flex items-center space-x-2.5 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                name="activo"
                defaultChecked
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-200 h-4 w-4"
              />
              <span className="font-semibold text-xs">Producto activo y habilitado para la venta</span>
            </label>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <Link
              to="/productos"
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Guardando..." : "Crear Producto"}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
