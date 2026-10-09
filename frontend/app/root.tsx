import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";
import type { ReactNode } from "react";
import stylesheet from "~/app.css?url";

export function links() {
  return [
    { rel: "stylesheet", href: stylesheet },
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossOrigin: "anonymous",
    },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
    },
  ];
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="h-full bg-slate-50">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>NexusERP &bull; Gestión de Pedidos e Inventario</title>
        <Meta />
        <Links />
      </head>
      <body className="h-full flex flex-col">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: { error: unknown }) {
  let message = "Ocurrió un error inesperado";
  let details = "Por favor intente nuevamente.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText}`;
    details = error.data?.message || "La página o recurso no fue encontrado.";
  } else if (error instanceof Error) {
    message = error.message;
    stack = error.stack;
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-slate-200">
        <h1 className="text-2xl font-bold text-red-600 mb-2">{message}</h1>
        <p className="text-slate-600 mb-4">{details}</p>
        {stack && (
          <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded overflow-x-auto mb-4">
            {stack}
          </pre>
        )}
        <a
          href="/pedidos"
          className="inline-block bg-blue-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Volver al panel
        </a>
      </div>
    </main>
  );
}
