import { Sidebar } from "@/components";
import AppAuthGate from "@/components/AppAuthGate";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppAuthGate>
      <div className="flex min-h-screen bg-[#fffdfc] text-neutral-950 selection:bg-[#FF4500]/20 selection:text-[#FF4500]">
        <Sidebar />
        <main className="flex-1 pl-64 min-h-screen">{children}</main>
      </div>
    </AppAuthGate>
  );
}

