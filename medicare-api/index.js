
import fs from 'fs';
import path from 'path';

import jsonwebtoken from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import * as logUpdate from 'log-update';

import express from 'express';

import bodyParser from 'body-parser';

import { createServer } from 'http';
import { WebSocketServer } from 'ws';

import * as globals from './utils/globals.js';
const { wsConnections, transporter } = globals;

// Firebase Admin SDK
import admin from 'firebase-admin';
import serviceAccount from './medicare-firebase-key.json' with { type: 'json' };

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: 'https://medicare-a38ad-default-rtdb.asia-southeast1.firebasedatabase.app/'
});

// Database
const database = admin.database();

// Storage
import { getStorage } from 'firebase-admin/storage';
const storage = getStorage();
const bucket = storage.bucket('medicare-a38ad.appspot.com');



const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

app.use(async (req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, SEARCH');
	
	const log = logUpdate.createLogUpdate(process.stdout, {
		showCursor: true
	});
	log(`Request: ${req.method} '${req.url}'`);

	const loadingChars = ['|', '/', '-', '\\'];
	let loadingCharIndex = 0;
	const loadingInterval = setInterval(() => {
		loadingCharIndex = loadingCharIndex >= loadingChars.length - 1 ? 0 : loadingCharIndex + 1;
		log(`Request: ${req.method} '${req.url}' ${loadingChars[loadingCharIndex]}`);
	}, 250);

	const Authorization = req.headers.authorization || req.headers.Authorization || '';
	const [id, sessionKey] = (Authorization).split(' ');
	if (id && sessionKey) {
		const userRef = database.ref(`users/${id}`);
		const userSnapshot = await userRef.once('value');
		let user = userSnapshot.val();
		let type = 'user';
		if (!user) {
			const staffRef = database.ref(`staffs/${id}`);
			const staffSnapshot = await staffRef.once('value');
			user = staffSnapshot.val();
			type = 'staff';
		};
		if (!user) {
			const doctorRef = database.ref(`doctors/${id}`);
			const doctorSnapshot = await doctorRef.once('value');
			user = doctorSnapshot.val();
			type = 'doctor';
		};
		if (user) {
			const sessions = user.credentials.sessions || [];
			const validToken = sessions.find((t) => t === sessionKey);
			delete user.credentials;
			if (validToken) {
				/**
				 * @type {{import('./api/users.js').User}}
				 */
				req.user = {
					...user,
					type: type
				};
			} else {
				res.status(401).send('Unauthorized');
				return;
			};
		};
	};
	next();

	res.on('finish', async () => {
		log(`Request: ${req.method} '${req.url}' - ${res.statusCode} ${res.statusMessage}`);
		log.done();
		clearInterval(loadingInterval);
	});
});

app.get('/', (req, res) => {
	res.send('Hello World');
});



// API
import hello from './api/hello.js'; app.use('/api/hello', hello());

// import admins from './api/admins.js'; app.use('/api/admins', admins(admin, database));
import staffs from './api/staffs.js';
app.use('/api/staffs', staffs(admin, database));
import doctors from './api/doctors.js';
app.use('/api/doctors', doctors(admin, database));
import users from './api/users.js';
app.use('/api/users', users(admin, database, bucket));

import supply from './api/supply.js';
app.use('/api/supply', supply(admin, database, bucket));
import appointment from './api/appointments.js';
app.use('/api/appointments', appointment(admin, database));
import patients from './api/patients.js';
app.use('/api/patients', patients(admin, database, bucket));

app.get('/api/routes', async (req, res) => {
	const historyRef = database.ref('history');
	const historySnapshot = await historyRef.once('value');
	const history = historySnapshot.val() || {};
	const routesAndSubroutes = [];
	for (const entry of Object.values(history)) {
		let routeObject = {
			name: entry.route,
			subroutes: []
		};
		const routeIndex = routesAndSubroutes.findIndex((route) => route.name === entry.route);
		if (routeIndex === -1) {
			routesAndSubroutes.push(routeObject);
		} else {
			routeObject = routesAndSubroutes[routeIndex];
		};
		if (entry.subroute && !routeObject.subroutes.includes(entry.subroute)) {
			routeObject.subroutes.push(entry.subroute);
		};
	};
	res.send(routesAndSubroutes);
});
app.get('/api/history/', async (req, res) => {
	const historyRef = database.ref('history');
	const historySnapshot = await historyRef.once('value');
	const history = historySnapshot.val() || {};
	res.send(Object.values(history));
});
app.get('/api/history/:route', async (req, res) => {
	const route = req.params.route;
	const historyRef = database.ref('history');
	const historySnapshot = await historyRef.once('value');
	const history = historySnapshot.val() || {};
	const filtered = Object.values(history).filter((entry) => entry.route === route);
	res.send(filtered);
});
app.get('/api/history/:route/:subroute', async (req, res) => {
	const route = req.params.route;
	const subroute = req.params.subroute;
	const historyRef = database.ref('history');
	const historySnapshot = await historyRef.once('value');
	const history = historySnapshot.val() || {};
	const filtered = Object.values(history).filter((entry) => entry.route === route && entry.subroute === subroute);
	// Map it and check if it has an actor
	const mapped = filtered.map(async (entry) => {
		// If an actor is not found, it will return an empty actor object
		let actor = {};
		const actorRef = database.ref(`users/${entry.actorID}`);
		const actorSnapshot = await actorRef.once('value');
		const user = actorSnapshot.val();
		if (user) {
			actor = {
				...user,
				credentials: null
			};
		};
	});
	console.log();
	
	res.send(filtered);
});

app.get('/api/active', async (req, res) => {
	const activeConnections = new Set(wsConnections.map((connection) => connection.credentials.id));

	const activeUsers = [];
	for (const id of activeConnections) {
		const userRef = database.ref(`users/${id}`);
		let user = (await userRef.once('value')).val();
		let type = 'user';
		if (!user) {
			const staffRef = database.ref(`staffs/${id}`);
			user = (await staffRef.once('value')).val();
			type = 'staff';
		};
		if (!user) {
			const doctorRef = database.ref(`doctors/${id}`);
			user = (await doctorRef.once('value')).val();
			type = 'doctor';
		};
		if (user) {
			activeUsers.push({
				...user,
				credentials: null,
				type: type
			});
		};
	};
	res.send(activeUsers);
});
app.get('/api/active/:id', async (req, res) => {
	const id = req.params.id;
	const connection = wsConnections.find((connection) => connection.credentials.id === id);
	if (connection) {
		res.send({
			...connection.credentials,
			credentials: null
		});
	} else {
		const type = id;
		const users = [];
		switch (type) {
			case 'users':
				for (const connection of wsConnections) {
					const userRef = database.ref(`users/${connection.credentials.id}`);
					const userSnapshot = await userRef.once('value');
					const user = userSnapshot.val();
					if (user) {
						users.push({
							...user,
							credentials: null
						});
					};
				};
				break;
			case 'staffs':
				for (const connection of wsConnections) {
					const staffRef = database.ref(`staffs/${connection.credentials.id}`);
					const staffSnapshot = await staffRef.once('value');
					const staff = staffSnapshot.val();
					if (staff) {
						users.push({
							...staff,
							credentials: null
						});
					};
				};
				break;
			case 'doctors':
				for (const connection of wsConnections) {
					const doctorRef = database.ref(`doctors/${connection.credentials.id}`);
					const doctorSnapshot = await doctorRef.once('value');
					const doctor = doctorSnapshot.val();
					if (doctor) {
						users.push({
							...doctor,
							credentials: null
						});
					};
				};
				break;
		};

		res.send(users || {});
	};
});
app.get('/api/prices', async (req, res) => {
	const snapshot = await database.ref('categories').once('value');
	const categories = snapshot.val();

	const prices = [];
	for (const category of Object.values(categories || {})) {
		prices.push({
			...category,
			items: []
		});
	};
	for (const price of prices) {
		const snapshot = await database.ref(`items`).orderByChild('categoryID').equalTo(price.id).once('value');
		const items = snapshot.val();
		for (const item of Object.values(items || {})) {
			price.items.push(item);
		};
	};
	res.send(prices);
});

app.post('/api/forgotPassword', async (req, res) => {
	const { email } = req.body;
	if (!email) {
		res.status(400).send({ message: 'Email is required' });
		return;
	};

	const userRef = database.ref('users').orderByChild('email').equalTo(email);
	const userSnapshot = await userRef.once('value');
	let user = userSnapshot.val();
	let type = 'user';
	if (!user) {
		const staffRef = database.ref('staffs').orderByChild('email').equalTo(email);
		const staffSnapshot = await staffRef.once('value');
		user = staffSnapshot.val();
		type = 'staff';
	};
	if (!user) {
		const doctorRef = database.ref('doctors').orderByChild('email').equalTo(email);
		const doctorSnapshot = await doctorRef.once('value');
		user = doctorSnapshot.val();
		type = 'doctor';
	};
	if (!user) {
		res.status(400).send({ message: 'Email not found' });
		return;
	};

	// Delete previous OTPs associated with the email
	const previousOTPRef = database.ref('OTP').orderByChild('email').equalTo(email);
	const previousOTPSnapshot = await previousOTPRef.once('value');
	const previousOTPs = previousOTPSnapshot.val();
	Object.values(previousOTPs || {}).forEach(async (otp) => {
		await previousOTPSnapshot.ref.remove();
	});

	const OTP = `${Math.floor(100 + Math.random() * 1000)}-${Math.floor(100 + Math.random() * 1000)}`;
	const OTPRef = await database.ref('OTP').push();
	await OTPRef.set({
		email: email,
		OTP: OTP
	});

	const mailOptions = {
		from: 'Medicare Authenications',
		to: email,
		subject: 'Forgot Password',
		text: `Your OTP is ${OTP}. Please use this OTP to reset your password.`
	};

	// Send Email
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			logUpdate(`Error: ${error}`);
		} else {
			logUpdate(`Email sent: ${info.response}`);
		};
	});

	res.send({ message: 'OTP sent to your email' });

	setTimeout(async () => {
		try {
			Object.values((await OTPRef.once('value')).val() || {}).forEach(async (otp) => {
				await OTPRef.remove();
			});
		} catch (error) { };
	}, 1000 * 60 * 5); // 5 minutes
});
app.post('/api/forgotPassword/verify', async (req, res) => {
	const { email, OTP } = req.body;
	if (!email || !OTP) {
		res.status(400).send({ message: 'Email and OTP are required' });
		return;
	};

	const OTPRef = database.ref('OTP').orderByChild('email').equalTo(email);
	const OTPSnapshot = await OTPRef.once('value');
	const OTPs = OTPSnapshot.val();
	const OTPObject = Object.values(OTPs || {}).find((otp) => otp.OTP === OTP);
	if (OTPObject) {
		await OTPSnapshot.ref.remove();
		res.send({ message: 'OTP verified' });
	} else {
		res.status(400).send({ message: 'Invalid OTP' });
	};
});
app.post('/api/forgotPassword/reset', async (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) {
		res.status(400).send({ message: 'Email and Password are required' });
		return;
	};

	const userRef = database.ref('users').orderByChild('email').equalTo(email);
	const userSnapshot = await userRef.once('value');
	let user = userSnapshot.val();
	let type = 'user';
	if (!user) {
		const staffRef = database.ref('staffs').orderByChild('email').equalTo(email);
		const staffSnapshot = await staffRef.once('value');
		user = staffSnapshot.val();
		type = 'staff';
	};
	if (!user) {
		const doctorRef = database.ref('doctors').orderByChild('email').equalTo(email);
		const doctorSnapshot = await doctorRef.once('value');
		user = doctorSnapshot.val();
		type = 'doctor';
	};
	if (!user) {
		res.status(400).send({ message: 'Email not found' });
		return;
	};

	const userKey = Object.keys(user)[0];
	const newUserRef = database.ref(`${type}s/${userKey}`);
	await newUserRef.update({
		credentials: {
			password: bcrypt.hashSync(password, 10),
			sessions: []
		}
	});

	res.send({ message: 'Password updated' });
});

app.get('/download', async (req, res) => {
	const __dir = path.resolve();
	const file = `${__dir}/Medicare Mobile.apk`;
	res.download(file);
});

// Bucket
const buckets = ['files'];
for (const bucketPath of buckets) {
	app.get(`/media/${bucketPath}/:name`, (req, res) => {
		const name = req.params.name;

		const file = bucket.file(`${bucketPath}/${name}`);
		file.exists().then((data) => {
			const exists = data[0];
			if (exists) {
				file.createReadStream().pipe(res);
			} else {
				res.status(404).send('File not found');
			};
		});
	});
};

// Websocket
wss.on('connection', (ws) => {
	ws.on('message', (data) => {
		/**
		 * @type {
		 * 		{
		* 			type: 'credentials',
		* 			credentials: {
		* 				sessionKey: String,
		 * 				id: String
		 * 			}
		 * 		} | {
		 * 			type: 'subscribe',
		 * 			page: String | 'supplyCategories' | 'supplyCategories/:id' | 'appointments' | 'appointments/:id' | 'users' | 'users/:id' | 'patients' | 'patients/:id'
		 * 		}
		 * }
		 */
		const message = (() => {
			const message = data.toString();
			let json;
			try {
				json = JSON.parse(message);
			} catch (error) {
				json = {
					message: message
				};
			};
			return json;
		})();

		switch (message.type) {
			case 'credentials':
				// Check if connection is already stablished
				const connectionWS = wsConnections.find((connection) => connection.ws === ws);
				if (connectionWS) {
					connectionWS.credentials = message.credentials;
					console.log(`WSS: Connection with ${message.credentials.id} updated. Total connections: ${wsConnections.length}`);
					break;
				};
				// Check if Session Key is already exists in connections
				const connectionSession = wsConnections.find((connection) => connection.credentials.sessionKey === message.credentials.sessionKey);
				if (connectionSession) {
					connectionSession.ws = ws;
					connectionSession.credentials = message.credentials;
					console.log(`WSS: Connection with ${message.credentials.id} updated. Total connections: ${wsConnections.length}`);
					break;
				};
				// Create new connection
				wsConnections.push({
					ws: ws,
					credentials: message.credentials,
					page: ''
				});
				console.log(`WSS: Connection stablished with ${message.credentials.id}. Total connections: ${wsConnections.length}`);
				break;
			case 'subscribe':
				const connection = wsConnections.find((connection) => connection.ws === ws);
				if (connection) {
					connection.page = message.page;
					console.log(`WSS: ${connection.credentials.id} subscribed to ${message.page}`);
				} else {
					console.log('WSS: Connection not found');
				};
				break;
			default:
				console.log('WSS: Unknown message:', message);
				break;
		};
	});

	ws.on('close', () => {
		const connection = wsConnections.find((connection) => connection.ws === ws);
		if (connection) {
			const index = wsConnections.indexOf(connection);
			wsConnections.splice(index, 1);
			console.log(`WSS: Connection with ${connection.credentials.id} closed. Total connections: ${wsConnections.length}`);
		};
	});
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
	console.log(`Server started on port ${server.address().port} :)`);
});