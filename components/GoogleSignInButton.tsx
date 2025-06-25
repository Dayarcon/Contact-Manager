import { AntDesign } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useGoogleAuth } from '../context/GoogleAuthContext';

interface Props {
  onSignInComplete?: () => void;
}

export const GoogleSignInButton: React.FC<Props> = ({ onSignInComplete }) => {
  const { signIn, loading } = useGoogleAuth();

  const handleSignIn = async () => {
    try {
      await signIn();
      onSignInComplete?.();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleSignIn}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <AntDesign name="google" size={24} color="white" style={styles.icon} />
          <Text style={styles.text}>Sign in with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    marginVertical: 10,
  },
  icon: {
    marginRight: 10,
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 