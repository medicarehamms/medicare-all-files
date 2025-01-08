import router from 'express';
import jsonwebtoken from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import * as logUpdate from 'log-update';

const patients = router();

import { wsConnections, transporter } from '../utils/globals.js';

/**
 * @type {(
* 		admin: import('firebase-admin'),
* 		database: import('firebase-admin/database').Database,
* 		bucket: import('@google-cloud/storage').Bucket
* ) => import('express').Router}
*/
export default (admin, database, bucket) => {
	patients.get('/', async (req, res) => {
		const ref = database.ref('patients');
		ref.once('value', async (snapshot) => {
			res.json(snapshot.val());
		});
	});
	patients.get('/:id', async (req, res) => {
		const ref = database.ref(`patients/${req.params.id}`);
		ref.once('value', async (snapshot) => {
			res.json(snapshot.val());
		});
	});

	/**
	 * @typedef {{
	 *		info: {
	 *			profilePicture: String,
	 *			gender: String,
	 *			birthday: String,
	 *			phone: String,
	 *			address: String
	 *		},
	 * 		name: String,
	 * 		email: String,
	 * 		medicalRecords: {
	 * 			id: String,
	 * 			date: String,
	 * 			notes: String,
	 * 			medications: String
	 * 		}[],
	 * 		id: String
	 * }} Patient
	 */

	patients.use('/', async (req, res, next) => {
		if (req.method === 'GET')
			return next();

		if (!req.headers.authorization) {
			res.status(401).send({ message: 'Unauthorized' });
			return;
		};

		const [id, sessionKey] = req.headers.authorization.split(' ');

		const snapshot = await database.ref(`staffs/${id}`).once('value');
		let admin = snapshot.val();
		if (!admin) {
			const snapshot = await database.ref(`doctors/${id}`).once('value');
			admin = snapshot.val();
		};
		if (!admin) {
			res.status(401).send({ message: 'Unauthorized' });
			return;
		};

		if (!admin.credentials.sessions || !admin.credentials.sessions.includes(sessionKey)) {
			res.status(401).send({ message: 'Unauthorized' });
			return;
		};

		req.admin = admin;
		next();
	});

	// Create a new patient
	patients.put('/', async (req, res) => {
		/**
		 * @type {{
	 	 *		info?: {
		 *			profilePicture?: String,
		 *			gender?: String,
		 *			birthday?: String,
		 *			phone?: String,
		 *			address?: String
		 *		},
		 * 		name: String,
		 * 		email: String,
		 * 		medicalRecords: {
		* 			id: String,
		* 			date: String,
		* 			notes: String,
		 * 			medications: String
		 * 		}[]
		 * }}
		 */
		const patient = req.body;

		// Check if the request body is valid
		if (!patient.name || !patient.email) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};

		// Create a new patient
		const id = database.ref('patients').push().key;

		// Check if the request body has a profile picture
		if (patient.info && patient.info.profilePicture) {
			// Convert the base64 image
			const image = Buffer.from(patient.info.profilePicture.replace(/^data:image\/\w+;base64,/, ''), 'base64');
			// Get type from base64
			const type = patient.info.profilePicture.split(';')[0].split('/')[1];
			
			const file = bucket.file(`files/${id}.${type}`);
			await file.save(image, {
				metadata: {
					contentType: `image/${type}`
				}
			});

			patient.info.profilePicture = file.publicUrl();
		} else {
			patient.info.profilePicture = 'https://firebasestorage.googleapis.com/v0/b/medicare-a38ad.appspot.com/o/assets%2Fdefault%20avatar.jpg?alt=media';
		};

		await database.ref(`patients/${id}`).set({
			info: patient.info || {},
			name: patient.name,
			email: patient.email,
			medicalRecords: patient.medicalRecords || [],
			id: id
		});

		// Send the response
		res.send({ message: 'Patient created successfully' });

		// Send the new patient to all connected clients
		for (const ws of wsConnections) {
			const Authorization = req.headers.authorization || req.headers.Authorization || '';
			const [id, sessionKey] = (Authorization).split(' ');

			if (ws.page === 'patients') {
				if (ws.credentials.sessionKey === sessionKey) continue;
				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: 'patients'
				}));
			};
		};

		// Create History entry
		const historyRef = database.ref('history').push();
		await historyRef.set({
			route: 'patients',
			subroute: 'profile',
			action: 'create',
			date: new Date().toISOString(),
			actor: req.user || {},
			summary: `Created patient profile with id "${id}"`
		});
	});

	// Update a patient
	patients.patch('/:id', async (req, res) => {
		/**
		 * @type {{
	 	 *		info?: {
		 *			profilePicture?: String,
		 *			gender?: String,
		 *			birthday?: String,
		 *			phone?: String,
		 *			address?: String
		 *		},
		 * 		name: String,
		 * 		email: String
		 * 		doNotChangeProfile?: Boolean
		 * }}
		 */
		const patient = req.body;

		// Check required fields
		if (!patient.name && !patient.email) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};

		// Check if the patient exists
		const snapshot = await database.ref(`patients/${req.params.id}`).once('value');
		if (!snapshot.exists()) {
			res.status(400).send({ message: 'Patient does not exist' });
			return;
		};

		// Check if the request body has a profile picture
		if (patient.info && patient.info.profilePicture && !patient.doNotChangeProfile) {
			// Convert the base64 image
			const image = Buffer.from(patient.info.profilePicture.replace(/^data:image\/\w+;base64,/, ''), 'base64');
			// Get type from base64
			const type = patient.info.profilePicture.split(';')[0].split('/')[1];
			if (!['png', 'jpeg', 'jpg'].includes(type)) {
				res.status(400).send({ message: 'Invalid image type' });
				return;
			};
			
			const file = bucket.file(`files/${req.params.id}.${type}`);
			await file.save(image, {
				metadata: {
					contentType: `image/${type}`
				}
			});

			patient.info.profilePicture = file.publicUrl();
		};
		delete patient.doNotChangeProfile;

		// Update the patient
		await database.ref(`patients/${req.params.id}`).update(patient);

		// Send the response
		res.send({ message: 'Patient updated successfully' });

		// Send the updated patient to all connected clients
		for (const ws of wsConnections) {
			const Authorization = req.headers.authorization || req.headers.Authorization || '';
			const [id, sessionKey] = (Authorization).split(' ');

			if (ws.page === 'patients') {
				if (ws.credentials.sessionKey === sessionKey) continue;
				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: 'patients'
				}));
			};
			if (ws.page === `patients/${req.params.id}`) {
				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: `patients/${req.params.id}`
				}));
			};
		};

		// Create History entry
		const historyRef = database.ref('history').push();
		await historyRef.set({
			route: 'patients',
			subroute: 'profile',
			action: 'update',
			date: new Date().toISOString(),
			actor: req.user || {},
			summary: `Updated patient profile with id "${req.params.id}"`
		});
	});

	// Delete a patient
	patients.delete('/:id', async (req, res) => {
		// Check if the patient exists
		const snapshot = await database.ref(`patients/${req.params.id}`).once('value');
		if (!snapshot.exists()) {
			res.status(400).send({ message: 'Patient does not exist' });
			return;
		};

		// Delete the patient
		await database.ref(`patients/${req.params.id}`).remove();

		// Send the response
		res.send({ message: 'Patient deleted successfully' });

		// Send the deleted patient to all connected clients
		for (const ws of wsConnections) {
			const Authorization = req.headers.authorization || req.headers.Authorization || '';
			const [id, sessionKey] = (Authorization).split(' ');

			if (ws.page === 'patients') {
				if (ws.credentials.sessionKey === sessionKey) continue;
				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: 'patients'
				}));
			};
			if (ws.page === `patients/${req.params.id}`) {
				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: `patients/${req.params.id}`
				}));
			};
		};

		// Create History entry
		const historyRef = database.ref('history').push();
		await historyRef.set({
			route: 'patients',
			subroute: 'profile',
			action: 'delete',
			date: new Date().toISOString(),
			actor: req.user || {},
			summary: `Deleted patient profile with id "${req.params.id}"`
		});
	});



	// Get a patient's medical records
	patients.get('/:id/medicalRecords', async (req, res) => {
		const snapshot = await database.ref(`patients/${req.params.id}/medicalRecords`).once('value');
		const records = snapshot.val() || {};

		const recordsArray = Object.keys(records).map((key) => records[key]);
		res.json(recordsArray);
	});

	// Create a new medical record for a patient
	patients.put('/:id/medicalRecords', async (req, res) => {
		/**
		 * @type {{
		   *		id: String,
		 *		date: String,
		 *		notes: String,
		 *		medications: String
		 * }}
		 */
		const record = {
			id: null,
			date: req.body.date,
			notes: req.body.notes,
			medications: req.body.medications
		};

		// Check if the request body is valid
		if (!record.notes || !record.medications) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};

		// Check if the patient exists
		const snapshot = await database.ref(`patients/${req.params.id}`).once('value');
		if (!snapshot.exists()) {
			res.status(400).send({ message: 'Patient does not exist' });
			return;
		};

		// Create a new medical record
		record.id = database.ref(`patients/${req.params.id}/medicalRecords`).push().key;
		await database.ref(`patients/${req.params.id}/medicalRecords/${record.id}`).set(record);

		// Send the response
		res.send({ message: 'Medical record created successfully' });

		// Send the new medical record to all connected clients
		for (const ws of wsConnections) {
			const Authorization = req.headers.authorization || req.headers.Authorization || '';
			const [id, sessionKey] = (Authorization).split(' ');

			if (ws.page === `patients/${req.params.id}`) {
				if (ws.credentials.sessionKey === sessionKey) continue;
				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: `patients/${req.params.id}`
				}));
			};
		};

		// Create History entry
		const historyRef = database.ref('history').push();
		await historyRef.set({
			route: 'patients',
			subroute: 'medicalRecords',
			action: 'create',
			date: new Date().toISOString(),
			actor: req.user || {},
			summary: `Created medical record with id "${record.id}" for patient with id "${req.params.id}"`
		});
	});

	// Update a medical record for a patient
	patients.patch('/:id/medicalRecords/:recordId', async (req, res) => {
		/**
		 * @type {{
		   *		id: String,
		 *		date: String,
		 *		notes: String,
		 *		medications: String
		 * }}
		 */
		const record = req.body;

		// Check required fields
		if (!record.date && !record.notes && !record.medications) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};

		// Check if the patient exists
		const snapshot = await database.ref(`patients/${req.params.id}`).once('value');
		if (!snapshot.exists()) {
			res.status(400).send({ message: 'Patient does not exist' });
			return;
		};

		// Check if the medical record exists
		const recordSnapshot = await database.ref(`patients/${req.params.id}/medicalRecords/${req.params.recordId}`).once('value');
		if (!recordSnapshot.exists()) {
			res.status(400).send({ message: 'Medical record does not exist' });
			return;
		};

		// Update the medical record
		await database.ref(`patients/${req.params.id}/medicalRecords/${req.params.recordId}`).update(record);

		// Send the response
		res.send({ message: 'Medical record updated successfully' });

		// Send the updated medical record to all connected clients
		for (const ws of wsConnections) {
			const Authorization = req.headers.authorization || req.headers.Authorization || '';
			const [id, sessionKey] = (Authorization).split(' ');

			if (ws.page === `patients/${req.params.id}`) {
				if (ws.credentials.sessionKey === sessionKey) continue;
				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: `patients/${req.params.id}`
				}));
			};
			if (ws.page === `patients/${req.params.id}/medicalRecords/${req.params.recordId}`) {
				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: `patients/${req.params.id}/medicalRecords/${req.params.recordId}`
				}));
			};
		};

		// Create History entry
		const historyRef = database.ref('history').push();
		await historyRef.set({
			route: 'patients',
			subroute: 'medicalRecords',
			action: 'update',
			date: new Date().toISOString(),
			actor: req.user || {},
			summary: `Updated medical record with id "${req.params.recordId}" for patient with id "${req.params.id}"`
		});
	});

	// Delete a medical record for a patient
	patients.delete('/:id/medicalRecords/:recordId', async (req, res) => {
		// Check if the patient exists
		const snapshot = await database.ref(`patients/${req.params.id}`).once('value');
		if (!snapshot.exists()) {
			res.status(400).send({ message: 'Patient does not exist' });
			return;
		};

		// Check if the medical record exists
		const recordSnapshot = await database.ref(`patients/${req.params.id}/medicalRecords/${req.params.recordId}`).once('value');
		if (!recordSnapshot.exists()) {
			res.status(400).send({ message: 'Medical record does not exist' });
			return;
		};

		// Delete the medical record
		await database.ref(`patients/${req.params.id}/medicalRecords/${req.params.recordId}`).remove();

		// Send the response
		res.send({ message: 'Medical record deleted successfully' });

		// Send the deleted medical record to all connected clients
		for (const ws of wsConnections) {
			const Authorization = req.headers.authorization || req.headers.Authorization || '';
			const [id, sessionKey] = (Authorization).split(' ');

			if (ws.page === `patients/${req.params.id}`) {
				if (ws.credentials.sessionKey === sessionKey) continue;
				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: `patients/${req.params.id}`
				}));
			};
			if (ws.page === `patients/${req.params.id}/medicalRecords/${req.params.recordId}`) {
				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: `patients/${req.params.id}/medicalRecords/${req.params.recordId}`
				}));
			};
		};

		// Create History entry
		const historyRef = database.ref('history').push();
		await historyRef.set({
			route: 'patients',
			subroute: 'medicalRecords',
			action: 'delete',
			date: new Date().toISOString(),
			actor: req.user || {},
			summary: `Deleted medical record with id "${req.params.recordId}" for patient with id "${req.params.id}"`
		});
	});
	return patients;
};