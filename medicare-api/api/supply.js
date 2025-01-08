import router from 'express';

const supply = router();

import { wsConnections } from '../utils/globals.js';

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
	 * 		name: String,
	 * 		image: String,
	 * 		id: String
	 * }} Category
	 */


	supply.use('/categories', async (req, res, next) => {
		if (req.method === 'GET')
			return next();

		if (!req.headers.authorization) {
			res.status(401).send({ message: 'Unauthorized' });
			return;
		};

		const [id, sessionKey] = req.headers.authorization.split(' ');

		const snapshot = await database.ref(`staffs/${id}`).once('value');
		const staff = snapshot.val();
		if (!staff) {
			res.status(401).send({ message: 'Unauthorized' });
			return;
		};

		if (!staff.credentials.sessions || !staff.credentials.sessions.includes(sessionKey)) {
			res.status(401).send({ message: 'Unauthorized' });
			return;
		};

		req.staff = staff;
		next();
	});

	supply.get('/categories', async (req, res) => {
		const snapshot = await database.ref('categories').once('value');
		const categories = snapshot.val();
		if (!categories) {
			res.send({});
			return;
		};
		res.send(categories || {});
	});
	supply.post('/categories', async (req, res) => {
		const body = req.body;

		if (!body.name || !body.image) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};

		const category = {
			name: body.name,
			image: null,
			id: null
		};

		// Save the category to the database
		const ref = await database.ref('categories').push();
		category.id = ref.key;
		await ref.set(category);

		// Upload the image to the storage
		// Create Image from base64
		const image = Buffer.from(body.image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
		// Get type from base64
		const type = body.image.substring('data:image/'.length, body.image.indexOf(';base64'));

		const file = bucket.file(`files/"${category.id}".${type}`);
		await file.save(image, {
			public: true,
			metadata: {
				contentType: `image/${type}`
			}
		});

		// Update the category with the image URL
		category.image = file.publicUrl();
		await ref.set(category);

		res.send(category || {});

		// Send the new category to all connected clients
		for (const ws of wsConnections) {
			const Authorization = req.headers.authorization || req.headers.Authorization || '';
			const [id, sessionKey] = (Authorization).split(' ');

			if (ws.page === 'supplyCategories') {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: 'supplyCategories'
				}));
			};
		};

		// Create History entry
		const historyRef = database.ref('history').push();
		await historyRef.set({
			route: 'supply',
			subroute: 'categories',
			action: 'create',
			date: new Date().toISOString(),
			actor: req.user || {},
			summary: `Created category "${category.name}" with id "${category.id}"`
		});
	});
	supply.patch('/categories/:id', async (req, res) => {
		const id = req.params.id;

		/**
		 * @type {{
		 * 		name?: String,
		 * 		image?: String
		 * }}
		 */
		const body = req.body;

		if (!id) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};

		const categoryRef = database.ref(`categories/${id}`);
		const snapshot = await categoryRef.once('value');
		const category = snapshot.val();
		if (!category) {
			res.status(404).send({ message: 'Category not found' });
			return;
		};

		if (body.name) {
			if (body.name === '') {
				res.status(400).send({ message: 'Invalid name' });
				return;
			};
			category.name = body.name;
		};

		if (body.image) {
			// Create Image from base64
			const image = Buffer.from(body.image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
			// Get type from base64
			const type = body.image.substring('data:image/'.length, body.image.indexOf(';base64'));

			const file = bucket.file(`files/"${category.id}".${type}`);
			await file.save(image, {
				public: true,
				metadata: {
					contentType: `image/${type}`
				}
			});

			// Delete the old image
			const oldImage = category.image.split('?')[0].split('%2F')[1];
			await bucket.file(`files/${oldImage}`).delete();

			// Update the category with the image URL
			category.image = file.publicUrl();
		};

		if (!body.name && !body.image) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};
		
		await categoryRef.set({
			name: category.name,
			image: category.image
		});

		res.send(category || {});

		// Send the updated category to all connected clients
		for (const ws of wsConnections) {
			const Authorization = req.headers.authorization || req.headers.Authorization || '';
			const [id, sessionKey] = (Authorization).split(' ');

			if (ws.page === 'supplyCategories') {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: 'supplyCategories'
				}));
			};
		};

		// Send the updated category to all connected clients
		for (const ws of wsConnections) {
			const Authorization = req.headers.authorization || req.headers.Authorization || '';
			const [id, sessionKey] = (Authorization).split(' ');

			if (ws.page === `supplyCategories/"${category.id}"`) {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: `supplyCategories/"${category.id}"`
				}));
			};
		};

		// Create History entry
		const historyRef = database.ref('history').push();
		await historyRef.set({
			route: 'supply',
			subroute: 'categories',
			action: 'update',
			date: new Date().toISOString(),
			actor: req.user || {},
			summary: `Updated category "${category.name}" with id "${category.id}"`
		});
	});
	supply.delete('/categories/:id', async (req, res) => {
		const id = req.params.id;

		if (!id) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};

		const categoryRef = database.ref(`categories/${id}`);
		const snapshot = await categoryRef.once('value');
		const category = snapshot.val();
		if (!category) {
			res.status(404).send({ message: 'Category not found' });
			return;
		};

		// Delete the image
		const image = category.image.split('?')[0].split('%2F')[1];
		await bucket.file(`files/${image}`).delete();

		await categoryRef.remove();

		res.send(category || {});

		// Delete all items in the category
		const itemsSnapshot = await database.ref('items').once('value');
		const items = itemsSnapshot.val();
		if (items) {
			const categoryItems = Object.values(items).filter(item => item.categoryID === id);
			for (const item of categoryItems) {
				await database.ref(`items/${item.id}`).remove();
			};
		};

		// Send the deleted category to all connected clients
		for (const ws of wsConnections) {
			const Authorization = req.headers.authorization || req.headers.Authorization || '';
			const [id, sessionKey] = (Authorization).split(' ');

			if (ws.page === 'supplyCategories') {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: 'supplyCategories'
				}));
			};
		};

		// Send the deleted category to all connected clients
		for (const ws of wsConnections) {
			const Authorization = req.headers.authorization || req.headers.Authorization || '';
			const [id, sessionKey] = (Authorization).split(' ');

			if (ws.page === `supplyCategories/"${category.id}"`) {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'redirect',
					from: `supplyCategories/"${category.id}"`
				}));
			};
		};

		// Create History entry
		const historyRef = database.ref('history').push();
		await historyRef.set({
			route: 'supply',
			subroute: 'categories',
			action: 'delete',
			date: new Date().toISOString(),
			actor: req.user || {},
			summary: `Deleted category "${category.name}" with id "${category.id}"`
		});
	});
	supply.get('/categories/:id', async (req, res) => {
		const id = req.params.id;
		const snapshot = await database.ref(`categories/${id}`).once('value');
		const category = snapshot.val();
		res.send(category || {});
	});
	supply.get('/categories/:id/items', async (req, res) => {
		const id = req.params.id;
		const snapshot = await database.ref('items').once('value');
		const items = snapshot.val();
		if (!items) {
			res.send({});
			return;
		};
		const categoryItems = Object.values(items).filter(item => item.categoryID === id);
		res.send(categoryItems || {});
	});

	/**
	 * @typedef {{
	 * 		name: String,
	 * 		price: Number,
	 * 		id: String,
	 * 		category: String,
	 * 		stock: Number
	 * }} Item
	 */

	supply.use('/items', async (req, res, next) => {
		if (req.method === 'GET')
			return next();

		if (!req.headers.authorization) {
			res.status(401).send({ message: 'Unauthorized' });
			return;
		};

		const [id, sessionKey] = req.headers.authorization.split(' ');

		const snapshot = await database.ref(`staffs/${id}`).once('value');
		const staff = snapshot.val();
		if (!staff) {
			res.status(401).send({ message: 'Unauthorized' });
			return;
		};

		if (!staff.credentials.sessions || !staff.credentials.sessions.includes(sessionKey)) {
			res.status(401).send({ message: 'Unauthorized' });
			return;
		};

		req.staff = staff;
		next();
	});

	supply.get('/items', async (req, res) => {
		const snapshot = await database.ref('items').once('value');
		const items = snapshot.val();
		if (!items) {
			res.send({});
			return;
		};
		res.send(items || {});
	});
	supply.post('/items', async (req, res) => {
		const body = req.body;

		// if (!body.name && (body.price === undefined || body.price === null || parseFloat(body.price) <= 0) && (body.stock === undefined || body.stock === null) && !body.barcode) {
		if (!body.name || !body.price || body.price < 0 || !body.categoryID || body.stock === undefined) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};

		const item = {
			name: body.name,
			price: body.price || 1,
			categoryID: null,
			id: null,
			categoryID: body.categoryID,
			stock: body.stock,
			barcode: body.barcode || '<none>'
		};

		// Save the item to the database
		const ref = await database.ref('items').push();
		item.id = ref.key;
		await ref.set(item);

		res.send(item || {});

		// Send the items to all connected clients
		for (const ws of wsConnections) {
			const Authorization = req.headers.authorization || req.headers.Authorization || '';
			const [id, sessionKey] = (Authorization).split(' ');

			if (ws.page === `supplyCategories/${item.categoryID}`) {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: `supplyCategories/${item.categoryID}`
				}));
			};
		};

		// Create History entry
		const historyRef = database.ref('history').push();
		await historyRef.set({
			route: 'supply',
			subroute: 'items',
			action: 'create',
			date: new Date().toISOString(),
			actor: req.user || {},
			summary: `Created item "${item.name}" with id "${item.id}" in category "${item.categoryID}"`
		});
	});
	supply.patch('/items/:id', async (req, res) => {
		const id = req.params.id;

		/**
		 * @type {{
		 * 		name?: String,
		 * 		price?: Number,
		 * 		stock?: Number,
		 * 		barcode?: String
		 * }}
		 */
		const body = req.body;

		if (!id) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};

		const itemRef = database.ref(`items/${id}`);
		const snapshot = await itemRef.once('value');
		const item = snapshot.val();
		if (!item) {
			res.status(404).send({ message: 'Item not found' });
			return;
		};

		if (body.name) {
			if (body.name === '') {
				res.status(400).send({ message: 'Invalid name' });
				return;
			};
			item.name = body.name;
		};

		if (body.price !== undefined && body.price !== null && parseFloat(body.price) >= 0) {
			item.price = parseFloat(body.price);
			if (item.price < 0) {
				res.status(400).send({ message: 'Invalid price' });
				return;
			};
		};

		if (body.stock !== undefined && body.stock !== null) {
			if (body.stock < 0) {
				res.status(400).send({ message: 'Invalid stock' });
				return;
			};
			item.stock = body.stock;
		};
		if (body.barcode) {
			if (body.barcode === '') {
				res.status(400).send({ message: 'Invalid barcode' });
				return;
			};
			const snapshot = await database.ref('items').once('value');
			const items = snapshot.val();
			if (Object.values(items).find(item => item.barcode === body.barcode)) {
				res.status(400).send({ message: 'Barcode already used' });
				return;
			};
			item.barcode = body.barcode;
		};

		if (!body.name && (body.price === undefined || body.price === null || parseFloat(body.price) <= 0) && (body.stock === undefined || body.stock === null) && !body.barcode) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};

		await itemRef.set(item);

		res.send(item || {});

		// Send the updated item to all connected clients
		for (const ws of wsConnections) {
			const Authorization = req.headers.authorization || req.headers.Authorization || '';
			const [id, sessionKey] = (Authorization).split(' ');

			if (ws.page === `supplyCategories/${item.categoryID}`) {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: `supplyCategories/${item.categoryID}`
				}));
			};
		};

		// Create History entry
		const historyRef = database.ref('history').push();
		await historyRef.set({
			route: 'supply',
			subroute: 'items',
			action: 'update',
			date: new Date().toISOString(),
			actor: req.user || {},
			summary: `Updated item "${item.name}" with id "${item.id}" in category "${item.categoryID}"`
		});
	});
	supply.delete('/items/:id', async (req, res) => {
		const id = req.params.id;

		if (!id) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};

		const itemRef = database.ref(`items/${id}`);
		const snapshot = await itemRef.once('value');
		const item = snapshot.val();
		if (!item) {
			res.status(404).send({ message: 'Item not found' });
			return;
		};

		const categoryID = item.categoryID;

		await itemRef.remove();

		res.send(item || {});

		// Send the deleted item to all connected clients
		for (const ws of wsConnections) {
			const Authorization = req.headers.authorization || req.headers.Authorization || '';
			const [id, sessionKey] = (Authorization).split(' ');

			if (ws.page === `supplyCategories/${categoryID}`) {
				if (ws.credentials.sessionKey === sessionKey) continue;

				ws.ws.send(JSON.stringify({
					type: 'refresh',
					from: `supplyCategories/${categoryID}`
				}));
			};
		};

		// Create History entry
		const historyRef = database.ref('history').push();
		await historyRef.set({
			route: 'supply',
			subroute: 'items',
			action: 'delete',
			date: new Date().toISOString(),
			actor: req.user || {},
			summary: `Deleted item "${item.name}" with id "${item.id}" in category "${item.categoryID}"`
		});
	});
	supply.search('/barcode', async (req, res) => {
		// /api/supply/barcode?barcode=1234567890
		const barcode = req.query.barcode;

		if (!barcode) {
			res.status(400).send({ message: 'Invalid request body' });
			return;
		};

		const snapshot = await database.ref('items').once('value');
		const items = snapshot.val();
		if (!items) {
			res.status(404).send({ message: 'Item not found' });
			return;
		};
		const item = Object.values(items).find(item => item.barcode === barcode);
		if (!item) {
			res.status(404).send({ message: 'Item not found' });
			return;
		};

		res.send(item || {});
	});

	return supply;
};