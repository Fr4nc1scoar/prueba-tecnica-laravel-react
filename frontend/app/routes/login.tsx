import { Form, redirect, useActionData, useNavigation, useSearchParams } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { API_URL, createAuthHeaders, getAuthUser } from "~/lib/auth.server";
import { Lock, Mail, ArrowRight, AlertCircle, Layers } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const auth = await getAuthUser(request);
  if (auth) return redirect("/pedidos");
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirectTo") || "/pedidos";

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.status === 422) {
      return { errors: data.errors as Record<string, string[]>, email };
    }

    if (!res.ok) {
      return {
        errorGeneral: "Credenciales inválidas. Verifica tu correo y contraseña.",
        email,
      };
    }

    return redirect(redirectTo, {
      headers: createAuthHeaders(data.token, data.user),
    });
  } catch {
    return {
      errorGeneral: "No se pudo conectar con el servidor. Intenta nuevamente.",
      email,
    };
  }
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-4 antialiased">
      <div className="max-w-md w-full">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-tr from-indigo-700 via-indigo-600 to-blue-600 text-white p-8 text-center relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="w-14 h-14 bg-white/15 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-3.5 shadow-inner border border-white/20">
              <Layers className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">NexusERP</h1>
            <p className="text-indigo-100 text-xs mt-1 font-medium">
              Iniciar Sesión en el Sistema
            </p>
          </div>

          <div className="p-8">
            {actionData?.errorGeneral && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-rose-700 text-xs shadow-2xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                <span>{actionData.errorGeneral}</span>
              </div>
            )}

            <Form method="post" className="space-y-4">
              <input type="hidden" name="redirectTo" value={searchParams.get("redirectTo") || ""} />

              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    defaultValue={actionData?.email || ""}
                    required
                    placeholder="usuario@ejemplo.com"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 transition ${
                      actionData?.errors?.email
                        ? "border-rose-500 focus:ring-rose-200"
                        : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                    }`}
                  />
                </div>
                {actionData?.errors?.email && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{actionData.errors.email[0]}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 transition ${
                      actionData?.errors?.password
                        ? "border-rose-500 focus:ring-rose-200"
                        : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                    }`}
                  />
                </div>
                {actionData?.errors?.password && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{actionData.errors.password[0]}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition shadow-md shadow-indigo-500/25 disabled:opacity-50 cursor-pointer active:scale-98"
              >
                <span>{isSubmitting ? "Iniciando sesión..." : "Ingresar"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
