import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { checkDevMode, DevUser } from '../lib/dev-auth';

interface DevAuthContextType {
  isDevMode: boolean;
  isLoading: boolean;
  devUser: DevUser | null;
}

const DevAuthContext = createContext<DevAuthContextType>({
  isDevMode: false,
  isLoading: true,
  devUser: null,
});

export function useDevAuth() {
  return useContext(DevAuthContext);
}

export function DevAuthProvider({ children }: { children: ReactNode }) {
  const [isDevMode, setIsDevMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [devUser, setDevUser] = useState<DevUser | null>(null);

  useEffect(() => {
    checkDevMode()
      .then((user) => {
        if (user) {
          setIsDevMode(true);
          setDevUser(user);
          console.log('Dev mode detected - bypassing MSAL authentication');
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <DevAuthContext.Provider value={{ isDevMode, isLoading, devUser }}>
      {children}
    </DevAuthContext.Provider>
  );
}
