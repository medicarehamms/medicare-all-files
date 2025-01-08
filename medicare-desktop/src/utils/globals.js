import Swal from 'sweetalert2';

const globals = {
	backendURL: process.env.API_URL?.trim() || 'http://localhost:4000',
	/**
	 * @type {WebSocket}
	 */
	ws: null,

	/**
	 * @type {Swal}
	 */
	Swal: Swal,

	/**
	 * @type {RegExp}
	 */
	emailRegex: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, // matches email addresses

	/**
	 * @type {RegExp}
	 */
	passwordRegex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\.@$!%*?&])[A-Za-z\d\.@$!%*?&]{8,}$/, // minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character

	/**
	 * @type {() => Promise<Boolean>}
	 */
	checkAuthentication: async () => {
		/**
		 * @type {{
		* 		id: String,
		* 		sessionKey: String,
		* 		type: 'doctor' | 'staff'
		 * }}
		 */
		const credentials = window.localStorage.getItem('credentials') ? JSON.parse(window.localStorage.getItem('credentials')) : null;
		if (!credentials)
			return false;

		const options = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				id: credentials.id,
				sessionKey: credentials.sessionKey
			})
		};

		const response = credentials.type === 'staff' ?
			await fetch(`${globals.backendURL}/api/staffs/authenticate`, options) :
			await fetch(`${globals.backendURL}/api/doctors/authenticate`, options);

		if (response.status !== 200)
			return false;

		/**
		 * @type {{
		 * 		message: String,
		 * 		credentials: {
		 * 			id: String,
		 * 			sessionKey: String,
		 * 			type: 'doctor' | 'staff'
		 * 		}
		 * }}
		 */
		const data = await response.json();
		window.localStorage.setItem('credentials', JSON.stringify(data.credentials));

		return true;
	},

	/**
	 * @type {() => Promise<void>}
	 */
	deauthenticateUser: async () => {
		/**
		 * @type {{
		* 		id: String,
		* 		sessionKey: String,
		* 		type: 'doctor' | 'staff'
		 * }}
		 */
		const credentials = window.localStorage.getItem('credentials') ? JSON.parse(window.localStorage.getItem('credentials')) : null;
		if (!credentials)
			return;

		const options = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				id: credentials.id,
				sessionKey: credentials.sessionKey
			})
		};

		const response = credentials.type === 'staff' ?
			await fetch(`${globals.backendURL}/api/staffs/deauthenticate`, options) :
			await fetch(`${globals.backendURL}/api/doctors/deauthenticate`, options);

		if (response.status !== 200)
			return;

		window.localStorage.removeItem('credentials');
		window.location.hash = '#/signIn';
	}
};

globalThis.globals = globals;

export default globals;