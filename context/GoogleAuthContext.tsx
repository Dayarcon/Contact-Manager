import React, { createContext, useContext } from 'react';
import { useGoogleAuth as useGoogleAuthHook } from '../hooks/useGoogleAuth';

interface GoogleAuthContextType {
  isSignedIn: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  syncContacts: () => Promise<void>;
  getContacts: () => Promise<any[]>;
  loading: boolean;
  userInfo: any;
  createGoogleContact: (contact: any) => Promise<any>;
  updateGoogleContact: (resourceName: string, contact: any) => Promise<any>;
  deleteGoogleContact: (resourceName: string) => Promise<boolean>;
  setSignInSuccessCallback: (callback: () => void) => void;
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
    getContacts,
    createGoogleContact,
    updateGoogleContact,
    deleteGoogleContact,
    setSignInSuccessCallback,
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
        getContacts,
        createGoogleContact,
        updateGoogleContact,
        deleteGoogleContact,
        setSignInSuccessCallback,
        loading,
        userInfo,
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  );
}; 