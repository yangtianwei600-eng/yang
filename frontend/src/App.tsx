import { useAuth } from "@/hooks/useAuth";
import { LoginScreen } from "@/components/LoginScreen";
import { CodeLab } from "@/components/CodeLab";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-accent" />
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return (
    <div className="flex h-full flex-col bg-bg-base">
      <div className="min-h-0 flex-1 p-2">
        <CodeLab user={user} />
      </div>
    </div>
  );
}
