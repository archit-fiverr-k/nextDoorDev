import { ActiveSessionsView } from "@/components/auth/active-sessions-view";

export const revalidate = 0;

interface ActiveSessionsPageProps {
  params: {
    tenantId: string;
  };
}

export default function ActiveSessionsPage({ params }: ActiveSessionsPageProps) {
  return <ActiveSessionsView />;
}
