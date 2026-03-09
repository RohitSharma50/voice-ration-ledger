import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  phone: string | null;
  isAuthenticated: boolean;
  login: (phone: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  phone: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [phone, setPhone] = useState<string | null>(() =>
    localStorage.getItem("auth_phone")
  );

  const isAuthenticated = !!phone;

  const login = (ph: string) => {
    localStorage.setItem("auth_phone", ph);
    setPhone(ph);
  };

  const logout = () => {
    localStorage.removeItem("auth_phone");
    setPhone(null);
  };

  return (
    <AuthContext.Provider value={{ phone, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
