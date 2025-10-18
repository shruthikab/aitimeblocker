"use client";
import { useAuth } from "react-oidc-context";

export default function AuthStatus() {
  const auth = useAuth();

  const signOutRedirect = () => {
    const clientId = "735ne15erm27ujb0j0vbvnjjpo";
    const logoutUri = "https://localhost:3000"; // update to your logout redirect URI
    const cognitoDomain = "https://<your-cognito-domain>"; // e.g. https://your-domain.auth.us-east-2.amazoncognito.com
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Encountering error... {auth.error.message}</div>;
  }

  if (auth.isAuthenticated) {
    return (
      <div className="space-y-2">
        <pre className="font-mono">Hello: {auth.user?.profile?.email}</pre>
        <pre className="font-mono">ID Token: {auth.user?.id_token}</pre>
        <pre className="font-mono">Access Token: {auth.user?.access_token}</pre>
        <pre className="font-mono">Refresh Token: {auth.user?.refresh_token}</pre>
        <div className="flex gap-2">
          <button className="px-3 py-1 border" onClick={() => auth.removeUser()}>
            Sign out (removeUser)
          </button>
          <button className="px-3 py-1 border" onClick={() => signOutRedirect()}>
            Sign out (Cognito redirect)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button className="px-3 py-1 border" onClick={() => auth.signinRedirect()}>
        Sign in
      </button>
      <button className="px-3 py-1 border" onClick={() => signOutRedirect()}>
        Sign out
      </button>
    </div>
  );
}
