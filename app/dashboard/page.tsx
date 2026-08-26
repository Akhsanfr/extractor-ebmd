import { redirect } from "next/navigation";

export default function Page() {
  // otomatis langsung diarahkan ke home
  redirect("/dashboard/home");
}