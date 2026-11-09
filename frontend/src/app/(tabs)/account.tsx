import { useAuth } from "@clerk/expo";
import { AccountScreen } from "../../modules/account/AccountScreen";
import { AuthScreen } from "../../modules/auth/AuthScreen";
export default function Account() {
  const { isSignedIn } = useAuth();
  return isSignedIn ? <AccountScreen /> : <AuthScreen />;
}
