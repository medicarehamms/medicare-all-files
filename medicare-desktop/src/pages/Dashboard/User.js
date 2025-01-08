import React from 'react';
import Swal from 'sweetalert2';

import '../../css/dashboard.css';
import '../../css/dashboard/user.css';

import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';

import globals from '../../utils/globals';

class User extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			profile: {
				avatar: '',
				gender: '',
				birthday: '',
				phone: '',
			},
			name: '',
			id: '',
			email: '',
			membership: {
				rfid: '',
				until: null
			},
			appointmentHistory: [
				{
					appointment: {
						date: '',
						service: '',
						status: '',
						time: ''
					},
					created: '',
					id: '',
					patient: {
						age: '',
						gender: '',
						name: '',
						phone: ''
					},
					user: {
						id: ''
					}
				}
			],
			doNotChangeProfile: true,
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

		const user = await this.getUser();
		await this.getAppointments();
		await this.checkExpiration(user);

		const subscribe = async () => {
			globals.ws.send(JSON.stringify({
				type: 'subscribe',
				page: `users/${user.id}`
			}));
	
			globals.ws.onmessage = async (event) => {
				const data = JSON.parse(event.data) ?? {};
				if (data.type === 'refresh' && data.from === `users/${user.id}`) {
					console.log('Refreshing user data...');
	
					const user = await this.getUser();
					await this.getAppointments();
					await this.checkExpiration(user);
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

	async checkExpiration(user) {
		if (!user.membership.until)
			return;

		// Check if membership is expired
		const until = new Date(user.membership.until);
		const today = new Date();
		const expiryString = until.toISOString().split('T')[0];
		const todayString = today.toISOString().split('T')[0];

		console.log(expiryString, todayString);

		if (expiryString < todayString) {
			console.log('Membership expired');

		};
	};

	async getAppointments() {
		const userID = (() => {
			const path = window.location.hash;
			const id = path.split('/')[3];
			return id.charAt(0).toUpperCase() + id.slice(1);
		})();

		const response = await fetch(`${globals.backendURL}/api/appointments/user/${userID}`);

		if (response.status === 200) {
			const data = await response.json();
			const appointmentHistory = [];
			for (const id in data) {
				const appointment = data[id];
				const appointmentData = {
					appointment: {
						date: appointment.appointment.date,
						service: appointment.appointment.service,
						status: appointment.appointment.status,
						time: appointment.appointment.time
					},
					created: appointment.created,
					id: appointment.id,
					patient: {
						age: appointment.patient.age,
						gender: appointment.patient.gender,
						name: appointment.patient.name,
						phone: appointment.patient.phone
					},
					user: {
						id: appointment.user.id
					}
				};
				appointmentHistory.push(appointmentData);
			};
			console.log(appointmentHistory);
			this.setState({
				appointmentHistory: appointmentHistory
			});
		} else {
			globals.Swal.fire({
				title: '<h1>Error</h1>',
				html: '<p>Failed to get appointment history.</p>',
				confirmButtonColor: 'var(--color-primary)',
				icon: 'error',
				color: 'var(--color-font-dark)'
			});
		};
	};

	async getUser() {
		const userID = (() => {
			const path = window.location.hash;
			const id = path.split('/')[3];
			return id.charAt(0).toUpperCase() + id.slice(1);
		})();

		const response = await fetch(`${globals.backendURL}/api/users/${userID}`, {
			method: 'GET'
		});

		if (response.status === 200) {
			const data = await response.json();
			console.log(data);

			const user = {
				profile: {
					avatar: data.profile?.avatar,
					gender: data.profile?.gender,
					birthday: data.profile?.birthday,
					phone: data.profile?.phone,
				},
				name: data.name,
				id: data.id,
				email: data.email,
				membership: {
					rfid: data.membership?.rfid,
					until: data.membership?.until
				}
			};
			this.setState(user);
			return user;
		} else {
			await globals.Swal.fire({
				title: '<h1>Error</h1>',
				html: '<p>Failed to get user.</p>',
				confirmButtonColor: 'var(--color-primary)',
				icon: 'error',
				color: 'var(--color-font-dark)'
			});
			window.location.hash = '#/dashboard/users';
		};
	};

	componentDidUpdate() {
		if (!this.state.loaded) return;

		const table = document.querySelector('#historyPanel table');
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
										<a href='#/dashboard/doctors'>Doctors</a>
										<b><a href='#/dashboard/users'>Users</a></b>
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
					id='user'
				>
					{
						this.state.loaded ? (
							<>
								<div id='head'>
									<h1>User Profile</h1>

									<Button
										id='backButton'
										type='button'
										label='Back'
										onClick={() => {
											window.location.hash = '#/dashboard/users';
										}}
									/>
								</div>
								<div
									id='userPanel'
								>
									<div>
										<img
											id='avatar'
											alt='Profile Picture'
											src={this.state.profile?.avatar || 'https://via.placeholder.com/200'}

											onClick={() => {
												document.getElementById('profilePictureInput').click();
											}}
										/>

										<input
											type='file'
											accept='image/*'
											id='profilePictureInput'
											onChange={(event) => {
												const file = event.target.files[0];
												const reader = new FileReader();
												reader.onload = (event) => {
													this.setState({
														profile: {
															avatar: event.target.result,
															gender: this.state.profile?.gender,
															birthday: this.state.profile?.birthday,
															phone: this.state.profile?.phone
														},
														doNotChangeProfile: false
													});
												};
												reader.readAsDataURL(file);
											}}
										/>

										<Button
											id='changeImageButton'
											type='button'
											label='Change Avatar'
											onClick={() => {
												document.getElementById('profilePictureInput').click();
											}}
										/>

										<Button
											id='deleteImageButton'
											type='button'
											label='Delete Image'
											onClick={() => {
												this.setState({
													profile: {
														avatar: '',
														gender: this.state.profile?.gender,
														birthday: this.state.profile?.birthday,
														phone: this.state.profile?.phone
													}
												});
											}}
										/>
									</div>

									<div>
										<Input
											id='nameInput'
											type='text'
											label='Name'
											value={this.state.name}
											defaultValue={this.state.name}
											required={true}
											onChange={(event) => {
												this.setState({
													name: event.target.value
												});
											}}
										/>
										<span
											id='rfidSpan'
										>
											<span>
												<Input
													id='rfidInput'
													type='password'
													label='Membership RFID'
													value={this.state.membership?.rfid}
													defaultValue={this.state.membership?.rfid}
													disabled={true}
												/>
												<Input
													id='expirationInput'
													type='date'
													label='Expiration'
													disabled={this.state.membership?.rfid ? false : true}
													value={this.state.membership?.until}
													defaultValue={this.state.membership?.until}
													onBlur={(event) => {
														this.setState({
															membership: {
																rfid: this.state.membership.rfid,
																until: event.target.value
															}
														});
													}}
												/>
											</span>
											<span>
												{
													!this.state.membership.rfid ? (
														<Button
															id='scanRFIDButton'
															type='button'
															label='Register Membership'
															onClick={() => {
																setTimeout(() => {
																	document.getElementById('membershipRfidInput').focus();
																}, 10);
																globals.Swal.fire({
																	title: '<h1>Register Membership</h1>',
																	html: `
<style>
	#scanRFIDForm {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2rem;
	}
</style>
<div id="scanRFIDForm">
	<p>Scan RFID card to register membership.</p>

	<input
		id="membershipRfidInput"
		class="input"
		type="password"
		placeholder="RFID"
		onKeyDown="((event) => {
			if (event.key === 'Enter') {
				const barcode = event.target.value;
				const confirmButton = document.querySelector('.swal2-confirm');
				confirmButton.click();
			};
			if (event.key === 'Escape')
				event.target.blur();
		})(event);"
		onBlur="((event) => {
			setTimeout(() => {
				try {
					const cancelButton = document.querySelector('.swal2-cancel');
					cancelButton.click();
				} catch (error) { };
			}, 250);
		})(event);"
	/>
</div>
`,
																	width: '60rem',
																	showCancelButton: true,
																	confirmButtonText: 'Scan',
																	confirmButtonColor: 'var(--color-primary)',
																	showConfirmButton: true,
																	cancelButtonText: 'Cancel',
																	cancelButtonColor: 'var(--color-font-dark)'
																}).then(async (result) => {
																	if (result.isConfirmed) {
																		const rfid = document.getElementById('membershipRfidInput').value;
																		if (!rfid || rfid === '') {
																			globals.Swal.fire({
																				title: '<h1>Error</h1>',
																				html: '<p>RFID cannot be empty.</p>',
																				confirmButtonColor: 'var(--color-primary)',
																				icon: 'error',
																				color: 'var(--color-font-dark)'
																			});
																			return;
																		};

																		this.setState({
																			membership: {
																				rfid: rfid,
																				// date 6 months from now
																				until: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0]
																			}
																		});
																	};
																});
															}}
														/>
													) : (
														<>
															<Button
																type='button'
																label='Change RFID'
																onClick={() => {
																	globals.Swal.fire({
																		title: '<h1>Change RFID</h1>',
																		html: `
<style>
	#scanRFIDForm {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2rem;
	}
</style>
<div id="scanRFIDForm">
	<p>Scan RFID card to register membership.</p>

	<input
		id="membershipRfidInput"
		class="input"
		type="password"
		placeholder="RFID"
		onKeyDown="((event) => {
			if (event.key === 'Enter') {
				const barcode = event.target.value;
				const confirmButton = document.querySelector('.swal2-confirm');
				confirmButton.click();
			};
			if (event.key === 'Escape')
				event.target.blur();
		})(event);"
	/>
</div>
`,
																		width: '60rem',
																		showCancelButton: true,
																		confirmButtonText: 'Scan',
																		confirmButtonColor: 'var(--color-primary)',
																		showConfirmButton: true,
																		cancelButtonText: 'Cancel',
																		cancelButtonColor: 'var(--color-font-dark)'
																	}).then(async (result) => {
																		if (result.isConfirmed) {
																			const rfid = document.getElementById('membershipRfidInput').value;
																			if (!rfid || rfid === '') {
																				globals.Swal.fire({
																					title: '<h1>Error</h1>',
																					html: '<p>RFID cannot be empty.</p>',
																					confirmButtonColor: 'var(--color-primary)',
																					icon: 'error',
																					color: 'var(--color-font-dark)'
																				});
																				return;
																			};

																			this.setState({
																				membership: {
																					rfid: rfid,
																					// same until date
																					until: this.state.membership.until
																				}
																			});
																		};
																	});
																}}
															/>
															<Button
																type='button'
																label='Delete Membership'
																onClick={() => {
																	this.setState({
																		membership: {
																			rfid: '',
																			until: null
																		}
																	});
																}}
															/>
														</>
													)
												}
											</span>
										</span>
										<Input
											id='genderInput'
											type='dropdown'
											label='Gender'
											options={[
												'Male',
												'Female',
												'Other',
												'N/A'
											]}
											value={this.state.profile?.gender ? this.state.profile.gender.charAt(0).toUpperCase() + this.state.profile.gender.slice(1) : 'N/A'}
											defaultValue={this.state.profile?.gender ? this.state.profile.gender.charAt(0).toUpperCase() + this.state.profile.gender.slice(1) : 'N/A'}
											onFocus={(event) => {
												this.setState({
													profile: {
														avatar: this.state.profile.avatar,
														gender: event.target.value,
														birthday: this.state.profile.birthday,
														phone: this.state.profile.phone
													}
												});
											}}
											onBlur={(event) => {
												this.setState({
													profile: {
														avatar: this.state.profile.avatar,
														gender: event.target.value,
														birthday: this.state.profile.birthday,
														phone: this.state.profile.phone
													}
												});
											}}
											onChange={(event) => {
												this.setState({
													profile: {
														avatar: this.state.profile.avatar,
														gender: event.target.value,
														birthday: this.state.profile.birthday,
														phone: this.state.profile.phone
													}
												});
											}}
										/>
										<Input
											id='birthdayInput'
											type='date'
											label='Birthday'
											value={this.state.profile?.birthday}
											defaultValue={this.state.profile?.birthday}
											onBlur={(event) => {
												if (!event.target.value || event.target.value === '') {
													this.setState({
														profile: {
															avatar: this.state.profile?.avatar,
															gender: this.state.profile?.gender,
															birthday: '',
															phone: this.state.profile?.phone
														}
													});
												};
												this.setState({
													profile: {
														avatar: this.state.profile?.avatar,
														gender: this.state.profile?.gender,
														birthday: event.target.value,
														phone: this.state.profile?.phone
													}
												});
											}}
											onFocus={(event) => {
												if (!event.target.value || event.target.value === '') {
													this.setState({
														profile: {
															avatar: this.state.profile?.avatar,
															gender: this.state.profile?.gender,
															birthday: '',
															phone: this.state.profile?.phone
														}
													});
												};
												this.setState({
													profile: {
														avatar: this.state.profile?.avatar,
														gender: this.state.profile?.gender,
														birthday: event.target.value,
														phone: this.state.profile?.phone
													}
												});
											}}
											onChange={(event) => {
												if (!event.target.value || event.target.value === '') {
													this.setState({
														profile: {
															avatar: this.state.profile?.avatar,
															gender: this.state.profile?.gender,
															birthday: '',
															phone: this.state.profile?.phone
														}
													});
												};
												this.setState({
													profile: {
														avatar: this.state.profile?.avatar,
														gender: this.state.profile?.gender,
														birthday: event.target.value,
														phone: this.state.profile?.phone
													}
												});
											}}
										/>
										<Input
											id='emailInput'
											type='email'
											label='Email'
											value={this.state.email}
											defaultValue={this.state.email}
											required={true}
											onChange={(event) => {
												this.setState({
													email: event.target.value
												});
											}}
										/>
										<Input
											id='phoneInput'
											type='tel'
											label='Phone'
											value={this.state.profile?.phone}
											defaultValue={this.state.profile?.phone}
											onFocus={(event) => {
												this.setState({
													profile: {
														avatar: this.state.profile?.avatar,
														gender: this.state.profile?.gender,
														birthday: this.state.profile?.birthday,
														phone: event.target.value
													}
												});
											}}
											onBlur={(event) => {
												this.setState({
													profile: {
														avatar: this.state.profile?.avatar,
														gender: this.state.profile?.gender,
														birthday: this.state.profile?.birthday,
														phone: event.target.value
													}
												});
											}}
											onChange={(event) => {
												this.setState({
													profile: {
														avatar: this.state.profile?.avatar,
														gender: this.state.profile?.gender,
														birthday: this.state.profile?.birthday,
														phone: event.target.value
													}
												});
											}}
										/>

										<div>
											<Button
												id='updateButton'
												type='button'
												label='Update'
												onClick={async (event) => {
													event.target.disabled = true;
													const userID = (() => {
														const path = window.location.hash;
														const id = path.split('/')[3];
														return id.charAt(0).toUpperCase() + id.slice(1);
													})();
													const data = {
														profile: {
															avatar: this.state.profile?.avatar,
															gender: this.state.profile?.gender === 'N/A' ? '' : this.state.profile?.gender,
															birthday: this.state.profile?.birthday,
															phone: this.state.profile?.phone
														},
														name: this.state.name,
														email: this.state.email,
														membership: {
															rfid: this.state.membership?.rfid,
															until: this.state.membership?.until
														},
														doNotChangeProfile: this.state.doNotChangeProfile
													};
													for (const key in data) {
														if (data[key] === '')
															data[key] = null;
														if (typeof data[key] === 'object') {
															for (const subKey in data[key]) {
																if (data[key][subKey] === '')
																	data[key][subKey] = null;
															};
														};
													};
													// Require name and email
													if (!data.name || !data.email) {
														event.target.disabled = false;
														return;
													};
													console.log(data);
													const response = await fetch(`${globals.backendURL}/api/users/${userID}`, {
														method: 'PATCH',
														body: JSON.stringify(data)
													});
													if (response.status === 200) {
														window.location.hash = '#/dashboard/users';
													} else {
														globals.Swal.fire({
															title: '<h1>Error</h1>',
															html: '<p>Failed to update user.</p>',
															confirmButtonColor: 'var(--color-primary)',
															icon: 'error',
															color: 'var(--color-font-dark)'
														});
													};
													event.target.disabled = false;
												}}
											/>
											<Button
												id='deleteButton'
												type='button'
												label='Delete'
												onClick={async (event) => {
													event.target.disabled = true;
													await Swal.fire({
														icon: 'warning',
														title: '<h1>Delete User</h1>',
														html: '<p>Are you sure you want to delete this user?</p>',
														showCancelButton: true,
														confirmButtonText: 'Delete',
														confirmButtonColor: 'var(--color-primary)',
														cancelButtonText: 'Cancel',
														cancelButtonColor: 'var(--color-font-dark)'
													}).then(async (result) => {
														if (result.isConfirmed) {
															const userID = (() => {
																const path = window.location.hash;
																const id = path.split('/')[3];
																return id.charAt(0).toUpperCase() + id.slice(1);
															})();
															const response = await fetch(`${globals.backendURL}/api/users/${userID}`, {
																method: 'DELETE'
															});
															
															if (!response.ok) {
																await Swal.fire({
																	title: '<h1>Error</h1>',
																	html: '<p>Failed to delete user.</p>',
																	confirmButtonColor: 'var(--color-primary)',
																	icon: 'error',
																	color: 'var(--color-font-dark)'
																});
															}
															window.location.hash = '#/dashboard/users';
														};
													});
													event.target.disabled = false;
												}}
											/>
										</div>

										<Button
											id='cancelButton'
											type='button'
											label='Cancel'
											onClick={() => {
												window.location.hash = '#/dashboard/users';
											}}
										/>
									</div>

									<div
										id='historyPanel'
									>
										<h2>Appointment History</h2>

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
													<th>
														Status
													</th>
												</tr>
											</thead>
											<tbody>
												{
													this.state.appointmentHistory.map((appointment, index) => {
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
																	{appointment.appointment.service}
																</td>
																<td>
																	{appointment.created}
																</td>
																<td>
																	{appointment.appointment.status}
																</td>
															</tr>
														);
													})
												}
											</tbody>
										</table>
									</div>
								</div>
							</>
						) : null
					}
				</main>
			</>
		);
	};
};

export default User;