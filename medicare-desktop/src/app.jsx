import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import {
	HashRouter,
	Route,
	Routes
} from 'react-router-dom';

import './css/global.css';

import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';

import Dashboard from './pages/Dashboard';

import Supply from './pages/Dashboard/Supply';
import SupplyItems from './pages/Dashboard/SupplyItems';

import Appointments from './pages/Dashboard/Appointments';

import Users from './pages/Dashboard/Users';
import User from './pages/Dashboard/User';

import Doctors from './pages/Dashboard/Doctors';
import Doctor from './pages/Dashboard/Doctor';

import Patients from './pages/Dashboard/Patients';
import AddPatient from './pages/Dashboard/AddPatient';
import Patient from './pages/Dashboard/Patient';

import History from './pages/Dashboard/History';

import globals from './utils/globals';

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			checkedBackendURL: false
		};
	};

	componentDidCatch(error, errorInfo) {
		globals.Swal.fire({
			icon: 'error',
			title: 'An error occurred',
			text: 'Please try again later.'
		});
	};

	async componentDidMount() {
		await new Promise((resolve) => {
			if (this.state.checkedBackendURL) {
				resolve();
				return;
			};

			const abortController = new AbortController();

			fetch(`${globals.backendURL}/api/hello`, {
				signal: abortController.signal
			}).then(() => {
				resolve();
			}).catch(() => {
				globals.backendURL = 'https://medicare-api-8hhx.onrender.com';
				resolve();
			});

			setTimeout(() => {
				abortController.abort();
			}, 5000);
		});

		console.log(`Using API: ${globals.backendURL}`);
		this.setState({
			checkedBackendURL: true
		});

		const originalFetch = window.fetch;
		window.fetch = (url, options) => new Promise((resolve, reject) => {
			const defaultHeaders = {
				'Content-Type': 'application/json',
				'Authorization': `${localStorage.getItem('credentials') ? `${JSON.parse(localStorage.getItem('credentials')).id} ${JSON.parse(localStorage.getItem('credentials')).sessionKey}` : ''}`
			};

			if (options) {
				options.headers = {
					...defaultHeaders,
					...options.headers
				};
			} else {
				options = {
					headers: defaultHeaders
				};
			};

			originalFetch(url, options).then(resolve).catch(reject);
		});

		const connect = () => {
			try {
				globals.ws = new WebSocket(`${globals.backendURL.replace('http', 'ws')}/ws`);
				let connected = false;

				// Modify ws.send to wait for connection before sending
				const originalSend = globals.ws.send.bind(globals.ws);
				globals.ws.send = async (data) => {
					await new Promise((resolve) => {
						if (connected) {
							resolve();
						} else {
							globals.ws.onopen = () => {
								resolve();
							};
						};
					});

					originalSend(data);
				};

				globals.ws.onopen = () => {
					const authenticate = () => {
						if (!localStorage.getItem('credentials')) return;
						originalSend(JSON.stringify({
							type: 'credentials',
							credentials: {
								sessionKey: JSON.parse(localStorage.getItem('credentials')).sessionKey,
								id: JSON.parse(localStorage.getItem('credentials')).id
							}
						}));
						console.log('WebSocket connection established');
						connected = true;
					};
					authenticate();
				};
				globals.ws.onclose = () => {
					console.log('WebSocket connection closed. Reconnecting in 5 seconds...');

					setTimeout(() => {
						globals.ws = null;
						connect();
					}, 5000);
				};
				globals.ws.onerror = (error) => {
					console.error('WebSocket error:', error);
					console.log('Reconnecting in 5 seconds...');

					setTimeout(() => {
						globals.ws = null;
						connect();
					}, 5000);
				};
			} catch (error) {
				console.error('WebSocket error:', error);
				console.log('Reconnecting in 5 seconds...');

				setTimeout(() => {
					globals.ws = null;
					connect();
				}, 5000);
			};
		};

		globals.ws = null;
		connect();
	};

	render() {
		if (!this.state.checkedBackendURL)
			return null;

		return (
			<HashRouter>
				<Routes>
					<Route path='/' element={<Home />} />
					<Route path='/home' element={<Home />} />
					<Route path='/signIn' element={<SignIn />} />
					<Route path='/signUp' element={<SignUp />} />
					<Route path='/forgotPassword' element={<ForgotPassword />} />

					<Route path='/dashboard' element={<Dashboard />} />

					<Route path='/dashboard/supply' element={<Supply />} />
					<Route path='/dashboard/supply/:category' element={<SupplyItems />} />

					<Route path='/dashboard/appointments' element={<Appointments />} />

					<Route path='/dashboard/users' element={<Users />} />
					<Route path='/dashboard/users/:id' element={<User />} />

					<Route path='/dashboard/doctors' element={<Doctors />} />
					<Route path='/dashboard/doctors/:id' element={<Doctor />} />

					<Route path='/dashboard/patients' element={<Patients />} />
					<Route path='/dashboard/patients/:id' element={<Patient />} />
					<Route path='/dashboard/patients/addPatient' element={<AddPatient />} />

					<Route path='/dashboard/history' element={<History />} />
				</Routes>
			</HashRouter>
		);
	};
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);