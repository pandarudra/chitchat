import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Signup } from "./pages/Auth/Signup";
import { Login } from "./pages/Auth/Login";
import { AuthProvider } from "./context/AuthContext";
import { Landing } from "./pages/Home/Landing";
import { PublicRoute } from "./components/auth/Public";
import { ChatBoard } from "./pages/chat/ChatBoard";
import { PrivateRoute } from "./components/auth/Private";
import { ChatProvider } from "./context/ChatContext";

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <Landing />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute restricted>
                <Signup />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute restricted>
                <Login />
              </PublicRoute>
            }
          />

          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <ChatProvider>
                  <ChatBoard />
                </ChatProvider>
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
