import { redirect } from "next/navigation";

// The dashboard arrives in step 5; until then the request queue is the admin home.
export default function AdminHome() {
  redirect("/admin/requests");
}
