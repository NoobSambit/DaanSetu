import AdminNavigation from "@/components/workspaces/AdminNavigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminNavigation />
      {children}
    </>
  );
}
