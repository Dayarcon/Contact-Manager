import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Replace these with your own Google OAuth credentials
const GOOGLE_WEB_CLIENT_ID = '66493933765-up9oj0479db6h4qri889qva59mlv03di.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = '66493933765-up9oj0479db6h4qri889qva59mlv03di.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = '66493933765-hfnt1dvsgk1h1058hdhk7v56or46m7ic.apps.googleusercontent.com';

// Use the app scheme for redirect URI instead of Expo development URL
const REDIRECT_URI = Platform.select({
  web: 'https://auth.expo.io/@freefworlds/contactly',
  default: 'com.freefworlds.contactly://'
});

export function useGoogleAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [onSignInSuccess, setOnSignInSuccess] = useState<(() => void) | null>(null);
  const [hasProcessedResponse, setHasProcessedResponse] = useState(false);

  // Configure Google Sign-In
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });
    
    checkExistingToken();
  }, []);

  // Reset response processing flag when accessToken changes
  useEffect(() => {
    setHasProcessedResponse(false);
  }, [accessToken]);

  useEffect(() => {
    if (accessToken && !hasProcessedResponse) {
      console.log('Access token received:', accessToken);
      setHasProcessedResponse(true);
      
      if (accessToken) {
        console.log('Access token already provided by Google Sign-In');
        getUserInfo(accessToken);
        setLoading(false);
        // Call the success callback if provided
        if (onSignInSuccess) {
          console.log('Calling sign-in success callback...');
          onSignInSuccess();
        } else {
          console.log('No sign-in success callback set');
        }
      }
    }
  }, [accessToken, onSignInSuccess, hasProcessedResponse]);

  const checkExistingToken = async () => {
    try {
      const token = await AsyncStorage.getItem('googleAccessToken');
      if (token) {
        setAccessToken(token);
        await getUserInfo(token);
      }
    } catch (error) {
      console.error('Error checking existing token:', error);
    }
  };

  const getUserInfo = async (token: string) => {
    try {
      const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const info = await response.json();
      setUserInfo(info);
    } catch (error) {
      console.error('Error getting user info:', error);
    }
  };

  const testOAuthConfig = () => {
    console.log('=== OAuth Configuration Test ===');
    console.log('Platform:', Platform.OS);
    console.log('Redirect URI:', REDIRECT_URI);
    console.log('Web Client ID:', GOOGLE_WEB_CLIENT_ID);
    console.log('Android Client ID:', GOOGLE_ANDROID_CLIENT_ID);
    console.log('iOS Client ID:', GOOGLE_IOS_CLIENT_ID);
    console.log('Using Client ID:', Platform.OS === 'android' ? GOOGLE_ANDROID_CLIENT_ID : GOOGLE_WEB_CLIENT_ID);
    console.log('===============================');
  };

  const signIn = async () => {
    try {
      setLoading(true);
      console.log('Starting Google sign in...');
      testOAuthConfig();
      
      // Check if user is already signed in
      const isSignedIn = await GoogleSignin.hasPreviousSignIn();
      if (isSignedIn) {
        console.log('User is already signed in');
        const user = await GoogleSignin.getCurrentUser();
        if (user) {
          const tokens = await GoogleSignin.getTokens();
          setAccessToken(tokens.accessToken);
          await AsyncStorage.setItem('googleAccessToken', tokens.accessToken);
          await getUserInfo(tokens.accessToken);
          if (onSignInSuccess) {
            console.log('Calling sign-in success callback...');
            onSignInSuccess();
          }
        }
        return;
      }

      // Sign in
      const userInfo = await GoogleSignin.signIn();
      console.log('Sign in successful:', userInfo);
      
      // Get tokens
      const tokens = await GoogleSignin.getTokens();
      console.log('Got tokens:', tokens);
      
      setAccessToken(tokens.accessToken);
      await AsyncStorage.setItem('googleAccessToken', tokens.accessToken);
      await getUserInfo(tokens.accessToken);
      
      // Call success callback
      if (onSignInSuccess) {
        console.log('Calling sign-in success callback...');
        onSignInSuccess();
      }
      
    } catch (error: any) {
      console.error('Sign in error:', error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the sign-in flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign-in is in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Play services not available');
      } else {
        console.error('Other error:', error);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await GoogleSignin.signOut();
      await AsyncStorage.removeItem('googleAccessToken');
      setAccessToken(null);
      setUserInfo(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getContacts = async () => {
    try {
      if (!accessToken) {
        throw new Error('Not signed in');
      }

      const response = await fetch(
        'https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers,emailAddresses',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch Google contacts');
      }

      const data = await response.json();
      return parseGoogleContacts(data);
    } catch (error) {
      console.error('Error fetching Google contacts:', error);
      throw error;
    }
  };

  const parseGoogleContacts = (data: any) => {
    return data.connections?.map((contact: any) => ({
      id: contact.resourceName,
      name: contact.names?.[0]?.displayName || '',
      phoneNumbers: contact.phoneNumbers?.map((phone: any) => phone.value) || [],
      emails: contact.emailAddresses?.map((email: any) => email.value) || [],
    })) || [];
  };

  const createGoogleContact = async (contact: any) => {
    try {
      if (!accessToken) {
        throw new Error('Not signed in');
      }

      const response = await fetch(
        'https://people.googleapis.com/v1/people:createContact',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            names: [
              {
                givenName: contact.firstName || '',
                familyName: contact.lastName || '',
                displayName: contact.name,
              },
            ],
            phoneNumbers: contact.phoneNumbers.map((phone: any) => ({
              value: phone.number,
              type: phone.type.toLowerCase(),
            })),
            emailAddresses: contact.emailAddresses.map((email: any) => ({
              value: email.email,
              type: email.type.toLowerCase(),
            })),
            organizations: contact.company ? [
              {
                name: contact.company,
                title: contact.jobTitle,
              },
            ] : undefined,
            biographies: contact.notes ? [
              {
                value: contact.notes,
                contentType: 'TEXT_PLAIN',
              },
            ] : undefined,
            birthdays: contact.birthday ? [
              {
                date: {
                  year: new Date(contact.birthday).getFullYear(),
                  month: new Date(contact.birthday).getMonth() + 1,
                  day: new Date(contact.birthday).getDate(),
                },
              },
            ] : undefined,
            addresses: contact.address ? [
              {
                formattedValue: contact.address,
                type: 'home',
              },
            ] : undefined,
            urls: contact.website ? [
              {
                value: contact.website,
                type: 'website',
              },
            ] : undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create Google contact');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating Google contact:', error);
      throw error;
    }
  };

  const updateGoogleContact = async (resourceName: string, contact: any) => {
    try {
      if (!accessToken) {
        throw new Error('Not signed in');
      }

      const response = await fetch(
        `https://people.googleapis.com/v1/people/${resourceName}:updateContact`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            etag: '*',
            names: [
              {
                givenName: contact.firstName || '',
                familyName: contact.lastName || '',
                displayName: contact.name,
              },
            ],
            phoneNumbers: contact.phoneNumbers.map((phone: any) => ({
              value: phone.number,
              type: phone.type.toLowerCase(),
            })),
            emailAddresses: contact.emailAddresses.map((email: any) => ({
              value: email.email,
              type: email.type.toLowerCase(),
            })),
            organizations: contact.company ? [
              {
                name: contact.company,
                title: contact.jobTitle,
              },
            ] : undefined,
            biographies: contact.notes ? [
              {
                value: contact.notes,
                contentType: 'TEXT_PLAIN',
              },
            ] : undefined,
            birthdays: contact.birthday ? [
              {
                date: {
                  year: new Date(contact.birthday).getFullYear(),
                  month: new Date(contact.birthday).getMonth() + 1,
                  day: new Date(contact.birthday).getDate(),
                },
              },
            ] : undefined,
            addresses: contact.address ? [
              {
                formattedValue: contact.address,
                type: 'home',
              },
            ] : undefined,
            urls: contact.website ? [
              {
                value: contact.website,
                type: 'website',
              },
            ] : undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update Google contact');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating Google contact:', error);
      throw error;
    }
  };

  const deleteGoogleContact = async (resourceName: string) => {
    try {
      if (!accessToken) {
        throw new Error('Not signed in');
      }

      const response = await fetch(
        `https://people.googleapis.com/v1/people/${resourceName}:deleteContact`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete Google contact');
      }

      return true;
    } catch (error) {
      console.error('Error deleting Google contact:', error);
      throw error;
    }
  };

  const setSignInSuccessCallback = (callback: () => void) => {
    setOnSignInSuccess(() => callback);
  };

  return {
    signIn,
    signOut,
    getContacts,
    createGoogleContact,
    updateGoogleContact,
    deleteGoogleContact,
    setSignInSuccessCallback,
    accessToken,
    userInfo,
    loading,
    isSignedIn: !!accessToken,
  };
} 