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
  const [isSigningIn, setIsSigningIn] = useState(false);

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
        if (onSignInSuccess && !isSigningIn) {
          console.log('Calling sign-in success callback...');
          // Use setTimeout to ensure state is updated before calling the callback
          setTimeout(() => {
            onSignInSuccess();
          }, 100);
        } else {
          console.log('No sign-in success callback set or already signing in');
        }
      }
    }
  }, [accessToken, onSignInSuccess, hasProcessedResponse, isSigningIn]);

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

  const testGoogleAPI = async () => {
    try {
      if (!accessToken) {
        console.log('No access token available for API test');
        return false;
      }

      console.log('Testing Google API connectivity...');
      
      // Test with a simple API call to get user profile
      const response = await fetch(
        'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Google API test response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Google API test successful:', data);
        return true;
      } else {
        const errorText = await response.text();
        console.error('Google API test failed:', errorText);
        return false;
      }
    } catch (error) {
      console.error('Google API test error:', error);
      return false;
    }
  };

  const ensureAccessToken = async () => {
    console.log('=== ensureAccessToken called ===');
    console.log('Current accessToken in state:', accessToken ? 'Present' : 'Missing');
    
    if (accessToken) {
      console.log('Using existing access token from state');
      return accessToken;
    }
    
    console.log('No access token in state, checking GoogleSignin...');
    const isSignedIn = await GoogleSignin.hasPreviousSignIn();
    console.log('GoogleSignin.hasPreviousSignIn():', isSignedIn);
    
    if (isSignedIn) {
      try {
        console.log('Getting tokens from GoogleSignin...');
        const tokens = await GoogleSignin.getTokens();
        console.log('Tokens received:', tokens ? 'Success' : 'Failed');
        
        if (tokens?.accessToken) {
          console.log('Setting access token in state...');
          setAccessToken(tokens.accessToken);
          await AsyncStorage.setItem('googleAccessToken', tokens.accessToken);
          console.log('Retrieved access token from GoogleSignin');
          return tokens.accessToken;
        } else {
          console.log('No access token in tokens object');
        }
      } catch (error) {
        console.error('Failed to get tokens from GoogleSignin:', error);
      }
    } else {
      console.log('User is not signed in according to GoogleSignin');
    }
    
    throw new Error('Not signed in to Google');
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
      if (isSigningIn) {
        console.log('Sign-in already in progress, skipping...');
        return;
      }
      
      setIsSigningIn(true);
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
          
          // Test API connectivity
          const apiTestResult = await testGoogleAPI();
          console.log('Google API test result (existing sign-in):', apiTestResult);
          
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
      
      // Test API connectivity
      const apiTestResult = await testGoogleAPI();
      console.log('Google API test result:', apiTestResult);
      
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
      setIsSigningIn(false);
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

  const getContacts = async (onContactProcessed?: (contact: any) => void) => {
    try {
      console.log('=== getContacts called ===');
      
      // Ensure we have a valid access token
      const currentAccessToken = await ensureAccessToken();
      console.log('Using access token:', currentAccessToken.substring(0, 20) + '...');
      
      let response = await fetch(
        'https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers,emailAddresses,organizations,biographies,birthdays,addresses,urls,photos,memberships&pageSize=1000',
        {
          headers: {
            Authorization: `Bearer ${currentAccessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Google API response status:', response.status);
      console.log('Google API response headers:', Object.fromEntries(response.headers.entries()));

      // If token is expired, try to refresh it
      if (response.status === 401) {
        console.log('Access token expired, attempting to refresh...');
        try {
          const tokens = await GoogleSignin.getTokens();
          const newAccessToken = tokens.accessToken;
          setAccessToken(newAccessToken);
          await AsyncStorage.setItem('googleAccessToken', newAccessToken);
          
          console.log('Token refreshed, retrying request...');
          response = await fetch(
            'https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers,emailAddresses,organizations,biographies,birthdays,addresses,urls,photos,memberships&pageSize=1000',
            {
              headers: {
                Authorization: `Bearer ${newAccessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );
          console.log('Retry response status:', response.status);
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          throw new Error('Access token expired and could not be refreshed. Please sign in again.');
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google API error response:', errorText);
        throw new Error(`Failed to fetch Google contacts: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Google API response data keys:', Object.keys(data));
      console.log('Number of connections received:', data.connections?.length || 0);
      
      return await parseGoogleContacts(data, onContactProcessed);
    } catch (error) {
      console.error('Error fetching Google contacts:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  };

  const getGoogleContactGroups = async () => {
    try {
      // Ensure we have a valid access token
      const currentAccessToken = await ensureAccessToken();
      
      console.log('Fetching Google contact groups...');
      
      let response = await fetch(
        'https://people.googleapis.com/v1/contactGroups',
        {
          headers: {
            Authorization: `Bearer ${currentAccessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Google contact groups API response status:', response.status);

      // If token is expired, try to refresh it
      if (response.status === 401) {
        console.log('Access token expired for contact groups, attempting to refresh...');
        try {
          const tokens = await GoogleSignin.getTokens();
          const newAccessToken = tokens.accessToken;
          setAccessToken(newAccessToken);
          await AsyncStorage.setItem('googleAccessToken', newAccessToken);
          
          console.log('Token refreshed, retrying contact groups request...');
          response = await fetch(
            'https://people.googleapis.com/v1/contactGroups',
            {
              headers: {
                Authorization: `Bearer ${newAccessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );
          console.log('Contact groups retry response status:', response.status);
        } catch (refreshError) {
          console.error('Failed to refresh token for contact groups:', refreshError);
          return []; // Return empty array instead of throwing error for contact groups
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google contact groups API error response:', errorText);
        throw new Error(`Failed to fetch Google contact groups: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Google contact groups response data keys:', Object.keys(data));
      console.log('Number of contact groups received:', data.contactGroups?.length || 0);
      
      return data.contactGroups || [];
    } catch (error) {
      console.error('Error fetching Google contact groups:', error);
      if (error instanceof Error) {
        console.error('Contact groups error details:', error.message);
      }
      return [];
    }
  };

  const parseGoogleContacts = async (data: any, onContactProcessed?: (contact: any) => void) => {
    console.log(`Starting to parse ${data.connections?.length || 0} Google contacts...`);
    
    // First, get the actual contact groups to map IDs to names
    let contactGroups: any[] = [];
    try {
      contactGroups = await getGoogleContactGroups();
      console.log(`Found ${contactGroups.length} Google contact groups`);
    } catch (error) {
      console.log('Could not fetch contact groups, will use fallback mapping');
    }
    
    // Create a mapping from group resource names to actual group names
    const groupNameMapping: Record<string, string> = {};
    contactGroups.forEach(group => {
      if (group.resourceName && group.name) {
        groupNameMapping[group.resourceName] = group.name;
      }
    });
    
    const startTime = Date.now();
    const parsedContacts: any[] = [];
    
    // Process contacts one by one
    for (let index = 0; index < (data.connections?.length || 0); index++) {
      const contact = data.connections[index];
      const name = contact.names?.[0];
      const organization = contact.organizations?.[0];
      const birthday = contact.birthdays?.[0];
      const address = contact.addresses?.[0];
      const website = contact.urls?.find((url: any) => url.type === 'website')?.value;
      const biography = contact.biographies?.[0]?.value;
      const photo = contact.photos?.[0];
      const memberships = contact.memberships || [];

      // Helper function to validate and fix image URI
      const getValidImageUri = (photo: any) => {
        if (!photo?.url) return undefined;
        
        // Google Photos URLs sometimes need the access token appended
        let imageUri = photo.url;
        
        // If it's a Google Photos URL and we have an access token, append it
        if (imageUri.includes('googleusercontent.com') && accessToken) {
          imageUri = `${imageUri}?access_token=${accessToken}`;
        }
        
        return imageUri;
      };

      // Extract Google contact groups and labels
      const extractGoogleGroupsAndLabels = (memberships: any[]) => {
        const groups: string[] = [];
        const labels: string[] = [];
        let isColorOSVIP = false; // Track if ColorOS has marked this as VIP
        
        memberships.forEach((membership) => {
          if (membership.contactGroupMembership) {
            const groupResourceName = membership.contactGroupMembership.contactGroupResourceName;
            
            // Try to get the actual group name from our mapping first
            let actualGroupName = groupNameMapping[groupResourceName];
            
            if (!actualGroupName) {
              // Fallback: Extract the actual group name from the resource name
              // Google format: contactGroups/{groupId}
              const groupNameParts = groupResourceName.split('/');
              const groupId = groupNameParts[groupNameParts.length - 1];
              
              // Map common Google group IDs to our app's group names
              // You can customize this mapping based on your Google contact groups
              actualGroupName = `Group ${groupId}`;
              
              // Common Google group mappings (these are examples - adjust based on your actual groups)
              if (groupId.includes('family') || groupId.includes('Family')) {
                actualGroupName = 'Family';
              } else if (groupId.includes('work') || groupId.includes('Work') || groupId.includes('job')) {
                actualGroupName = 'Work';
              } else if (groupId.includes('friends') || groupId.includes('Friends')) {
                actualGroupName = 'Friends';
              } else if (groupId.includes('emergency') || groupId.includes('Emergency')) {
                actualGroupName = 'Emergency';
              } else if (groupId.includes('favorite') || groupId.includes('starred')) {
                actualGroupName = 'Favorites';
              } else if (groupId.includes('myContacts')) {
                actualGroupName = 'My Contacts';
              } else if (groupId.includes('starred')) {
                actualGroupName = 'Starred';
                isColorOSVIP = true; // ColorOS often uses "starred" for VIP
              } else if (groupId.includes('otherContacts')) {
                actualGroupName = 'Other Contacts';
              } else if (groupId.includes('vip')) {
                actualGroupName = 'VIP';
                isColorOSVIP = true;
              } else if (groupId.includes('important')) {
                actualGroupName = 'Important';
                isColorOSVIP = true;
              } else {
                // For unknown group IDs, try to extract a meaningful name
                // or use a generic name based on the ID pattern
                
                // Check if it's a numeric ID (like ColorOS uses)
                if (/^\d+$/.test(groupId)) {
                  actualGroupName = `Custom Group ${groupId}`;
                  // Check if this numeric ID might be a VIP group
                  if (groupId.length > 8) { // ColorOS VIP groups often have longer IDs
                    isColorOSVIP = true;
                  }
                } else {
                  actualGroupName = `Group ${groupId}`;
                }
              }
            }
          }
        });
        
        return { groups, labels, isColorOSVIP };
      };

      const { groups, labels, isColorOSVIP } = extractGoogleGroupsAndLabels(memberships);

      // Create contact object
      const contactObj = {
        name,
        organization,
        birthday,
        address,
        website,
        biography,
        photo: getValidImageUri(photo),
        groups,
        labels,
        isColorOSVIP,
      };

      parsedContacts.push(contactObj);
    }

    console.log(`Parsed ${parsedContacts.length} Google contacts in ${Date.now() - startTime}ms`);
    
    return parsedContacts;
  };

  const setSignInSuccessCallback = (callback: () => void) => {
    setOnSignInSuccess(() => callback);
  };

  const createGoogleContact = async (contact: any) => {
    // Implementation of createGoogleContact
  };

  const updateGoogleContact = async (contact: any) => {
    // Implementation of updateGoogleContact
  };

  const deleteGoogleContact = async (contact: any) => {
    // Implementation of deleteGoogleContact
  };

  return {
    accessToken,
    userInfo,
    loading,
    isSignedIn: !!accessToken,
    signIn,
    signOut,
    getContacts,
    getGoogleContactGroups,
    createGoogleContact,
    updateGoogleContact,
    deleteGoogleContact,
    setSignInSuccessCallback,
    testGoogleAPI,
  };
}