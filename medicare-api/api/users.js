import router from 'express';
import jsonwebtoken from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import * as logUpdate from 'log-update';

import { wsConnections, transporter } from '../utils/globals.js';

const users = router();

/**
 * @type {(
 * 		admin: import('firebase-admin'),
 * 		database: import('firebase-admin/database').Database,
 * 		bucket: import('@google-cloud/storage').Bucket
 * ) => import('express').Router}
 */
export default (admin, database, bucket) => {
	/**
	 * @typedef {{
	* 		credentials: {
	 * 			password: String,
	* 			sessions: String[]
	 * 		},
	 * 
	 * 		email: String,
	 * 		id: String,
	 * 		name: String,
	 * 
	 * 		membership?: {
	 * 			rfid: String,
	 * 			since: String,
	* 			until: String
	 * 		}
	 * 
	 * 		profile: {
	 * 			avatar: String,
	 * 			phone: String,
	 * 			gender: String,
	 * 			birthday: String
	 * 		}
	 * }} User
	 */

	// Sign up a user
	users.put('/', async (req, res) => {
		/**
		 * @type {{
		 * 		email: String,
		 * 		name: String,
		 * 		password: String
		 * }}
		 */
		const body = req.body;

		// Check if the request body is valid
		if (!body.email || !body.name || !body.password) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};

		// Check if the user already exists in the 'staffs' database
		const snapshotStaff = await database.ref('staffs').orderByChild('email').equalTo(body.email).once('value');
		if (snapshotStaff.exists()) {
			res.status(400).send({ message: 'Account already exists' });
			return;
		};
		// Check if the user already exists in the 'doctors' database
		const snapshotDoctor = await database.ref('doctors').orderByChild('email').equalTo(body.email).once('value');
		if (snapshotDoctor.exists()) {
			res.status(400).send({ message: 'Account already exists' });
			return;
		};
		// Check if the user already exists in the 'users' database
		const snapshotUser = await database.ref('users').orderByChild('email').equalTo(body.email).once('value');
		if (snapshotUser.exists()) {
			res.status(400).send({ message: 'Account already exists' });
			return;
		};

		// Create a new user in the database
		const userRef = database.ref('users').push();
		const salt = bcrypt.genSaltSync(8);
		/** @type {User} */
		const user = {
			id: userRef.key,
			email: body.email,
			name: body.name,

			credentials: {
				password: bcrypt.hashSync(body.password, salt),
				sessions: []
			},

			profile: {
				avatar: 'https://firebasestorage.googleapis.com/v0/b/medicare-a38ad.appspot.com/o/assets%2Fdefault%20avatar.jpg?alt=media',
				phone: '',
				gender: '',
				birthday: ''
			}
		};
		await userRef.set(user);

		// Send the response
		res.send({ message: 'User created successfully' });

		// Send the new user to all connected clients
		for (const ws of wsConnections) {
			const Authorization = req.headers.authorization || req.headers.Authorization || '';
			const [id, sessionKey] = (Authorization).split(' ');

			if (ws.page === 'users') {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: 'users'
				}));
			};
		};

		// Send an email to the user
		const mailOptions = {
			from: 'Medicare Authentication',
			to: body.email,
			subject: 'Medicare Account',
			text: 'Your account has been created successfully'
		};

		// Send the email
		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				logUpdate(`Error: ${error}`);
			} else {
				logUpdate(`Email sent: ${info.response}`);
			};
		});

		// Create History entry
		const historyRef = database.ref('history').push();
		await historyRef.set({
			route: 'users',
			subroute: 'sign',
			action: 'sign-up',
			date: new Date().toISOString(),
			actor: {
				...user,
				type: 'user',
				credentials: null
			},
			summary: `User: "${user.name}" Signed Up successfully`
		});
	});

	// Sign in a user
	users.post('/', async (req, res) => {
		/**
		 * @type {{
		 * 		email: String,
		 * 		password: String
		 * }}
		 */
		const body = req.body;

		// Check if the request body is valid
		if (!body.email || !body.password) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};

		// Find the user in the database
		const snapshot = await database.ref('users').orderByChild('email').equalTo(body.email).once('value');
		if (!snapshot.exists()) {
			res.status(404).send({ message: 'User not found' });
			return;
		};

		// Check the password
		/** @type {User} */
		const user = Object.values(snapshot.val())[0];
		if (!bcrypt.compareSync(body.password, user.credentials.password)) {
			res.status(401).send({ message: 'Incorrect password' });
			return;
		};

		// Create a new sessionKey
		const sessions = user.credentials.sessions || [];
		const sessionKey = jsonwebtoken.sign({ id: user.id }, 'secret', { expiresIn: '30d' });

		// Save the sessionKey in the database
		await database.ref(`users/${user.id}/credentials/sessions`).set([
			...sessions,
			sessionKey
		]);

		// Send the response
		res.send({
			message: 'User Signed in successfully',
			credentials: {
				type: 'user',
				id: user.id,
				sessionKey: sessionKey
			}
		});

		// Send an email to the user
		const mailOptions = {
			from: 'Medicare Authentication',
			to: user.email,
			subject: 'Sign In',
			text: 'You have successfully Signed in to Medicare.'
		};

		// Send the email
		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				console.log(error);
			} else {
				console.log(`Email sent: ${info.response}`);
			};
		});

		// Create History entry
		const historyRef = database.ref('history').push();
		await historyRef.set({
			route: 'users',
			subroute: 'sign',
			action: 'sign-in',
			date: new Date().toISOString(),
			actor: {
				...user,
				type: 'user',
				credentials: null
			},
			summary: `User: "${user.name}" Signed In successfully`
		});
	});

	// Authenticate a user
	users.post('/authenticate', async (req, res) => {
		/**
		 * @type {{
		 * 		id: String,
		* 		sessionKey: String
		 * }}
		 */
		const body = req.body;

		// Check if the request body is valid
		if (!body.id || !body.sessionKey) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};

		// Check if the user exists
		const snapshot = await database.ref(`users/${body.id}`).once('value');
		if (!snapshot.exists()) {
			res.status(404).send({ message: 'User not found' });
			return;
		};

		// Check if the sessionKey is valid
		const user = snapshot.val();
		if (!(user.credentials.sessions || []).includes(body.sessionKey)) {
			res.status(400).send({ message: 'Invalid sessionKey' });
			return;
		};

		// Check if the sessionKey is expired
		jsonwebtoken.verify(body.sessionKey, 'secret', (error, decoded) => {
			if (error) {
				res.status(400).send({ message: 'Token expired' });
				return;
			};

			// Send the response
			res.send({
				message: 'User authenticated successfully',
				credentials: {
					sessionKey: body.sessionKey,
					id: decoded.id,
					type: 'user'
				}
			});
		});

		// Create History entry
		const historyRef = database.ref('history').push();
		await historyRef.set({
			route: 'users',
			subroute: 'sign',
			action: 'authenticate',
			date: new Date().toISOString(),
			actor: {
				...user,
				type: 'user',
				credentials: null
			},
			summary: `User: "${user.name}" checked for authentication`
		});
	});

	// Sign out or Deauthenticate a user
	users.post('/deauthenticate', async (req, res) => {
		/**
		 * @type {{
		 * 		id: String,
		* 		sessionKey: String
		 * }}
		 */
		const body = req.body;

		// Check if the request body is valid
		if (!body.id || !body.sessionKey) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};

		// Check if the user exists
		const snapshot = await database.ref(`users/${body.id}`).once('value');
		if (!snapshot.exists()) {
			res.status(400).send({ message: 'User does not exist' });
			return;
		};

		// Check if the sessionKey is correct
		const user = snapshot.val();
		if (!user.credentials.sessions || !user.credentials.sessions.includes(body.sessionKey)) {
			res.status(400).send({ message: 'Invalid sessionKey' });
			return;
		};

		// Remove the sessionKey from the user
		const sessions = user.credentials.sessions.filter((sessionKey) => sessionKey !== body.sessionKey);
		await database.ref(`users/${user.id}/credentials/sessions`).set(sessions);

		// Send the response
		res.send({ message: 'User Signed out successfully' });

		// Create History entry
		const historyRef = database.ref('history').push();
		await historyRef.set({
			route: 'users',
			subroute: 'sign',
			action: 'sign-out',
			date: new Date().toISOString(),
			actor: {
				...user,
				type: 'user',
				credentials: null
			},
			summary: `User: "${user.name}" Signed Out successfully`
		});
	});

	// Get a user
	users.get('/:id', async (req, res) => {
		const id = req.params.id;

		// Check if the user exists
		const snapshot = await database.ref(`users/${id}`).once('value');
		if (!snapshot.exists()) {
			res.status(404).send({ message: 'User not found' });
			return;
		};

		// Delete credentials from the user
		const user = snapshot.val();
		delete user.credentials;

		// Send the response
		res.send(user || {});
	});
	// Get all users
	users.get('/', async (req, res) => {
		// Get all users
		const snapshot = await database.ref('users').once('value');
		const users = snapshot.val() || {};

		// Delete credentials from all users
		for (const user of Object.values(users || {})) {
			delete user.credentials;
		};

		// Send the response
		res.send(users || {});
	});
	// Bulk get users
	users.post('/bulk', async (req, res) => {
		const body = req.body;
		if (!body.ids) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};
		const snapshot = await database.ref('users').once('value');
		const users = snapshot.val() || {};
		const result = {};
		for (const id of body.ids) {
			if (users[id]) {
				const user = users[id];
				delete user.credentials;
				result[id] = user;
			};
		};
	
		res.json(result);
	});

	// Update a user
	users.patch('/:id', async (req, res) => {
		/**
		 * @type {{
		 *		profile?: {
		 *			avatar?: String,
		 *			gender?: String,
		 *			birthday?: String,
		 *			phone?: String,
		 *		},
		 *		name: String,
		 *		id: String,
		 *		email: String,
		 *		membership?: {
		 *			rfid: String,
		 * 			since: String,
		*			until: String
		 *		},
		 * 		doNotChangeProfile?: Boolean
		 * }}
		 */
		const body = req.body;

		// Check required fields
		if ((body.name === undefined || body.name === null) && (body.email === undefined || body.email === null)) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};

		// Check if the request body is valid
		if (!body.name && !body.gender && !body.birthday && !body.email) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};

		// Check if the user exists
		const snapshot = await database.ref(`users/${req.params.id}`).once('value');
		if (!snapshot.exists()) {
			res.status(400).send({ message: 'User does not exist' });
			return;
		};

		if (body.profile && body.profile.avatar && !body.doNotChangeProfile) {
			const image = Buffer.from(body.profile.avatar.replace(/^data:image\/\w+;base64,/, ''), 'base64');
			const type = body.profile.avatar.substring('data:image/'.length, body.profile.avatar.indexOf(';base64'));
			if (!['png', 'jpeg', 'jpg'].includes(type)) {
				res.status(400).send({ message: 'Invalid image type' });
				return;
			};
			const fileName = `${req.params.id}-${Math.random().toString(36).substring(2)}.${type}`;

			const file = bucket.file(`files/${fileName}.${type}`);
			await file.save(image, {
				public: true,
				metadata: {
					contentType: `image/${type}`
				}
			});
			body.profile.avatar = file.publicUrl();
		};
		delete body.doNotChangeProfile;

		// Check if the email is already taken by another user
		if (body.email) {
			let emailTaken = false;
			const snapshotUsers = await database.ref('users').orderByChild('email').equalTo(body.email).once('value');
			if (snapshotUsers.exists()) {
				if (Object.keys(snapshotUsers.val())[0] !== req.params.id) {
					emailTaken = true;
				};
			};
			const snapshotStaffs = await database.ref('staffs').orderByChild('email').equalTo(body.email).once('value');
			if (snapshotStaffs.exists()) {
				if (Object.keys(snapshotStaffs.val())[0] !== req.params.id) {
					emailTaken = true;
				};
			};
			const snapshotDoctors = await database.ref('doctors').orderByChild('email').equalTo(body.email).once('value');
			if (snapshotDoctors.exists()) {
				if (Object.keys(snapshotDoctors.val())[0] !== req.params.id) {
					emailTaken = true;
				};
			};
			if (emailTaken) {
				res.status(400).send({ message: 'Email already taken' });
				return;
			};
		};

		// Check if the membership is already taken by another user
		if (body.membership) {
			if (!body.membership.rfid || !body.membership.until) {
				delete body.membership;
			} else {
				// Check all users that has a membership object
				const snapshot = await database.ref('users').orderByChild('membership').once('value');
				const users = snapshot.val() || {};
				for (const user of Object.values(users || {})) {
					if (user.membership && user.membership.rfid === body.membership.rfid) {
						if (user.id !== req.params.id) {
							res.status(400).send({ message: 'Membership already taken' });
							return;
						};
					};
				};
			};
		};

		// Compare membership of old and new
		{
			const snapshot = await database.ref(`users/${req.params.id}`).once('value');
			const user = snapshot.val();
			if (!user.membership && body.membership) {
				body.membership.since = new Date().toISOString();
				// Membership added
				// Email user
				const mailOptions = {
					from: 'Medicare Membership',
					to: user.email,
					subject: 'Membership Subscription',
					text: `Thank you for subscribing to Medicare Membership. Your subscription will expire on ${body.membership.until}`
				};

				// Send the email
				transporter.sendMail(mailOptions, (error, info) => {
					if (error) {
						console.log(error);
					} else {
						console.log(`Email sent: ${info.response}`);
					};
				});
			} else if (user.membership && !body.membership) {
				// Membership removed
				// Email user
				const mailOptions = {
					from: 'Medicare Membership',
					to: user.email,
					subject: 'Membership Subscription',
					text: `Your Medicare Membership has been cancelled.`
				};

				// Send the email
				transporter.sendMail(mailOptions, (error, info) => {
					if (error) {
						console.log(error);
					} else {
						console.log(`Email sent: ${info.response}`);
					};
				});
			} else if (user.membership && body.membership) {
				// Check if the membership has been updated
				if (user.membership.rfid !== body.membership.rfid || user.membership.until !== body.membership.until) {
					// Membership updated
					// Email user
					const mailOptions = {
						from: 'Medicare Membership',
						to: user.email,
						subject: 'Membership Subscription',
						text: `Your Medicare Membership has been updated. Your subscription will expire on ${body.membership.until}`
					};

					// Send the email
					transporter.sendMail(mailOptions, (error, info) => {
						if (error) {
							console.log(error);
						} else {
							console.log(`Email sent: ${info.response}`);
						};
					});
				};
			};
		};

		if (!body.membership) {
			body.membership = {
				rfid: null,
				since: null,
				until: null
			};
		};

		// Update the user
		await database.ref(`users/${req.params.id}`).update(body);

		// Send the response
		res.send({ message: 'User updated successfully' });

		// Send the updated user to all connected clients
		for (const ws of wsConnections) {
			const Authorization = req.headers.authorization || req.headers.Authorization || '';
			const [id, sessionKey] = (Authorization).split(' ');

			if (ws.page === 'users') {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: 'users'
				}));
			};
			if (ws.page === `users/${req.params.id}`) {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: `users/${req.params.id}`
				}));
			};
		};

		// Create History entry
		const historyRef = database.ref('history').push();
		await historyRef.set({
			route: 'users',
			subroute: 'account',
			action: 'update',
			date: new Date().toISOString(),
			actor: req.user || {},
			summary: `Updated user with id: ${req.params.id}`
		});
	});

	// Delete a user
	users.delete('/:id', async (req, res) => {
		const id = req.params.id;

		// Check if the user exists
		const snapshot = await database.ref(`users/${id}`).once('value');
		if (!snapshot.exists()) {
			res.status(404).send({ message: 'User not found' });
			return;
		};
		const user = snapshot.val();

		// Delete all appointments associated with the user
		const snapshotAppointments = await database.ref('appointments').once('value');
		const appointments = snapshotAppointments.val() || {};
		for (const appointment of Object.values(appointments)) {
			if (appointment.user.id === id) {
				await database.ref(`appointments/${appointment.id}`).remove();
			};
		};

		// Delete the user
		await database.ref(`users/${id}`).remove();

		// Send the response
		res.send({ message: 'User deleted successfully' });

		// Send the updated user to all connected clients
		for (const ws of wsConnections) {
			const Authorization = req.headers.authorization || req.headers.Authorization || '';
			const [id, sessionKey] = (Authorization).split(' ');

			if (ws.page === 'users') {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: 'users'
				}));
			};
			if (ws.page === `users/${id}`) {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: `users/${id}`
				}));
			};
		};

		// Send an email to the user
		const mailOptions = {
			from: 'Medicare Authentication',
			to: user.email,
			subject: 'Account Deleted',
			text: 'Your account has been deleted successfully'
		};

		// Send the email
		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				console.log(error);
			} else {
				console.log(`Email sent: ${info.response}`);
			};
		});

		// Create History entry
		const historyRef = database.ref('history').push();
		await historyRef.set({
			route: 'users',
			subroute: 'index',
			action: 'delete',
			date: new Date().toISOString(),
			actor: req.user || {},
			summary: `Deleted user with id: ${id}`
		});
	});

	users.search('/rfid', async (req, res) => {
		const { rfid } = req.body;
		if (!rfid) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};

		const snapshot = await database.ref('users').once('value');
		const users = snapshot.val() || {};
		for (const user of Object.values(users || {})) {
			if (user.membership && user.membership.rfid === rfid) {
				res.send(user || {});
				return;
			};
		};

		res.status(404).send({ message: 'User not found' });
	});

	// Chore:
	// Delete expired sessions
	setInterval(async () => {
			const snapshot = await database.ref('users').once('value');
			const users = snapshot.val();
			if (!users) {
				return;
			};
	
		for (const user of Object.values(users || {})) {
				try {
					const sessions = user.credentials.sessions || [];
					const newTokens = sessions.filter((sessionKey) => {
						try {
							jsonwebtoken.verify(sessionKey, 'secret');
							return true;
						} catch (error) {
							const log = logUpdate.createLogUpdate(process.stdout, {
								showCursor: true
							});
							log(`Deleted expired sessionKey: ${sessionKey}`);
							setTimeout(() => {
								log(`Deleted expired sessionKey: ##########`);
								log.done();
							}, 1000);
							return false;
						};
					});
					database.ref(`users/${user.id}/credentials/sessions`).set(newTokens);
				} catch (error) {
					console.log(error);
				};
			};
	}, 1000 * 60 * 60); // 1 hour

	// Chore:
	// Check for expired memberships
	setInterval(async () => {
		const snapshot = await database.ref('users').once('value');
		const users = snapshot.val();
		if (!users) {
			return;
		};

		for (const user of Object.values(users || {})) {
			if (user.membership && user.membership.until) {
				if (new Date(user.membership.until) < new Date()) {
					await database.ref(`users/${user.id}/membership`).set({
						rfid: null,
						since: null,
						until: null
					});

					// Email user
					const mailOptions = {
						from: 'Medicare Membership',
						to: user.email,
						subject: 'Membership Expiry',
						text: 'Your Medicare Membership has expired'
					};

					// Send the email
					transporter.sendMail(mailOptions, (error, info) => {
						if (error) {
							console.log(error);
						} else {
							console.log(`Email sent: ${info.response}`);
						};
					});
				};
			};
		};
	}, 1000 * 60 * 60); // 1 hour

	// Chore:
	// Notify users of their expiring membership 1 week before
	setInterval(async () => {
		const snapshot = await database.ref('users').once('value');
		const users = snapshot.val();
		if (!users) {
			return;
		};

		for (const user of Object.values(users || {})) {
			if (user.membership && user.membership.until) {
				const until = new Date(user.membership.until);
				const now = new Date();
				const diff = until - now;
				if (diff < 1000 * 60 * 60 * 24 * 7) {
					const mailOptions = {
						from: 'Medicare Membership',
						to: user.email,
						subject: 'Membership Expiry',
						text: `Your Medicare Membership will expire in ${Math.floor(diff / (1000 * 60 * 60 * 24))} days`
					};

					// Send the email
					transporter.sendMail(mailOptions, (error, info) => {
						if (error) {
							console.log(error);
						} else {
							console.log(`Email sent: ${info.response}`);
						};
					});
				};
			};
		};
	}, 1000 * 60 * 60, 24); // 1 day

	return users;
};
