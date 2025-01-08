import AsyncStorage from '@react-native-async-storage/async-storage';

const apiURL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.9:4000';

const globals = {
	apiURL: apiURL.trim(),

	/**
	 * @type {WebSocket | null}
	 */
	ws: null,

	/**
	 * @returns {Promise<'user' | 'doctor' | null>}
	 */
	checkAuthorization: async () => {
		const credentials = await AsyncStorage.getItem('credentials');
		if (!credentials) {
			return false;
		};

		const user = JSON.parse(credentials);
		if (!user) {
			return false;
		};

		const options = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(user)
		};
		const response = user.type === 'user' ?
			await fetch(`${globals.apiURL}/api/users/authenticate`, options) :
			await fetch(`${globals.apiURL}/api/doctors/authenticate`, options);

		if (response.status === 200) {
			const data = await response.json();
			console.log(`Authenticated as ${data.credentials.type} with ID ${data.credentials.id}`);
			return data.credentials.type;
		} else {
			console.log('Failed to authenticate user');
			return false;
		};
	}
};

export default globals;