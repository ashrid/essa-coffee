import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import { CartDrawer } from "@/components/store/CartDrawer";
import { Toaster } from "sonner";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
