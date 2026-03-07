/**
 * Firebase client SDK config. Safe to expose in client bundles;
 * security is enforced via Firebase Security Rules and Auth.
 */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface Environment {
  production: boolean;
  firebase: FirebaseConfig;
}
