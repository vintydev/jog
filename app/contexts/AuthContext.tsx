import React, { createContext, useContext } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '@/app/types/User';
import useAuth from '@/app/hooks/useAuth';

type AuthContextType = {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,

});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, userData, loading} = useAuth(); 

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>

      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext); 