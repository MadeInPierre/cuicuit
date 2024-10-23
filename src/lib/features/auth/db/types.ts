export type UserDoc = {
	created_t: number;
	firstName: string;
	lastName: string;
	userName: string;
	avatar: {
		type: string;
		icon: string;
		last_change_t: number;
	};
	checklist: {
		welcome: boolean;
		discoveredDrawer: boolean; // Whether the user has discovered the full drawer height
	};
	listIds: {
		[id: string]: boolean;
	};
};
