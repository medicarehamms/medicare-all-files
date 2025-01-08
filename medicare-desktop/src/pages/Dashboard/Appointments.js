import React from 'react';

import '../../css/dashboard.css';
import '../../css/dashboard/appointments.css';

import Header from '../../components/Header';
import Button from '../../components/Button';

import globals from '../../utils/globals';

class Appointments extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			appointments: [],
			loaded: false
		};
	};

	async getAppointments() {
		const appointmentsResponse = await fetch(`${globals.backendURL}/api/appointments`, {
			method: 'GET'
		});

		if (appointmentsResponse.status === 200) {
			const appointmentsData = await appointmentsResponse.json();
			const appointments = [];
			for (const id in appointmentsData) {
				const appointment = appointmentsData[id];

				appointments.push({
					id,
					appointment: appointment.appointment,
					patient: appointment.patient,
					user: {
						id: appointment.user.id,
						name: '',
						email: ''
					},
					created: (() => {
						const date = new Date(appointment.created);
						const year = date.getFullYear();
						const month = date.getMonth() + 1;
						const day = date.getDate();
						return `${year}-${month}-${day}`;
					})()
				});
			};

			const requesterIds = appointments.map(appointment => appointment.user.id);
			console.log(requesterIds);

			const requestersResponse = await fetch(`${globals.backendURL}/api/users/bulk`, {
				method: 'POST',
				body: JSON.stringify({
					ids: requesterIds
				})
			});

			if (requestersResponse.status === 200) {
				const requestersResponseData = await requestersResponse.json();
				const user = [];
				for (const id in requestersResponseData) {
					const requester = requestersResponseData[id];
					user.push({
						id: requester.id,
						name: requester.name,
						email: requester.email
					});
				};

				for (const appointment of appointments) {
					const requester = user.find(u => u.id === appointment.user.id);
					if (requester) {
						appointment.user.name = requester.name;
						appointment.user.email = requester.email;
					};
				};
			};

			this.setState({
				appointments: appointments
			});
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

		this.getAppointments();

		const subscribe = async () => {
			globals.ws.send(JSON.stringify({
				type: 'subscribe',
				page: 'appointments'
			}));
	
			globals.ws.onmessage = (event) => {
				const data = JSON.parse(event.data) ?? {};
				if (data.type === 'refresh' && data.from === 'appointments') {
					this.getAppointments();
					console.log('Appointments Refreshed');
	
					if (Notification.permission === 'granted') {
						new Notification('Appointment Update!', {
							body: 'Appointments have been updated.',
							icon: 'https://firebasestorage.googleapis.com/v0/b/medicare-a38ad.appspot.com/o/assets%2FIcon.png?alt=media',
							badge: 'https://firebasestorage.googleapis.com/v0/b/medicare-a38ad.appspot.com/o/assets%2FIcon.png?alt=media',
							tag: 'appointments'
						});
					};
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

	componentDidUpdate() {
		if (!this.state.loaded) return;

		const table = document.querySelector('#appointmentsPanel table');
		const thead = table.querySelector('thead');
		const th = thead.querySelectorAll('th:not(:last-child)');
		const tbody = table.querySelector('tbody');
		const tr = tbody.querySelectorAll('tr');
		for (const thElement of th) {
			thElement.onclick = () => {
				const index = [...th].indexOf(thElement);
				const order = thElement.getAttribute('data-order');
				const sort = (a, b) => {
					if (order === 'asc') {
						if (a.children[index]?.innerText < b.children[index]?.innerText) {
							return -1;
						} else if (a.children[index]?.innerText > b.children[index]?.innerText) {
							return 1;
						} else {
							return 0;
						};
					} else {
						if (a.children[index]?.innerText < b.children[index]?.innerText) {
							return 1;
						} else if (a.children[index]?.innerText > b.children[index]?.innerText) {
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

				if (thElement.innerText !== 'Status') {
					const grouped = sorted.reduce((acc, trElement) => {
						const status = trElement.getAttribute('status');
						if (!acc[status]) acc[status] = [];
						acc[status].push(trElement);
						return acc;
					}, {});

					const orderedStatuses = ['pending', 'approved', 'rejected'];
					for (const status of orderedStatuses) {
						if (grouped[status]) {
							for (const trElement of grouped[status]) {
								tbody.appendChild(trElement);
							};
						};
					};
				} else {
					for (const trElement of sorted) {
						tbody.appendChild(trElement);
					};
				};
			};
		};

		th[0].click();
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
										<b><a href='#/dashboard/appointments'>Appointments</a></b>
										<a href='#/dashboard/patients'>Patients</a>
										<a href='#/dashboard/history'>History</a>
									</>
								) : (
									<>
										<a href='#/dashboard/supply'>Supply</a>
										<b><a href='#/dashboard/appointments'>Appointments</a></b>
										<a href='#/dashboard/doctors'>Doctors</a>
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
							// Deauthenticate user
							await globals.deauthenticateUser();
						}}
					/>
				</Header>
				<main
					className='dashboardMain'
					id='appointments'
				>
					{
						this.state.loaded ? (
							<>
								<div
									id='head'
								>
									<h1>Appointments</h1>
									<Button
										id='backButton'
										type='button'
										label='Back'
										onClick={() => {
											window.location.hash = '#/dashboard/';
										}}
									/>
								</div>
								<div
									id='appointmentsPanel'
								>
									<table>
										<thead>
											<tr>
												<th>
													Date
												</th>
												<th>
													Time
												</th>
												<th>
													Patient
												</th>
												<th>
													Service
												</th>
												<th>
													Date Created
												</th>
												{
													localStorage.getItem('credentials') ? (
														JSON.parse(localStorage.getItem('credentials')).type === 'staff'
															? (
																<th>
																	Requester
																</th>
															) : null
													) : null
												}
												<th>
													Status
												</th>
												<th>
													Actions
												</th>
											</tr>
										</thead>
										<tbody>
											{
												this.state.appointments.map((appointment, index) => {
													return (
														<tr
															key={index}
															id={appointment.id}
															status={appointment.appointment.status}
														>
															<td>
																{appointment.appointment.date}
															</td>
															<td>
																{appointment.appointment.time}
															</td>
															<td>
																<p>{appointment.patient.name}</p>
																<p>{appointment.patient.age} - {appointment.patient.gender}</p>
															</td>
															<td>
																{
																	appointment.appointment.service
																		.charAt(0).toUpperCase() + appointment.appointment.service.slice(1)
																}
															</td>
															<td>
																{appointment.created}
															</td>
															{
																localStorage.getItem('credentials') ? (
																	JSON.parse(localStorage.getItem('credentials')).type === 'staff'
																		? (
																			<td
																				onClick={() => {
																					window.location.hash = `#/dashboard/users/${appointment.user.id}`;
																				}}
																				className='clickable'
																				id='requester'
																			>
																				<p>{appointment.user.name}</p>
																				<p>{appointment.user.email}</p>
																				<p><i>{appointment.user.id}</i></p>
																			</td>
																		) : null
																) : null
															}
															<td
																colSpan={appointment.appointment.status === 'pending' ? 1 : 2}
																className={appointment.appointment.status}
															>
																<span style={{ fontSize: 0 }}>
																	{
																		appointment.appointment.status === 'pending'
																			? 1 : appointment.appointment.status === 'approved'
																				? 2 : 3
																	}
																</span>
																{
																	appointment.appointment.status === 'rejected' ? (
																		<span>
																			<h6>rejected:</h6>
																			<p>{appointment.appointment.rejectedReason}</p>
																		</span>
																	) : appointment.appointment.status
																}
															</td>
															{
																appointment.appointment.status === 'pending' ? (
																	<td>
																		<div>
																			<Button
																				id='approveButton'
																				type='button'
																				label='✔'
																				size='tiny'
																				onClick={async () => {
																					const response = await fetch(`${globals.backendURL}/api/appointments/approve/${appointment.id}`, {
																						method: 'POST',
																					});

																					if (response.status === 200) {
																						const appointments = this.state.appointments;
																						const index = appointments.findIndex(a => a.id === appointment.id);
																						appointments[index].appointment.status = 'approved';
																						this.setState({
																							appointments
																						});
																					} else {
																						globals.Swal.fire({
																							title: '<h1>Error</h1>',
																							html: '<p>Failed to approve appointment.</p>',
																							confirmButtonColor: 'var(--color-primary)',
																							icon: 'error',
																							color: 'var(--color-font-dark)'
																						});
																					};
																				}}
																			/>
																			<Button
																				id='rejectButton'
																				type='button'
																				label='✖'
																				size='tiny'
																				onClick={async () => {
																					globals.Swal.fire({
																						title: '<h1>Reject Appointment</h1>',
																						html: `
<style>
	#rejectAppointmentForm {
		padding: 2rem;

		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 2rem;

		text-align: center;
	}

	#rejectAppointmentForm textarea {
		width: 100%;
		height: 10rem;
	}
</style>
<div id="rejectAppointmentForm">
	<p>Please provide a reason for rejecting the appointment.</p>
	<textarea class="input" id="reason" placeholder="Reason"></textarea>
</div>
																						`,
																						width: '60rem',
																						showCancelButton: true,
																						confirmButtonText: 'Submit',
																						confirmButtonColor: 'var(--color-primary)',
																						cancelButtonText: 'Cancel',
																						cancelButtonColor: 'var(--color-font-dark)'
																					}).then(async (result) => {
																						if (result.isConfirmed) {
																							const reason = document.querySelector('#rejectAppointmentForm #reason').value;
																							const response = await fetch(`${globals.backendURL}/api/appointments/reject/${appointment.id}`, {
																								method: 'POST',
																								body: JSON.stringify({
																									reason
																								})
																							});

																							if (response.status === 200) {
																								const appointments = this.state.appointments;
																								const index = appointments.findIndex(a => a.id === appointment.id);
																								appointments[index].appointment.status = 'rejected';
																								this.setState({
																									appointments
																								});
																								this.getAppointments();
																							} else {
																								globals.Swal.fire({
																									title: '<h1>Error</h1>',
																									html: '<p>Failed to reject appointment.</p>',
																									confirmButtonColor: 'var(--color-primary)',
																									icon: 'error',
																									color: 'var(--color-font-dark)'
																								});
																							};
																						}
																					});
																				}}
																			/>
																		</div>
																	</td>
																) : null
															}
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

export default Appointments;