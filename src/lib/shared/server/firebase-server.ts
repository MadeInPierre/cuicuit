import { FIREBASE_ADMIN_KEY } from '$env/static/private';
import admin from 'firebase-admin';

var firebaseAdmin: admin.app.App;
var firebaseAdminAuth: admin.auth.Auth;
var firebaseAdminFirestore: admin.firestore.Firestore;

/**
 * create firebase admin singleton
 */
export function getFirebaseAdmin(): admin.app.App {
	if (!firebaseAdmin) {
		if (admin.apps.length == 0) {
			firebaseAdmin = admin.initializeApp({
				credential: admin.credential.cert(JSON.parse(FIREBASE_ADMIN_KEY))
			});
		} else {
			firebaseAdmin = admin.apps[0]!;
		}
	}

	return firebaseAdmin;
}

/**
 * create firebase admin auth singleton
 */
export function getFirebaseAdminAuth(): admin.auth.Auth {
	const currentAdmin: admin.app.App = getFirebaseAdmin();
	if (!firebaseAdminAuth) {
		firebaseAdminAuth = currentAdmin.auth();
	}
	return firebaseAdminAuth;
}

/**
 * create firebase admin firestore singleton
 */
export function getFirebaseAdminFirestore(): admin.firestore.Firestore {
	const currentAdmin: admin.app.App = getFirebaseAdmin();
	if (!firebaseAdminFirestore) {
		firebaseAdminFirestore = currentAdmin.firestore();
	}
	return firebaseAdminFirestore;
}
