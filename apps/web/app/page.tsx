import { redirect } from "next/navigation";

// Raiz → o middleware decide: logado vai p/ /crm, senão /login.
export default function Home() {
  redirect("/crm");
}
