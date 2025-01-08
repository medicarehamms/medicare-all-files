
import nodemailer from 'nodemailer';

/**
 * @type {{
 * 		ws: WebSocket,
 * 		credentials: {
 * 			sessionKey: String,
 * 			id: String
 * 		},
 * 		page: String | 'supplyCategories' | 'supplyCategories/:id' | 'appointments'
 * }[]}
 */
const wsConnections = [];

/**
 * @type {import('nodemailer').Transporter}
 */
const transporter = nodemailer.createTransport({
	service: 'Gmail',
	host: 'smtp.gmail.com',
	port: 465,
	secure: true,
	auth: {
		user: 'medicare.hamms@gmail.com',
		pass: 'gnpg aqeb sltv gobh',
	}
});

export {
	wsConnections,
	transporter
};