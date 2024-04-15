export const environment = {
  firebaseConfig: {
    apiKey: import.meta.env['NG_APP_apiKey'],
    authDomain: import.meta.env['NG_APP_authDomain'],
    projectId: import.meta.env['NG_APP_projectId'],
    storageBucket: import.meta.env['NG_APP_storageBucket'],
    messagingSenderId: import.meta.env['NG_APP_messagingSenderId'],
    appId: import.meta.env['NG_APP_appId'],
    measurementId: import.meta.env['NG_APP_measurementId'],
  },
};
