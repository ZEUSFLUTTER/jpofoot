import { redirect } from "next/navigation";

export default function GestRedirect() {
  redirect("/manager/login");
}
