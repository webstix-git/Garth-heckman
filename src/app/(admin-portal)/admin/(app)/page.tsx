import { redirect } from "next/navigation";

/** /admin → dashboard */
export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}
