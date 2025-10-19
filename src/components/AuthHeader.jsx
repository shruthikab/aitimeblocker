"use client";
import { useAuth } from "react-oidc-context";
import { User, LogIn, LogOut, Menu } from "lucide-react";

export default function AuthHeader() {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <header className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-rose-400 via-purple-500 to-blue-500 rounded-lg"></div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-600 via-purple-600 to-blue-600">
                PlayBlocks
              </span>
            </div>
            <div className="text-sm text-gray-500">Loading...</div>
          </div>
        </div>
      </header>
    );
  }

  const signOutRedirect = () => {
    const clientId = "735ne15erm27ujb0j0vbvnjjpo";
    const logoutUri = "https://localhost:3000";
    const cognitoDomain = "https://playblocks.auth.us-east-2.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  return (
    <header className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-rose-400 via-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PB</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-600 via-purple-600 to-blue-600">
              PlayBlocks
            </span>
          </div>

          {auth.error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-lg">
              Auth Error
            </div>
          )}

          {auth.isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">
                    {auth.user?.profile?.email || auth.user?.profile?.sub?.substring(0, 8)}
                  </p>
                  <p className="text-xs text-gray-500">Signed in</p>
                </div>
              </div>
              <button
                onClick={() => auth.removeUser()}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => auth.signinRedirect()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all font-medium shadow-lg hover:shadow-xl"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

