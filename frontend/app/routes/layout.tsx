import { Link, NavLink, Outlet, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { requireAuth } from "~/lib/auth.server";
import { Package, ShoppingBag, LogOut, PlusCircle, Layers, CheckCircle } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const { user } = await requireAuth(request);
  return { user };
}

export default function AppLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo & Navigation */}
            <div className="flex items-center space-x-8">
              <Link to="/pedidos" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-500/20 group-hover:scale-105 transition transform">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-base tracking-tight group-hover:text-indigo-600 transition">
                    Nexus<span className="text-indigo-600">ERP</span>
                  </span>
                  <span className="hidden sm:block text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                    Gestión &amp; Pedidos
                  </span>
                </div>
              </Link>

              <nav className="hidden md:flex items-center space-x-1.5">
                <NavLink
                  to="/pedidos"
                  end
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                    }`
                  }
                >
                  <ShoppingBag className="w-4 h-4 text-indigo-500" />
                  <span>Pedidos</span>
                </NavLink>

                <NavLink
                  to="/productos"
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                    }`
                  }
                >
                  <Package className="w-4 h-4 text-emerald-500" />
                  <span>Productos</span>
                </NavLink>
              </nav>
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-3 pr-2 border-r border-slate-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900 leading-tight flex items-center space-x-1">
                    <span>{user.name}</span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" title="Sesión activa"></span>
                  </span>
                  <span className="text-[11px] text-slate-500 leading-tight">{user.email}</span>
                </div>
              </div>

              <Link
                to="/pedidos/nuevo"
                className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm shadow-indigo-500/20 hover:shadow-md transition active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nuevo Pedido</span>
              </Link>

              <form action="/logout" method="post">
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 text-slate-500 hover:text-rose-600 px-2.5 py-2 rounded-lg text-sm font-medium hover:bg-rose-50 transition cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline text-xs">Salir</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-slate-500 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Sistema en línea</span>
          </div>
          <div>
            Panel de Gestión &bull; {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </div>
  );
}
