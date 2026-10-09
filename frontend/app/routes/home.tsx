import { redirect } from "react-router";

export function loader() {
  return redirect("/pedidos");
}

export default function HomePage() {
  return null;
}
