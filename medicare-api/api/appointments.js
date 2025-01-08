import router from 'express';

const appointment = router();

import { wsConnections, transporter } from '../utils/globals.js';

/**
 * @type {(
* 		admin: import('firebase-admin'),
* 		database: import('firebase-admin/database').Database,
* 		bucket: import('@google-cloud/storage').Bucket
* ) => import('express').Router}
*/
export default (admin, database, bucket) => {
	appointment.get('/', (req, res) => {
		const ref = database.ref('appointments');
		ref.once('value', async (snapshot) => {
			res.json(snapshot.val());
		});
	});

	/**
	 * @typedef {{
	 * 		patient: {
	 * 			name: String,
	 * 			gender: 'Male' | 'Female' | 'Other',
	 * 			age: Number,
	 * 			phone: String
	 * 		},
	 * 		appointment: {
	 * 			service: 'dental' | 'checkup' | 'circumcision' | 'vaccination',
	 * 			date: String,
	 * 			time: String,
	 * 			status: 'pending' | 'approved' | 'rejected' | 'cancelled',
	 * 			rejectedReason?: String
	 * 		},
	 * 		user: {
	 * 			name: String,
	 * 			id: String
	 * 		},
	 * 		created: String,
	 * 		id: String
	 * }} Appointment
	 */

	// Create a new appointment
	appointment.put('/', async (req, res) => {
		/**
		 * @type {{
		 * 		patient: {
		 * 			name: String,
		 * 			gender: 'Male' | 'Female' | 'Other',
		 * 			age: Number,
		 * 			phone: String
		 * 		},
		 * 		appointment: {
		 * 			service: 'dental' | 'checkup' | 'circumcision' | 'vaccination',
		 * 			date: String,
		 * 			time: String,
		 * 			status: 'pending' | 'approved' | 'rejected' | 'cancelled'
		 * 		},
		 * 		user: {
		 * 			id: String
		 * 		}
		 * }}
		 */
		const body = req.body;

		// Check if the request body is valid
		// Patient
		if (!body.patient || !body.patient.name || !body.patient.gender || !body.patient.age || !body.patient.phone) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};
		// Appointment
		if (!body.appointment || !body.appointment.service || !body.appointment.date || !body.appointment.time) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};
		// User
		if (!body.user || !body.user.id) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};

		// Get the user
		const userSnapshot = await database.ref(`users/${body.user.id}`).once('value');
		if (!userSnapshot.exists()) {
			res.status(404).send({ message: 'User not found' });
			return;
		};
		const user = userSnapshot.val();

		// Check if date and time is valid
		const date = new Date(body.appointment.date);
		if (isNaN(date.getTime())) {
			res.status(400).send({ message: 'Invalid date' });
			return;
		};
		const time = body.appointment.time.split(':');
		if (time.length !== 2) {
			res.status(400).send({ message: 'Invalid time' });
			return;
		};
		if (isNaN(Number(time[0])) || isNaN(Number(time[1])) || Number(time[0]) < 0 || Number(time[0]) > 23 || Number(time[1]) < 0 || Number(time[1]) > 59) {
			res.status(400).send({ message: 'Invalid time' });
			return;
		};

		// Check if the date is not in the past
		const now = new Date();
		if (date < now) {
			res.status(400).send({ message: 'Invalid date' });
			return;
		};
		// Check if the time is not in the past
		if (date.getTime() === now.getTime() && Number(time[0]) < now.getHours()) {
			res.status(400).send({ message: 'Invalid time' });
			return;
		};
		if (date.getTime() === now.getTime() && Number(time[0]) === now.getHours() && Number(time[1]) < now.getMinutes()) {
			res.status(400).send({ message: 'Invalid time' });
			return;
		};

		// Check if the date and time is available
		// Use the following code to check if the date and time is available:
		// { label: 'Dental (Tuesday)', value: 'dental' },
		// { label: 'Checkup (Monday - Friday)', value: 'checkup' },
		// { label: 'Circumcision (Thursday)', value: 'circumcision' },
		// { label: 'Vaccination (Wednesday - Friday)', value: 'vaccination' },
		// { label: 'Prenatal (Monday - Saturday)', value: 'prenatal' }
		const day = date.getDay();
		const hours = Number(time[0]);
		const minutes = Number(time[1]);
		if (body.appointment.service === 'dental' && day !== 2) {
			res.status(400).send({ message: 'Date is not available for this dental service.' });
			return;
		} else if (body.appointment.service === 'checkup' && (day < 1 || day > 5)) {
			res.status(400).send({ message: 'Date is not available for this checkup service.' });
			return;
		} else if (body.appointment.service === 'circumcision' && day !== 4) {
			res.status(400).send({ message: 'Date is not available for this circumcision service.' });
			return;
		} else if (body.appointment.service === 'vaccination' && (day < 3 || day > 5)) {
			res.status(400).send({ message: 'Date is not available for this vaccination service.' });
			return;
		} else if (body.appointment.service === 'prenatal' && (day < 1 || day > 6)) {
			res.status(400).send({ message: 'Date is not available for this prenatal service.' });
			return;
		};
		if (hours < 8 || hours > 17) {
			res.status(400).send({ message: 'Time is not available for this service.' });
			return;
		};
		

		// Create a new appointment in the database
		const id = database.ref('appointments').push().key;
		await database.ref(`appointments/${id}`).set({
			patient: {
				name: body.patient.name,
				gender: body.patient.gender,
				age: body.patient.age,
				phone: body.patient.phone
			},
			appointment: {
				service: body.appointment.service,
				date: body.appointment.date, // YYYY-MM-DD
				time: body.appointment.time, // HH:MM
				status: 'pending',
				rejectedReason: ''
			},
			user: {
				id: body.user.id
			},
			created: new Date().toISOString(),
			id: id
		});

		// Send the response
		res.send({ message: 'Appointment created successfully' });

		// Send the new appointment to all connected clients
		for (const ws of wsConnections) {
			const Authorization = req.headers.authorization || req.headers.Authorization || '';
			const [id, sessionKey] = (Authorization).split(' ');

			if (ws.page === 'appointments') {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: 'appointments'
				}));
			};
			if (ws.page === `users/${body.user.id}`) {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: `users/${body.user.id}`
				}));
			};
		};

		// Send an email to the user
		const mailOptions = {
			from: 'Medicare',
			to: userSnapshot.val().email,
			subject: 'New Appointment',
			text: `You have a new appointment on ${body.appointment.date} at ${body.appointment.time}`
		};

		// Send the email
		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				console.log(error);
			} else {
				console.log('Email sent: ' + info.response);
			};
		});

		// Create History entry
		const historyRef = database.ref('history').push();
		await historyRef.set({
			route: 'appointments',
			subroute: 'booking',
			action: 'create',
			date: new Date().toISOString(),
			actor: req.user || {},
			summary: `User: "${user.name}" created a new appointment with id "${id}"`
		});
	});

	// Update an appointment
	// Approve an appointment
	appointment.post('/approve/:id/', async (req, res) => {
		const appointmentId = req.params.id;

		// Check if the appointment exists
		const appointmentRef = database.ref(`appointments/${appointmentId}`);
		const appointmentSnapshot = await appointmentRef.once('value');
		if (!appointmentSnapshot.exists()) {
			res.status(404).send({ message: 'Appointment not found' });
			return;
		};
		const appointment = appointmentSnapshot.val();

		// Update the appointment status
		const appointmentInfoRef = appointmentRef.child('appointment');
		await appointmentInfoRef.update({
			status: 'approved'
		});

		// Send the response
		res.send({ message: 'Appointment approved successfully' });

		// Send the new appointment to all connected clients
		for (const ws of wsConnections) {
			const Authorization = req.headers.authorization || req.headers.Authorization || '';
			const [id, sessionKey] = (Authorization).split(' ');

			if (ws.page === 'appointments') {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: 'appointments'
				}));
			};
			if (ws.page === `appointments/${ws.credentials.id}`) {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: `appointments/${ws.credentials.id}`
				}));
			};
			if (ws.page === `users/${appointment.user.id}`) {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: `users/${appointment.user.id}`
				}));
			};
		};

		// Send an email to the user
		{
			const appointmentSnapshot = await appointmentRef.once('value');
			const appointment = appointmentSnapshot.val();

			const userSnapshot = await database.ref(`users/${appointment.user.id}`).once('value');
			const user = userSnapshot.val();

			const mailOptions = {
				from: 'Medicare',
				to: user.email,
				subject: 'Appointment Approved',
				text: 'Your appointment has been approved'
			};

			// Send the email
			transporter.sendMail(mailOptions, (error, info) => {
				if (error) {
					console.log(error);
				} else {
					console.log('Email sent: ' + info.response);
				};
			});

			// Create History entry
			const historyRef = database.ref('history').push();
			await historyRef.set({
				route: 'appointments',
				subroute: 'booking',
				action: 'approve',
				date: new Date().toISOString(),
				actor: req.user || {},
				summary: `Approved appointment with id "${appointmentId}"`
			});
		};
	});
	// Cancel an appointment
	appointment.post('/cancel/:id/', async (req, res) => {
		const appointmentId = req.params.id;

		// Check if the appointment exists
		const appointmentRef = database.ref(`appointments/${appointmentId}`);
		const appointmentSnapshot = await appointmentRef.once('value');
		if (!appointmentSnapshot.exists()) {
			res.status(404).send({ message: 'Appointment not found' });
			return;
		};
		const appointment = appointmentSnapshot.val();

		// Update the appointment status
		const appointmentInfoRef = appointmentRef.child('appointment');
		await appointmentInfoRef.update({
			status: 'cancelled'
		});

		// Send the response
		res.send({ message: 'Appointment cancelled successfully' });

		// Send the new appointment to all connected clients
		for (const ws of wsConnections) {
			const Authorization = req.headers.authorization || req.headers.Authorization || '';
			const [id, sessionKey] = (Authorization).split(' ');

			if (ws.page === 'appointments') {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: 'appointments'
				}));
			};
			if (ws.page === `appointments/${ws.credentials.id}`) {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: `appointments/${ws.credentials.id}`
				}));
			};
			if (ws.page === `users/${appointment.user.id}`) {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: `users/${appointment.user.id}`
				}));
			};
		};

		// Send an email to the user
		{
			const appointmentSnapshot = await appointmentRef.once('value');
			const appointment = appointmentSnapshot.val();

			const userSnapshot = await database.ref(`users/${appointment.user.id}`).once('value');
			const user = userSnapshot.val();

			const mailOptions = {
				from: 'Medicare',
				to: user.email,
				subject: 'Appointment Cancelled',
				text: 'Your appointment has been cancelled'
			};

			// Send the email
			transporter.sendMail(mailOptions, (error, info) => {
				if (error) {
					console.log(error);
				} else {
					console.log('Email sent: ' + info.response);
				};
			});

			// Create History entry
			const historyRef = database.ref('history').push();
			await historyRef.set({
				route: 'appointments',
				subroute: 'booking',
				action: 'cancel',
				date: new Date().toISOString(),
				actor: req.user || {},
				summary: `Cancelled appointment with id "${appointmentId}"`
			});
		};
	});
	// Reject an appointment
	appointment.post('/reject/:id/', async (req, res) => {
		const appointmentId = req.params.id;

		// Check if the appointment exists
		const appointmentRef = database.ref(`appointments/${appointmentId}`);
		const appointmentSnapshot = await appointmentRef.once('value');
		if (!appointmentSnapshot.exists()) {
			res.status(404).send({ message: 'Appointment not found' });
			return;
		};
		const appointment = appointmentSnapshot.val();

		// Check if the reason is provided
		if (!req.body.reason) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};

		// Update the appointment status
		const appointmentInfoRef = appointmentRef.child('appointment');
		await appointmentInfoRef.update({
			status: 'rejected',
			rejectedReason: req.body.reason
		});

		// Send the response
		res.send({ message: 'Appointment rejected successfully' });

		// Send the new appointment to all connected clients
		for (const ws of wsConnections) {
			const Authorization = req.headers.authorization || req.headers.Authorization || '';
			const [id, sessionKey] = (Authorization).split(' ');

			if (ws.page === 'appointments') {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: 'appointments'
				}));
			};
			if (ws.page === `appointments/${ws.credentials.id}`) {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: `appointments/${ws.credentials.id}`
				}));
			};
			if (ws.page === `users/${appointment.user.id}`) {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: `users/${appointment.user.id}`
				}));
			};
		};

		// Send an email to the user
		{
			const appointmentSnapshot = await appointmentRef.once('value');
			const appointment = appointmentSnapshot.val();

			const userSnapshot = await database.ref(`users/${appointment.user.id}`).once('value');
			const user = userSnapshot.val();

			const mailOptions = {
				from: 'Medicare',
				to: user.email,
				subject: 'Appointment Rejected',
				text: 'Your appointment has been rejected'
			};

			// Send the email
			transporter.sendMail(mailOptions, (error, info) => {
				if (error) {
					console.log(error);
				} else {
					console.log('Email sent: ' + info.response);
				};
			});

			// Create History entry
			const historyRef = database.ref('history').push();
			await historyRef.set({
				route: 'appointments',
				subroute: 'booking',
				action: 'reject',
				date: new Date().toISOString(),
				actor: req.user || {},
				summary: `Rejected appointment with id "${appointmentId}"`
			});
		};
	});

	// Get an appointment
	appointment.get('/:id', async (req, res) => {
		const id = req.params.id;

		// Check if the appointment exists
		const snapshot = await database.ref(`appointments/${id}`).once('value');
		if (!snapshot.exists()) {
			res.status(404).send({ message: 'Appointment not found' });
			return;
		};

		// Send the appointment
		res.json(snapshot.val());
	});
	// Get appointments by user
	appointment.get('/user/:id', async (req, res) => {
		const userId = req.params.id;

		// Check if the user exists
		const userSnapshot = await database.ref(`users/${userId}`).once('value');
		if (!userSnapshot.exists()) {
			res.status(404).send({ message: 'User not found' });
			return;
		};

		// Get the appointments
		const snapshot = await database.ref('appointments').once('value');
		const appointments = snapshot.val();
		if (!appointments) {
			res.json([]);
			return;
		};
		const appointmentsArray = Object.values(appointments).filter((appointment) => appointment.user.id === userId);

		// Send the appointments
		res.json(appointmentsArray);
	});

	// Chore:
	// Notify the users of their appointment 1 day before the appointment
	setInterval(async () => {
		const appointmentsSnapshot = await database.ref('appointments').once('value');
		const appointments = appointmentsSnapshot.val();
		if (!appointments) return;

		const appointmentsArray = Object.values(appointments);
		const now = new Date();
		for (const appointment of appointmentsArray) {
			const date = new Date(appointment.appointment.date);
			if (date.getTime() - now.getTime() < 1000 * 60 * 60 * 24 && date.getTime() - now.getTime() > 0) {
				const userSnapshot = await database.ref(`users/${appointment.user.id}`).once('value');
				const user = userSnapshot.val();

				const mailOptions = {
					from: 'Medicare',
					to: user.email,
					subject: 'Appointment Reminder',
					text: `You have an appointment tomorrow on ${appointment.appointment.date} at ${appointment.appointment.time}`
				};

				// Send the email
				transporter.sendMail(mailOptions, (error, info) => {
					if (error) {
						console.log(error);
					} else {
						console.log('Email sent: ' + info.response);
					};
				});

				// Notify the user on the time of the appointment
				const timeout = date.getTime() - now.getTime();
				setTimeout(() => {
					const mailOptions = {
						from: 'Medicare',
						to: user.email,
						subject: 'Appointment Reminder',
						text: `You have an appointment today on ${appointment.appointment.date} at ${appointment.appointment.time}`
					};

					// Send the email
					transporter.sendMail(mailOptions, (error, info) => {
						if (error) {
							console.log(error);
						} else {
							console.log('Email sent: ' + info.response);
						};
					});
				}, timeout);
			};
		};
	}, 1000 * 60 * 60 * 24);

	return appointment;
};