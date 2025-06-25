import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

// Replace these with your own Google OAuth credentials
const GOOGLE_WEB_CLIENT_ID = '66493933765-up9oj0479db6h4qri889qva59mlv03di.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = '66493933765-up9oj0479db6h4qri889qva59mlv03di.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = '66493933765-hfnt1dvsgk1h1058hdhk7v56or46m7ic.apps.googleusercontent.com';

const REDIRECT_URI = Platform.select({
  web: 'https://auth.expo.io/@freefworlds/contactly',
  default: 'com.freefworlds.contactly://'
});

export function useGoogleAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    scopes: ['https://www.googleapis.com/auth/contacts', 'https://www.googleapis.com/auth/contacts.readonly', 'profile', 'email'],
    redirectUri: REDIRECT_URI,
    usePKCE: true,
    responseType: 'code'
  });

  useEffect(() => {
    checkExistingToken();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      exchangeCodeForToken(code);
    }
  }, [response]);

  const exchangeCodeForToken = async (code: string) => {
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_WEB_CLIENT_ID,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
          code_verifier: request?.codeVerifier || '',
        }).toString(),
      });

      const data = await tokenResponse.json();
      if (data.access_token) {
        setAccessToken(data.access_token);
        await AsyncStorage.setItem('googleAccessToken', data.access_token);
        await getUserInfo(data.access_token);
      } else {
        console.error('Token response error:', data);
      }
    } catch (error) {
      console.error('Error exchanging code for token:', error);
    }
  };

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

  const signIn = async () => {
    try {
      setLoading(true);
      if (!request) {
        throw new Error('Auth request not initialized');
      }
      const result = await promptAsync();
      if (result.type === 'error') {
        console.error('Auth error:', result);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
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

  return {
    signIn,
    signOut,
    getContacts,
    createGoogleContact,
    updateGoogleContact,
    deleteGoogleContact,
    accessToken,
    userInfo,
    loading,
    isSignedIn: !!accessToken,
  };
} 