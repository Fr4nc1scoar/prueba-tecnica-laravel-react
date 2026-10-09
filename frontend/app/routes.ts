import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/home.tsx"),
    route("pedidos", "routes/pedidos.tsx"),
    route("pedidos/nuevo", "routes/nuevo-pedido.tsx"),
    route("pedidos/:id", "routes/detalle-pedido.tsx"),
    route("productos", "routes/productos.tsx"),
    route("productos/nuevo", "routes/nuevo-producto.tsx"),
    route("productos/:id/editar", "routes/editar-producto.tsx"),
  ]),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
] satisfies RouteConfig;
