import { Configuration, LogLevel } from '@azure/msal-browser';

export const tenantId = '0848441e-8d61-4f58-84b7-9f55266c7ee4';
export const clientId = '7c4068b3-4cdf-42f3-84ac-f8e2d2042118';
export const bffApiScope = 'https://duocactividadazure.onmicrosoft.com/daead1c3-a4cc-4647-9423-e1fc626d8003/access_as_user';
//export const bffApiUrl = 'http://localhost:8081';
export const bffApiUrl = '/api';
export const redirectUri = 'http://localhost:4200';
export const authority = `https://login.microsoftonline.com/${tenantId}`;

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority,
    redirectUri,
    postLogoutRedirectUri: redirectUri,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            break;
          case LogLevel.Warning:
            console.warn(message);
            break;
          case LogLevel.Info:
            console.info(message);
            break;
          case LogLevel.Verbose:
            console.debug(message);
            break;
        }
      },
    },
  },
};

export const loginRequest = {
  scopes: [bffApiScope],
  redirectUri,
  prompt: 'select_account',
};
