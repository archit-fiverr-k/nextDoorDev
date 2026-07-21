interface DashboardPageProps {
  params: {
    tenantId: string;
  };
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const { tenantId } = params;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-2xl font-bold text-slate-900">Welcome to your workspace</h2>
        <p className="text-slate-500">
          This is your multi-tenant isolated clinical dashboard. Configure your clinic details,
          manage staff rosters, and start booking patients.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-1 font-semibold text-slate-700">Total Patients</h3>
          <p className="text-3xl font-bold text-blue-600">0</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-1 font-semibold text-slate-700">Today&apos;s Appointments</h3>
          <p className="text-3xl font-bold text-blue-600">0</p>
        </div>
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-1 font-semibold text-slate-700">Active Clinicians</h3>
          <p className="text-3xl font-bold text-blue-600">0</p>
        </div>
      </div>
    </div>
  );
}
