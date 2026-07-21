import { ReactNode } from "react";
import Link from "next/link";
import { Activity, LayoutDashboard, Users, Calendar, Settings } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  params: {
    tenantId: string;
  };
}

export default function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { tenantId } = params;

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col justify-between bg-slate-900 p-4 text-white">
        <div className="space-y-6">
          <Link href={`/${tenantId}`} className="flex items-center space-x-2 px-2">
            <Activity className="h-6 w-6 text-blue-400" />
            <span className="text-lg font-bold">NextDoorClinic</span>
          </Link>
          <nav className="space-y-1">
            <Link
              href={`/${tenantId}`}
              className="flex items-center space-x-3 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href={`/${tenantId}/patients`}
              className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <Users className="h-4 w-4" />
              <span>Patients</span>
            </Link>
            <Link
              href={`/${tenantId}/appointments`}
              className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <Calendar className="h-4 w-4" />
              <span>Appointments</span>
            </Link>
          </nav>
        </div>
        <div className="space-y-2">
          <Link
            href={`/${tenantId}/settings`}
            className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
          <div className="border-t border-slate-800 px-3 pt-4 text-xs text-slate-400">
            Tenant ID: <code className="mt-1 block font-mono text-blue-300">{tenantId}</code>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
          <h1 className="text-xl font-semibold text-slate-800">Workspace Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-500">Welcome, Clinic Admin</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              CA
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
