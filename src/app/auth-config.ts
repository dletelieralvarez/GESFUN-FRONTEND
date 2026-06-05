import { Configuration } from '@azure/msal-browser';

export const tenantId = '0848441e-8d61-4f58-84b7-9f55266c7ee4';
export const clientId = '7c4068b3-4cdf-42f3-84ac-f8e2d2042118';
export const bffApiScope = 'https://duocactividadazure.onmicrosoft.com/daead1c3-a4cc-4647-9423-e1fc626d8003/access_as_user';
export const bffApiUrl = 'http://localhost:8081';

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
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
          case 0:
            console.error(message);
            break;
          case 1:
            console.warn(message);
            break;
          case 2:
            console.info(message);
            break;
          case 3:
            console.debug(message);
            break;
        }
      },
    },
  },
};

export const loginRequest = {
  scopes: [bffApiScope],
};
