import router from 'express';
import jsonwebtoken from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import * as logUpdate from 'log-update';

import { wsConnections, transporter } from '../utils/globals.js';

const doctors = router();

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
	 * 		name: String,
	 * 		profile: {
	 * 			avatar: String,
	 * 			phone: String,
	 * 			about: String
	 * 		}
	 * }} Doctor
	 */

	// Sign up a doctor
	doctors.put('/', async (req, res) => {
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

		// Check if the doctor already exists in the 'staffs' database
		const snapshotStaff = await database.ref('staffs').orderByChild('email').equalTo(body.email).once('value');
		if (snapshotStaff.exists()) {
			res.status(400).send({ message: 'Account already exists' });
			return;
		};
		// Check if the doctor already exists in the 'doctors' database
		const snapshotDoctor = await database.ref('doctors').orderByChild('email').equalTo(body.email).once('value');
		if (snapshotDoctor.exists()) {
			res.status(400).send({ message: 'Account already exists' });
			return;
		};
		// Check if the doctor already exists in the 'users' database
		const snapshotUser = await database.ref('users').orderByChild('email').equalTo(body.email).once('value');
		if (snapshotUser.exists()) {
			res.status(400).send({ message: 'Account already exists' });
			return;
		};

		// Create a new doctor in the database
		const doctorRef = database.ref('doctors').push();
		const salt = bcrypt.genSaltSync(8);
		/** @type {Doctor} */
		const doctor = {
			id: doctorRef.key,
			email: body.email,
			name: body.name,

			credentials: {
				password: bcrypt.hashSync(body.password, salt),
				sessions: []
			},

			profile: {
				avatar: 'https://firebasestorage.googleapis.com/v0/b/medicare-a38ad.appspot.com/o/assets%2Fdefault%20avatar.jpg?alt=media',
				phone: '',
				about: ''
			}
		};
		await doctorRef.set(doctor);

		// Send the response
		res.send({ message: 'Doctor created successfully' });

		// Send an email to the user
		const mailOptions = {
			from: 'Medicare Authentication',
			to: body.email,
			subject: 'Sign Up',
			text: `Welcome to Medicare! You have successfully signed up as a doctor.`
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
			route: 'doctors',
			subroute: 'sign',
			action: 'sign-up',
			date: new Date().toISOString(),
			actor: {
				...doctor,
				type: 'doctor',
				credentials: null
			},
			summary: `Doctor: "${doctor.name}" Signed Up successfully`
		});
	});

	// Sign in a doctor
	doctors.post('/', async (req, res) => {
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

		// Find the doctor in the database
		const snapshot = await database.ref('doctors').orderByChild('email').equalTo(body.email).once('value');
		if (!snapshot.exists()) {
			res.status(404).send({ message: 'Doctor not found' });
			return;
		};

		// Check the password
		/** @type {Doctor} */
		const doctor = Object.values(snapshot.val())[0];
		if (!bcrypt.compareSync(body.password, doctor.credentials.password)) {
			res.status(401).send({ message: 'Incorrect password' });
			return;
		};

		// Create a new sessionKey
		const sessions = doctor.credentials.sessions || [];
		const sessionKey = jsonwebtoken.sign({ id: doctor.id }, 'secret', { expiresIn: '30d' });

		// Save the sessionKey in the database
		await database.ref(`doctors/${doctor.id}/credentials/sessions`).set([
			...sessions,
			sessionKey
		]);

		// Send the response
		res.send({
			message: 'Doctor signed in successfully',
			credentials: {
				type: 'doctor',
				id: doctor.id,
				sessionKey: sessionKey
			}
		});

		// Send an email to the doctor
		const mailOptions = {
			from: 'Medicare Authentication',
			to: doctor.email,
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
			route: 'doctors',
			subroute: 'sign',
			action: 'sign-in',
			date: new Date().toISOString(),
			actor: {
				...doctor,
				type: 'doctor',
				credentials: null
			},
			summary: `Doctor: "${doctor.name}" Signed In successfully`
		});
	});

	// Authenticate a doctor
	doctors.post('/authenticate', async (req, res) => {
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

		// Check if the doctor exists
		const snapshot = await database.ref(`doctors/${body.id}`).once('value');
		if (!snapshot.exists()) {
			res.status(404).send({ message: 'Doctor not found' });
			return;
		};

		// Check if the sessionKey is valid
		const doctor = snapshot.val();
		if (!(doctor.credentials.sessions || []).includes(body.sessionKey)) {
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
				message: 'Doctor authenticated successfully',
				credentials: {
					sessionKey: body.sessionKey,
					id: decoded.id,
					type: 'doctor'
				}
			});

			// Create History entry
			const historyRef = database.ref('history').push();
			historyRef.set({
				route: 'doctors',
				subroute: 'sign',
				action: 'authenticate',
				date: new Date().toISOString(),
				actor: {
					...doctor,
					type: 'doctor',
					credentials: null
				},
				summary: `Doctor: "${doctor.name}" checked for authentication`
			});
		});
	});

	// Sign out or Deauthenticate a doctor
	doctors.post('/deauthenticate', async (req, res) => {
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

		// Check if the doctor exists
		const snapshot = await database.ref(`doctors/${body.id}`).once('value');
		if (!snapshot.exists()) {
			res.status(400).send({ message: 'Doctor does not exist' });
			return;
		};

		// Check if the sessionKey is correct
		const doctor = snapshot.val();
		if (!doctor.credentials.sessions || !doctor.credentials.sessions.includes(body.sessionKey)) {
			res.status(400).send({ message: 'Invalid sessionKey' });
			return;
		};

		// Remove the sessionKey from the doctor
		const sessions = doctor.credentials.sessions.filter((sessionKey) => sessionKey !== body.sessionKey);
		await database.ref(`doctors/${doctor.id}/credentials/sessions`).set(sessions);

		// Send the response
		res.send({ message: 'Doctor Signed out successfully' });

		// Create History entry
		const historyRef = database.ref('history').push();
		await historyRef.set({
			route: 'doctors',
			subroute: 'sign',
			action: 'sign-out',
			date: new Date().toISOString(),
			actor: {
				...doctor,
				type: 'doctor',
				credentials: null
			},
			summary: `Doctor: "${doctor.name}" Signed Out successfully`
		});
	});

	// Get a doctor
	doctors.get('/:id', async (req, res) => {
		const id = req.params.id;

		// Check if the doctor exists
		const snapshot = await database.ref(`doctors/${id}`).once('value');
		if (!snapshot.exists()) {
			res.status(404).send({ message: 'User not found' });
			return;
		};

		// Delete credentials from the doctor
		const doctor = snapshot.val();
		delete doctor.credentials;

		// Send the response
		res.send(doctor || {});
	});
	// Get all doctors
	doctors.get('/', async (req, res) => {
		// Get all doctors
		const snapshot = await database.ref('doctors').once('value');
		const doctors = snapshot.val();

		// Delete credentials from all doctors
		for (const doctor of Object.values(doctors || {})) {
			delete doctor.credentials;
		};

		// Send the response
		res.send(doctors || {});
	});
	// Bulk get doctors
	doctors.post('/bulk', async (req, res) => {
		const body = req.body;
		if (!body.ids) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};
		const snapshot = await database.ref('doctors').once('value');
		const doctors = snapshot.val();
		const result = {};
		for (const id of body.ids) {
			if (doctors[id]) {
				const doctor = doctors[id];
				delete doctor.credentials;
				result[id] = doctor;
			};
		};
	
		res.json(result);
	});

	// Update a doctor
	doctors.patch('/:id', async (req, res) => {
		/**
		 * @type {{
		 *		profile?: {
		 *			avatar?: String,
		 *			gender?: String,
		 *			birthday?: String,
		 *			phone?: String,
		 *			about?: String
		 *		},
		 *		name: String,
		 *		id: String,
		 *		email: String,
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

		// Check if the doctor exists
		const snapshot = await database.ref(`doctors/${req.params.id}`).once('value');
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

		// Update the doctor
		await database.ref(`doctors/${req.params.id}`).update(body);

		// Send the response
		res.send({ message: 'User updated successfully' });

		// Send the updated user to all connected clients
		for (const ws of wsConnections) {
			const Authorization = req.headers.authorization || req.headers.Authorization || '';
			const [id, sessionKey] = (Authorization).split(' ');

			if (ws.page === 'doctors') {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: 'doctors'
				}));
			};
			if (ws.page === `doctors/${req.params.id}`) {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: `doctors/${req.params.id}`
				}));
			};
		};

		// Create History entry
		const historyRef = database.ref('history').push();
		await historyRef.set({
			route: 'doctors',
			subroute: 'account',
			action: 'update',
			date: new Date().toISOString(),
			actor: req.user || {},
			summary: `Updated doctor with id: ${req.params.id}`
		});
	});

	// Chore:
	// Delete expired sessions
	setInterval(async () => {
		const snapshot = await database.ref('doctors').once('value');
		const doctors = snapshot.val();
		if (!doctors) {
			return;
		};

		for (const doctor of Object.values(doctors || {})) {
			try {
				const sessions = doctor.credentials.sessions || [];
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
				database.ref(`doctors/${doctor.id}/credentials/sessions`).set(newTokens);
			} catch (error) {
				console.log(error);
			};
		};
	}, 1000 * 60 * 60); // 1 hour

	return doctors;
};