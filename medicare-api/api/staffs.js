import router from 'express';
import jsonwebtoken from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import * as logUpdate from 'log-update';

import { transporter } from '../utils/globals.js';

const staffs = router();

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
	 * 		email: String,
	 * 		id: String,
	 * 		name: String
	 * }} Staff
	 */

	// Sign up a staff
	staffs.put('/', async (req, res) => {
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

		// Check if the staff already exists in the 'staffs' database
		const snapshotStaff = await database.ref('staffs').orderByChild('email').equalTo(body.email).once('value');
		if (snapshotStaff.exists()) {
			res.status(400).send({ message: 'Account already exists' });
			return;
		};
		// Check if the staff already exists in the 'doctors' database
		const snapshotDoctor = await database.ref('doctors').orderByChild('email').equalTo(body.email).once('value');
		if (snapshotDoctor.exists()) {
			res.status(400).send({ message: 'Account already exists' });
			return;
		};
		// Check if the staff already exists in the 'users' database
		const snapshotUser = await database.ref('users').orderByChild('email').equalTo(body.email).once('value');
		if (snapshotUser.exists()) {
			res.status(400).send({ message: 'Account already exists' });
			return;
		};

		// Create a new staff in the database
		const staffRef = database.ref('staffs').push();
		const salt = bcrypt.genSaltSync(8);
		/** @type {Staff} */
		const staff = {
			id: staffRef.key,
			email: body.email,
			name: body.name,

			credentials: {
				password: bcrypt.hashSync(body.password, salt),
				sessions: []
			}
		};
		await staffRef.set(staff);

		// Send the response
		res.send({ message: 'Staff created successfully' });

		// Send an email to the user
		const mailOptions = {
			from: 'Medicare Authentication',
			to: body.email,
			subject: 'Sign Up',
			text: `Welcome to Medicare! You have successfully signed up as a staff.`
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
			route: 'staffs',
			subroute: 'sign',
			action: 'sign-up',
			date: new Date().toISOString(),
			actor: {
				...staff,
				type: 'staff',
				credentials: null
			},
			summary: `Staff: "${staff.name}" Signed Up successfully`
		});
	});

	// Sign in a staff
	staffs.post('/', async (req, res) => {
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

		// Find the staff in the database
		const snapshot = await database.ref('staffs').orderByChild('email').equalTo(body.email).once('value');
		if (!snapshot.exists()) {
			res.status(404).send({ message: 'Staff not found' });
			return;
		};

		// Check the password
		/** @type {Staff} */
		const staff = Object.values(snapshot.val())[0];
		if (!bcrypt.compareSync(body.password, staff.credentials.password)) {
			res.status(401).send({ message: 'Incorrect password' });
			return;
		};

		// Create a new sessionKey
		const sessions = staff.credentials.sessions || [];
		const sessionKey = jsonwebtoken.sign({ id: staff.id }, 'secret', { expiresIn: '30d' });

		// Save the sessionKey in the database
		await database.ref(`staffs/${staff.id}/credentials/sessions`).set([
			...sessions,
			sessionKey
		]);

		// Send the response
		res.send({
			message: 'Staff signed in successfully',
			credentials: {
				type: 'staff',
				id: staff.id,
				sessionKey: sessionKey
			}
		});

		// Send an email to the staff
		const mailOptions = {
			from: 'Medicare Authentication',
			to: staff.email,
			subject: 'Sign In',
			text: 'You have successfully signed in to Medicare.'
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
			route: 'staffs',
			subroute: 'sign',
			action: 'sign-in',
			date: new Date().toISOString(),
			actor: {
				...staff,
				type: 'staff',
				credentials: null
			},
			summary: `Staff: "${staff.name}" Signed In successfully`
		});
	});

	// Authenticate a staff
	staffs.post('/authenticate', async (req, res) => {
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

		// Check if the staff exists
		const snapshot = await database.ref(`staffs/${body.id}`).once('value');
		if (!snapshot.exists()) {
			res.status(404).send({ message: 'Staff not found' });
			return;
		};

		// Check if the sessionKey is valid
		const staff = snapshot.val();
		if (!(staff.credentials.sessions || []).includes(body.sessionKey)) {
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
				message: 'Staff authenticated successfully',
				credentials: {
					sessionKey: body.sessionKey,
					id: decoded.id,
					type: 'staff'
				}
			});

			// Create History entry
			const historyRef = database.ref('history').push();
			historyRef.set({
				route: 'staffs',
				subroute: 'sign',
				action: 'authenticate',
				date: new Date().toISOString(),
				actor: req.user || {},
				summary: `Staff: "${staff.name}" checked for authentication`
			});
		});
	});

	// Sign out or Deauthenticate a staff
	staffs.post('/deauthenticate', async (req, res) => {
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

		// Check if the staff exists
		const snapshot = await database.ref(`staffs/${body.id}`).once('value');
		if (!snapshot.exists()) {
			res.status(400).send({ message: 'Staff does not exist' });
			return;
		};

		// Check if the sessionKey is correct
		const staff = snapshot.val();
		if (!staff.credentials.sessions || !staff.credentials.sessions.includes(body.sessionKey)) {
			res.status(400).send({ message: 'Invalid sessionKey' });
			return;
		};

		// Remove the sessionKey from the staff
		const sessions = staff.credentials.sessions.filter((sessionKey) => sessionKey !== body.sessionKey);
		await database.ref(`staffs/${staff.id}/credentials/sessions`).set(sessions);

		// Send the response
		res.send({ message: 'Staff Signed out successfully' });

		// Create History entry
		const historyRef = database.ref('history').push();
		await historyRef.set({
			route: 'staffs',
			subroute: 'sign',
			action: 'sign-out',
			date: new Date().toISOString(),
			actor: req.user || {},
			summary: `Staff: "${staff.name}" Signed Out successfully`
		});
	});

	// Chore:
	// Delete expired sessions
	setInterval(async () => {
		const snapshot = await database.ref('staffs').once('value');
		const staffs = snapshot.val();
		if (!staffs) {
			return;
		};

		for (const staff of Object.values(staffs || {})) {
			try {
				const sessions = staff.credentials.sessions || [];
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
				database.ref(`staffs/${staff.id}/credentials/sessions`).set(newTokens);
			} catch (error) {
				console.error(error);
			};
		};
	}, 1000 * 60 * 60); // 1 hour

	return staffs;
};