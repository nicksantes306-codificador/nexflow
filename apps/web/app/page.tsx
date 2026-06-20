import { redirect } from "next/navigation";

// Raiz → o middleware decide: logado vai p/ dashboard, senão /login.
export default function Home() {
  redirect("/dashboard");
}
