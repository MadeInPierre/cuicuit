import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
	apiKey: 'AIzaSyB_ZXR9krP1WbWFCx1MbjqC4_o6gPBeykw',
	authDomain: 'madeinpierre-cuicuit.firebaseapp.com',
	projectId: 'madeinpierre-cuicuit',
	storageBucket: 'madeinpierre-cuicuit.appspot.com',
	messagingSenderId: '332580474019',
	appId: '1:332580474019:web:644a3d192c3d84636ac316',
	measurementId: 'G-7LXJCR1QVP'
};

export const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : undefined;
