import React from 'react';

import '../../css/dashboard.css';
import '../../css/dashboard/patients.css';

import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';

import globals from '../../utils/globals';

class Patients extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			patients: [],
			loaded: false
		};
	};

	async componentDidMount() {
		if (!(await globals.checkAuthentication())) {
			localStorage.clear();
			window.location.hash = '#/';
			return;
		};

		this.setState({
			loaded: true
		});

		this.getPatients();

		const subscribe = async () => {
			globals.ws.send(JSON.stringify({
				type: 'subscribe',
				page: 'patients'
			}));
	
			globals.ws.onmessage = (event) => {
				const data = JSON.parse(event.data) ?? {};
				if (data.type === 'refresh' && data.from === 'patients') {
					this.getPatients();
				};
			};
		};
		globals.ws.addEventListener('open', subscribe);
		globals.ws.addEventListener('close', () => {
			setTimeout(() => {
				subscribe();
			}, 5000);
		});
		subscribe();
	};

	async getPatients() {
		const response = await fetch(`${globals.backendURL}/api/patients`, {
			method: 'GET'
		});

		if (response.status === 200) {
			const data = await response.json();
			const patients = [];
			for (const id in data) {
				const patient = data[id];
				patients.push({
					id: id,
					name: patient.name,
					email: patient.email
				});
			};
			console.log(patients);

			this.setState({
				patients: patients
			});
		} else {
			globals.Swal.fire({
				icon: 'error',
				title: 'An error occurred',
				text: 'Please try again later.'
			});
		};
	};

	componentDidUpdate() {
		if (!this.state.loaded) return;

		const table = document.querySelector('#patientsPanel table');
		const thead = table.querySelector('thead');
		const th = thead.querySelectorAll('th');
		const tbody = table.querySelector('tbody');
		const tr = tbody.querySelectorAll('tr');
		for (const thElement of th) {
			thElement.onclick = () => {
				const index = [...th].indexOf(thElement);
				const order = thElement.getAttribute('data-order');
				const sort = (a, b) => {
					if (order === 'asc') {
						if (a.children[index].innerHTML < b.children[index].innerHTML) {
							return -1;
						} else if (a.children[index].innerHTML > b.children[index].innerHTML) {
							return 1;
						} else {
							return 0;
						};
					} else {
						if (a.children[index].innerHTML < b.children[index].innerHTML) {
							return 1;
						} else if (a.children[index].innerHTML > b.children[index].innerHTML) {
							return -1;
						} else {
							return 0;
						};
					};
				};

				const sorted = [...tr].sort(sort);
				if (order === 'asc') {
					thElement.setAttribute('data-order', 'desc');
				} else {
					thElement.setAttribute('data-order', 'asc');
				};

				for (const trElement of tr) {
					tbody.removeChild(trElement);
				};

				for (const trElement of sorted) {
					tbody.appendChild(trElement);
				};
			};
		};
	};

	render() {
		return (
			<>
				<Header>
					{
						localStorage.getItem('credentials') ? (
							JSON.parse(localStorage.getItem('credentials')).type === 'doctor'
								? (
									<>
										<a href='#/dashboard/appointments'>Appointments</a>
										<b><a href='#/dashboard/patients'>Patients</a></b>
										<a href='#/dashboard/history'>History</a>
									</>
								) : (
									<>
										<a href='#/dashboard/supply'>Supply</a>
										<a href='#/dashboard/appointments'>Appointments</a>
										<a href='#/dashboard/doctors'>Doctors</a>
										<a href='#/dashboard/users'>Users</a>
										<b><a href='#/dashboard/patients'>Patients</a></b>
										<a href='#/dashboard/history'>History</a>
									</>
								)
						) : null
					}
					<Button
						id='signOutButton'
						type='button'
						label='Sign Out'
						onClick={async () => {
							// Deauthenticate user
							await globals.deauthenticateUser();
						}}
					/>
				</Header>
				<main
					className='dashboardMain'
					id='patients'
				>
					{
						this.state.loaded ? (
							<>
								<div
									id='head'
								>
									<h1>Patients</h1>
									<Input
										id='search'
										type='search'
										placeholder='Search (ID, Name, Email)'

										onChange={(event) => {
											const query = event.target.value.toLowerCase();
											const patients = this.state.patients;
											const filtered = patients.filter((patient) => {
												return patient.id.toLowerCase().includes(query) || patient.name.toLowerCase().includes(query) || patient.email.toLowerCase().includes(query);
											});

											const tbody = document.querySelector('#patientsPanel table tbody');
											const tr = tbody.querySelectorAll('tr');
											for (const trElement of tr) {
												if (filtered.map((patient) => patient.id).includes(trElement.id)) {
													trElement.style.display = '';
												} else {
													trElement.style.display = 'none';
												};
											};
										}}
									/>
									<div>
										<Button
											id='addButton'
											type='button'
											label='Add Patient'

											onClick={() => {
												window.location.hash = '#/dashboard/patients/addPatient';
											}}
										/>
										<Button
											id='backButton'
											type='button'
											label='Back'
											onClick={() => {
												window.location.hash = '#/dashboard/';
											}}
										/>
									</div>
								</div>
								<div
									id='patientsPanel'
								>
									<table>
										<thead>
											<tr>
												<th>
													ID
												</th>
												<th>
													Name
												</th>
												<th>
													Email
												</th>
												<th>
													Actions
												</th>
											</tr>
										</thead>
										<tbody>
											{
												this.state.patients.map((patient, index) => (
													<tr
														key={index}
														id={patient.id}
													>
														<td>
															{patient.id}
														</td>
														<td>
															{patient.name}
														</td>
														<td>
															{patient.email}
														</td>
														<td>
															<Button
																id='viewButton'
																type='button'
																label='View'

																onClick={() => {
																	window.location.hash = `#/dashboard/patients/${patient.id}`;
																}}
															/>
														</td>
													</tr>
												))
											}
										</tbody>
									</table>
								</div>
							</>
						) : null
					}
				</main>
			</>
		);
	};
};

export default Patients;