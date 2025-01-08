import router from 'express';

const hello = router();

/**
 * @type {(
* 		admin: import('firebase-admin'),
* 		database: import('firebase-admin/database').Database,
* 		bucket: import('@google-cloud/storage').Bucket
* ) => import('express').Router}
*/
export default (admin, database, bucket) => {
	hello.get('/', (req, res) => {
		res.send({
			message: 'Hello! from API'
		});
	});

	return hello;
};