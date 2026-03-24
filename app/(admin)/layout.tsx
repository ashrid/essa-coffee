import { auth, signOut } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // No session: middleware handles redirects to login.
  // Render children only (login page renders its own full-page layout).
  if (!session) {
    return <>{children}</>;
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/admin/login" });
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <AdminSidebar onSignOut={handleSignOut} />

      {/* Main Content - Add top padding on mobile for the header */}
      <main className="flex-1 min-h-screen overflow-auto bg-white pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
