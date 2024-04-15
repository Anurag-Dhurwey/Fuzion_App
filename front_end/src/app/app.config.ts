import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideState, provideStore } from '@ngrx/store';
import { appReducer } from './store/reducers/state.reducer';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { environment } from '../environments/environment.development';

// import {
//   ScreenTrackingService,
//   UserTrackingService,
//   getAnalytics,
//   provideAnalytics,
// } from '@angular/fire/analytics';
// import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
// import { getAuth, provideAuth } from '@angular/fire/auth';
// import { getFirestore, provideFirestore } from '@angular/fire/firestore';
// import { getFunctions, provideFunctions } from '@angular/fire/functions';
// import { getMessaging, provideMessaging } from '@angular/fire/messaging';
// import { getPerformance, providePerformance } from '@angular/fire/performance';
// import { getStorage, provideStorage } from '@angular/fire/storage';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideStore(),
    provideState('app', appReducer),
    provideHttpClient(withFetch()),
    // importProvidersFrom([
    //   provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    //   provideAnalytics(() => getAnalytics()),
    //   provideAuth(() => getAuth()),
    //   provideFirestore(() => getFirestore()),
    //   provideFunctions(() => getFunctions()),
    //   provideMessaging(() => getMessaging()),
    //   providePerformance(() => getPerformance()),
    //   provideStorage(() => getStorage()),
    // ]),
    // ScreenTrackingService,
    // UserTrackingService,
  ],
};
