import { redirect } from "next/navigation";
import { hasValidSession } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await hasValidSession())) {
    redirect("/login");
  }

  return children;
}
