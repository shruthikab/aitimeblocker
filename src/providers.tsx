'use client';
import { AuthProvider } from 'react-oidc-context';

const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-2.amazonaws.com/us-east-2_nA3phTO2T",
  client_id: "735ne15erm27ujb0j0vbvnjjpo",
  redirect_uri: "https://localhost:3000",
  response_type: "code",
  scope: "phone openid email",
};

export default function Providers({ children }) {
  return <AuthProvider {...cognitoAuthConfig}>{children}</AuthProvider>;
}