import { AntDesign } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useGoogleAuth } from '../context/GoogleAuthContext';

interface Props {
  onSignInComplete?: () => void;
}

export const GoogleSignInButton: React.FC<Props> = ({ onSignInComplete }) => {
  const { signIn, loading, setSignInSuccessCallback } = useGoogleAuth();

  useEffect(() => {
    if (onSignInComplete) {
      setSignInSuccessCallback(onSignInComplete);
    }
  }, [onSignInComplete, setSignInSuccessCallback]);

  const handleSignIn = async () => {
    try {
      console.log('GoogleSignInButton: Starting sign in process...');
      await signIn();
      console.log('GoogleSignInButton: Sign in completed successfully');
      // The success callback will be called automatically by the hook
    } catch (error) {
      console.error('GoogleSignInButton: Sign in error:', error);
      Alert.alert(
        'Sign In Error',
        'Failed to sign in with Google. Please try again.',
        [{ text: 'OK' }]
      );
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