import React, { createContext, useContext } from 'react';
import { useGoogleAuth as useGoogleAuthHook } from '../hooks/useGoogleAuth';

interface GoogleAuthContextType {
  isSignedIn: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  syncContacts: () => Promise<void>;
  loading: boolean;
  userInfo: any;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export const useGoogleAuth = () => {
  const context = useContext(GoogleAuthContext);
  if (!context) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
};

export const GoogleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    signIn,
    signOut,
    getContacts: syncContacts,
    loading,
    isSignedIn,
    userInfo,
  } = useGoogleAuthHook();

  return (
    <GoogleAuthContext.Provider
      value={{
        isSignedIn,
        signIn,
        signOut,
        syncContacts,
        loading,
        userInfo,
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  );
}; 