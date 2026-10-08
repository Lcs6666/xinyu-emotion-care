import { getCurrentUser } from "./auth";
import LoginPanel from "./login-panel";
import XinyuApp from "./xinyu-app";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) return <LoginPanel />;
  return <XinyuApp user={{ name: user.displayName }} />;
}
