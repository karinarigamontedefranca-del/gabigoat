import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-h-screen px-8 py-8 max-w-7xl mx-auto w-full">{children}</main>
    </div>
  );
}
