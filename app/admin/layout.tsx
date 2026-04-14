import type { Metadata } from "next";
import AdminAuthGate from "./AdminAuthGate";

export const metadata: Metadata = {
  title: "Admin",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
  <div className="min-h-[80svh]">
    <AdminAuthGate>{children}</AdminAuthGate>
  </div>
  )
}
