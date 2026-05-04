import { useAuth } from "./hooks/useAuth";
import { AuthPage } from "./pages/AuthPage";
import { ChatPage } from "./pages/ChatPage";

function App() {
  const auth = useAuth();

  if (!auth.session) {
    return <AuthPage onLogin={auth.login} onRegister={auth.register} />;
  }

  return (
    <ChatPage
      authNotice={auth.notice}
      onLogout={auth.logout}
      session={auth.session}
    />
  );
}

export default App;
