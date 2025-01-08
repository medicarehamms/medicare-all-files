import React from 'react';

import '../../css/dashboard.css';
import '../../css/dashboard/doctors.css';

import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';

import globals from '../../utils/globals';

class Doctors extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			doctors: [],
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

		this.getAppDoctors();

		const subscribe = async () => {

			globals.ws.send(JSON.stringify({
				type: 'subscribe',
				page: 'doctors'
			}));
	
			globals.ws.onmessage = (event) => {
				const data = JSON.parse(event.data) ?? {};
				if (data.type === 'refresh' && data.from === 'doctors') {
					this.getAppDoctors();
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

	async getAppDoctors() {
		const response = await fetch(`${globals.backendURL}/api/doctors`, {
			method: 'GET'
		});

		if (!response.ok) {
			globals.Swal.fire({
				icon: 'error',
				title: 'An error occurred',
				text: 'Please try again later.'
			});
			return;
		};

		const data = await response.json();
		const doctors = [];
		for (const id in data) {
			const doctor = data[id];
			doctors.push({
				email: doctor.email,
				id,
				name: doctor.name
			});
		};
		this.setState({
			doctors: doctors
		});
	};

	componentDidUpdate() {
		if (!this.state.loaded) return;

		const table = document.querySelector('#doctorsPanel table');
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
										<a href='#/dashboard/patients'>Patients</a>
										<a href='#/dashboard/history'>History</a>
									</>
								) : (
									<>
										<a href='#/dashboard/supply'>Supply</a>
										<a href='#/dashboard/appointments'>Appointments</a>
										<b><a href='#/dashboard/doctors'>Doctors</a></b>
										<a href='#/dashboard/users'>Users</a>
										<a href='#/dashboard/patients'>Patients</a>
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
							// Deauthenticate doctor
							await globals.deauthenticateUser();
						}}
					/>
				</Header>
				<main
					className='dashboardMain'
					id='doctors'
				>
					{
						this.state.loaded ? (
							<>
								<div
									id='head'
								>
									<h1>Doctors</h1>
									<Input
										id='search'
										type='search'
										placeholder='Search (ID, Name, Email)'

										onChange={(event) => {
											const query = event.target.value.toLowerCase();
											const doctors = this.state.doctors;
											const filtered = doctors.filter((doctor) => {
												return doctor.id.toLowerCase().includes(query) || doctor.name.toLowerCase().includes(query) || doctor.email.toLowerCase().includes(query);
											});

											const tbody = document.querySelector('#doctorsPanel table tbody');
											const tr = tbody.querySelectorAll('tr');
											for (const trElement of tr) {
												if (filtered.map((doctor) => doctor.id).includes(trElement.id)) {
													trElement.style.display = '';
												} else {
													trElement.style.display = 'none';
												};
											};
										}}
									/>
									<div>
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
									id='doctorsPanel'
								>
									<table>
										<thead>
											<tr>
												<th>ID</th>
												<th>Name</th>
												<th>Email</th>
												<th>Actions</th>
											</tr>
										</thead>
										<tbody>
											{
												this.state.doctors.map((doctor, index) => {
													return (
														<tr
															key={index}
															id={doctor.id}
														>
															<td>{doctor.id}</td>
															<td>{doctor.name}</td>
															<td>{doctor.email}</td>
															<td>
																<Button
																	id='viewButton'
																	type='button'
																	label='View'
																	onClick={() => {
																		window.location.hash = `#/dashboard/doctors/${doctor.id}`;
																	}}
																/>
															</td>
														</tr>
													);
												})
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

export default Doctors;