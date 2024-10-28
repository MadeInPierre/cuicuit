import { Timestamp, type FirestoreDataConverter, type DocumentData } from 'firebase/firestore';

export interface SpaceDoc {
	todo: string;
}

export interface DBSpaceDoc extends DocumentData {
	todo: string;
}

export const spaceDocConverter: FirestoreDataConverter<SpaceDoc, DBSpaceDoc> = {
	toFirestore(spaceDoc: SpaceDoc) {
		return {
			...spaceDoc
		} as DBSpaceDoc;
	},

	fromFirestore(snapshot, options) {
		const dbSpaceDoc = snapshot.data(options) as DBSpaceDoc;

		return {
			...dbSpaceDoc
		} as SpaceDoc;
	}
};
