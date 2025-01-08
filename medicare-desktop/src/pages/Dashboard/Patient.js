import React from 'react';

import '../../css/dashboard.css';
import '../../css/dashboard/patient.css';

import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';

import globals from '../../utils/globals';
import Swal from 'sweetalert2';

class Patient extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			info: {
				profilePicture: '',
				gender: '',
				birthday: '',
				phone: '',
				address: ''
			},
			name: '',
			id: '',
			email: '',
			medicalRecords: [
				{
					id: '',
					date: '',
					notes: '',
					medications: ''
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

		await this.getPatient();
		this.getMedicalRecords();

		const patientID = (() => {
			const path = window.location.hash;
			const id = path.split('/')[3];
			try {
				return id.charAt(0).toUpperCase() + id.slice(1)
			} catch (error) {
				window.location.hash = '#/dashboard/patients';
			};
		})();

		const subscribe = async () => {
			globals.ws.send(JSON.stringify({
				type: 'subscribe',
				page: `patients/${patientID}`
			}));
	
			globals.ws.onmessage = async (event) => {
				const data = JSON.parse(event.data) ?? {};
				if (data.type === 'refresh' && data.from === `patients/${patientID}`) {
					await this.getPatient();
					await this.getMedicalRecords();
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

	async getPatient() {
		const patientID = (() => {
			const path = window.location.hash;
			const id = path.split('/')[3];
			try {
				return id.charAt(0).toUpperCase() + id.slice(1)
			} catch (error) {
				window.location.hash = '#/dashboard/patients';
			};
		})();

		if (!patientID) {
			window.location.hash = '#/dashboard/patients';
			return;
		};

		const response = await fetch(`${globals.backendURL}/api/patients/${patientID}`);

		if (response.status === 200) {
			const data = await response.json();
			const profilePicture = data.info?.profilePicture;
			if (profilePicture) {
				// Convert the profile picture to a base64 string
				const response = await fetch(profilePicture, {
					method: 'GET',
					headers: {
						'Content-Type': 'image/*'
					}
				});
				if (!response.ok) {
					this.setState({
						info: {
							...this.state.info,
							profilePicture: profilePicture
						}
					});

					return;
				};
				const blob = await response.blob();
				const base64 = await new Promise((resolve) => {
					const reader = new FileReader();
					reader.onloadend = () => {
						resolve(reader.result);
					};
					reader.readAsDataURL(blob);
				});
				data.info.profilePicture = base64;
			};
			this.setState({
				info: {
					profilePicture: data.info?.profilePicture,
					gender: data.info?.gender,
					birthday: data.info?.birthday,
					phone: data.info?.phone,
					address: data.info?.address
				},
				name: data.name,
				id: data.id,
				email: data.email
			});
		} else {
			await globals.Swal.fire({
				title: '<h1>Error</h1>',
				html: '<p>An error occurred. Please try again later.</p>',
				confirmButtonColor: 'var(--color-primary)',
				icon: 'error',
				color: 'var(--color-font-dark)'
			});
			window.location.hash = '#/dashboard/patients';
		};
	};

	async updatePatient() {
		const data = {
			info: {
				profilePicture: this.state.info?.profilePicture,
				gender: this.state.info?.gender,
				birthday: this.state.info?.birthday,
				phone: this.state.info?.phone,
				address: this.state.info?.address
			},
			name: this.state.name,
			email: this.state.email,
			doNotChangeProfile: this.state.doNotChangeProfile
		};

		// Blank out empty fields
		for (const key in data) {
			if (!data[key]) {
				data[key] = '';
			};
			for (const subKey in data[key]) {
				if (!data[key][subKey]) {
					data[key][subKey] = '';
				};
			};
		};
		console.log('data',data);

		const response = await fetch(`${globals.backendURL}/api/patients/${this.state.id}`, {
			method: 'PATCH',
			body: JSON.stringify(data)
		});

		if (response.status === 200) {
			window.location.hash = '#/dashboard/patients';
		} else {
			globals.Swal.fire({
				title: '<h1>Error</h1>',
				html: '<p>An error occurred. Please try again later.</p>',
				confirmButtonColor: 'var(--color-primary)',
				icon: 'error',
				color: 'var(--color-font-dark)'
			});
		};
	};

	async getMedicalRecords() {
		const patientID = (() => {
			const path = window.location.hash;
			const id = path.split('/')[3];
			try {
				return id.charAt(0).toUpperCase() + id.slice(1)
			} catch (error) {
				window.location.hash = '#/dashboard/patients';
			};
		})();
		const response = await fetch(`${globals.backendURL}/api/patients/${patientID}/medicalRecords`);

		if (response.status === 200) {
			const data = await response.json();
			this.setState({
				medicalRecords: data
			});
		} else {
			await globals.Swal.fire({
				title: '<h1>Error</h1>',
				html: '<p>An error occurred. Please try again later.</p>',
				confirmButtonColor: 'var(--color-primary)',
				icon: 'error',
				color: 'var(--color-font-dark)'
			});
		};
	};

	componentDidUpdate() {
		if (!this.state.loaded) return;
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
					id='patient'
					disabled={(() => {
						if (localStorage.getItem('credentials')) {
							if (JSON.parse(localStorage.getItem('credentials')).type !== 'staff') {
								return true;
							};
						};
					})()}
				>
					{
						this.state.loaded ? (
							<>
								<div
									id='head'
									disabled={(() => {
										if (localStorage.getItem('credentials')) {
											if (JSON.parse(localStorage.getItem('credentials')).type !== 'staff') {
												return true;
											};
										};
									})()}
								>
									<h1>Patient</h1>

									<Button
										id='backButton'
										type='button'
										label='Back'
										onClick={() => {
											window.location.hash = '#/dashboard/patients';
										}}
									/>
								</div>
								<div
									id='patientPanel'
									disabled={(() => {
										if (localStorage.getItem('credentials')) {
											if (JSON.parse(localStorage.getItem('credentials')).type !== 'staff') {
												return true;
											};
										};
									})()}
								>
									<div>
										<img
											id='profilePicture'
											disabled={(() => {
												if (localStorage.getItem('credentials')) {
													if (JSON.parse(localStorage.getItem('credentials')).type !== 'staff') {
														return true;
													};
												};
											})()}
											alt='Profile Picture'
											src={this.state.info?.profilePicture || 'https://via.placeholder.com/200'}

											onClick={() => {
												if (localStorage.getItem('credentials')) {
													if (JSON.parse(localStorage.getItem('credentials')).type !== 'staff') {
														document.getElementById('profilePictureInput').click();
													};
												};
											}}
										/>

										{
											localStorage.getItem('credentials') ? (
												JSON.parse(localStorage.getItem('credentials')).type === 'staff'
													? (
														<>
															<input
																type='file'
																accept='image/*'
																id='profilePictureInput'
																disabled={(() => {
																	if (localStorage.getItem('credentials')) {
																		if (JSON.parse(localStorage.getItem('credentials')).type !== 'staff') {
																			return true;
																		};
																	};
																})()}
																onChange={(event) => {
																	const file = event.target.files[0];
																	const reader = new FileReader();
																	reader.onload = (event) => {
																		this.setState({
																			info: {
																				profilePicture: event.target.result,
																				gender: this.state.info?.gender,
																				birthday: this.state.info?.birthday,
																				phone: this.state.info?.phone
																			},
																			doNotChangeProfile: false
																		});
																	};
																	reader.readAsDataURL(file);
																}}
															/>

															<Button
																id='uploadImageButton'
																type='button'
																label='Upload Image'
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
																		info: {
																			profilePicture: '',
																			gender: this.state.info?.gender,
																			birthday: this.state.info?.birthday,
																			phone: this.state.info?.phone
																		}
																	});
																}}
															/>
														</>
													) : null
											) : null
										}
									</div>

									<div>
										<Input
											id='nameInput'
											disabled={(() => {
												if (localStorage.getItem('credentials')) {
													if (JSON.parse(localStorage.getItem('credentials')).type !== 'staff') {
														return true;
													};
												};
											})()}
											type='text'
											label='Name'
											value={this.state.name}
											defaultValue={this.state.name}
											required={(() => {
												if (localStorage.getItem('credentials')) {
													if (JSON.parse(localStorage.getItem('credentials')).type === 'staff') {
														return true;
													};
												};
											})()}
											onBlur={(event) => {
												if (!event.target.value) {
													event.target.value = this.state.name;
												};
												this.setState({
													name: event.target.value
												});
											}}
											onKeyDown={(event) => {
												if (event.key === 'Enter')
													event.target.blur();
											}}
										/>

										<Input
											id='genderInput'
											disabled={(() => {
												if (localStorage.getItem('credentials')) {
													if (JSON.parse(localStorage.getItem('credentials')).type !== 'staff') {
														return true;
													};
												};
											})()}
											type='dropdown'
											label='Gender'
											options={[
												'Male',
												'Female',
												'Other',
												'N/A'
											]}
											value={this.state.info?.gender ? this.state.info.gender : 'N/A'}
											defaultValue={this.state.info?.gender ? this.state.info.gender : 'N/A'}
											onChange={(event) => {
												const info = this.state.info;
												info.gender = event.target.value;
												this.setState({
													info: info
												});
											}}
										/>
										<Input
											id='birthdayInput'
											disabled={(() => {
												if (localStorage.getItem('credentials')) {
													if (JSON.parse(localStorage.getItem('credentials')).type !== 'staff') {
														return true;
													};
												};
											})()}
											type='date'
											label='Birthday'
											value={this.state.info?.birthday}
											defaultValue={this.state.info?.birthday}
											onBlur={(event) => {
												const info = this.state.info;
												info.birthday = event.target.value;
												this.setState({
													info: info
												});
											}}
											onKeyDown={(event) => {
												if (event.key === 'Enter')
													event.target.blur();
											}}
										/>

										<Input
											id='phoneInput'
											disabled={(() => {
												if (localStorage.getItem('credentials')) {
													if (JSON.parse(localStorage.getItem('credentials')).type !== 'staff') {
														return true;
													};
												};
											})()}
											type='tel'
											label='Phone'
											value={this.state.info?.phone}
											defaultValue={this.state.info?.phone}
											onBlur={(event) => {
												const info = this.state.info;
												info.phone = event.target.value;
												this.setState({
													info: info
												});
											}}
											onKeyDown={(event) => {
												if (event.key === 'Enter')
													event.target.blur();
											}}
										/>
										<Input
											id='emailInput'
											disabled={(() => {
												if (localStorage.getItem('credentials')) {
													if (JSON.parse(localStorage.getItem('credentials')).type !== 'staff') {
														return true;
													};
												};
											})()}
											type='email'
											label='Email'
											value={this.state.email}
											defaultValue={this.state.email}
											required={(() => {
												if (localStorage.getItem('credentials')) {
													if (JSON.parse(localStorage.getItem('credentials')).type === 'staff') {
														return true;
													};
												};
											})()}
											onBlur={(event) => {
												if (!event.target.value) {
													event.target.value = this.state.email;
												};
												this.setState({
													email: event.target.value
												});
											}}
											onKeyDown={(event) => {
												if (event.key === 'Enter')
													event.target.blur();
											}}
										/>

										<Input
											id='addressInput'
											disabled={(() => {
												if (localStorage.getItem('credentials')) {
													if (JSON.parse(localStorage.getItem('credentials')).type !== 'staff') {
														return true;
													};
												};
											})()}
											type='textarea'
											label='Address'
											value={this.state.info?.address}
											defaultValue={this.state.info?.address}
											onBlur={(event) => {
												const info = this.state.info;
												info.address = event.target.value;
												this.setState({
													info: info
												});
											}}
											onKeyDown={(event) => {
												if (event.key === 'Enter')
													event.target.blur();
											}}
										/>

										{
											localStorage.getItem('credentials') ? (
												JSON.parse(localStorage.getItem('credentials')).type === 'staff'
													? (
														<>
															<div>
																<Button
																	id='updateButton'
																	type='button'
																	label='Update'
																	onClick={async (event) => {
																		event.target.disabled = true;
																		await this.updatePatient();
																		event.target.disabled = false;
																	}}
																/>
																<Button
																	id='deleteButton'
																	type='button'
																	label='Delete'
																	onClick={async () => {
																		Swal.fire({
																			title: '<h1>Delete Patient</h1>',
																			html: '<p>Are you sure you want to delete this patient?</p>',
																			showConfirmButton: true,
																			confirmButtonText: 'Yes',
																			confirmButtonColor: 'var(--color-primary)',
																			showCancelButton: true,
																			cancelButtonText: 'No',
																			width: '60rem',
																			
																			preConfirm: async () => {
																				const response = await fetch(`${globals.backendURL}/api/patients/${this.state.id}`, {
																					method: 'DELETE'
																				});
																				if (!response.ok) {
																					Swal.fire({
																						title: '<h1>Error</h1>',
																						html: '<p>An error occurred. Please try again later.</p>',
																						confirmButtonColor: 'var(--color-primary)',
																						icon: 'error',
																						color: 'var(--color-font-dark)'
																					});
																				} else {
																					window.location.hash = '#/dashboard/patients';
																				};
																			}
																		});
																	}}
																/>
															</div>

															<Button
																id='cancelButton'
																type='button'
																label='Cancel'
																onClick={() => {
																	window.location.hash = '#/dashboard/patients';
																}}
															/>
														</>
													) : null
											) : null
										}
									</div>

									<div
										id='historyPanel'
									>
										<div>
											<h2>Medical History</h2>

											<Button
												id='addRecordButton'
												type='button'
												label='Add Record'
												onClick={() => {
													Swal.fire({
														title: '<h1>Add Record</h1>',
														html: `
<style>
	#addMedicalHistoryForm {
		padding: 2rem;

		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 2rem;

		text-align: center;
	}

	#addMedicalHistoryForm input {
		width: 100%;
	}
	#addMedicalHistoryForm textarea {
		width: 100%;
		height: 10rem;
	}
</style>
<div id="addMedicalHistoryForm">
	<p>Please fill out the form below.</p>

	<label for="dateInput">Date</label>
	<input class="input" id="dateInput" type="date" defaultValue="${new Date().toISOString().split('T')[0]}" value="${new Date().toISOString().split('T')[0]}" required />
	<br />
	<label for="notesInput">Notes</label>
	<textarea class="input" id="notesInput" placeholder="Notes" required></textarea>
	<br />
	<label for="medicationsInput">Medications</label>
	<textarea class="input" id="medicationsInput" placeholder="Medications" required></textarea>
</div>
														`,
														width: '60rem',
														confirmButtonColor: 'var(--color-primary)',
														showCancelButton: true,
														showCloseButton: true,
														confirmButtonText: 'Add',
														cancelButtonText: 'Cancel',

														preConfirm: async () => {
															const date = Swal.getPopup().querySelector('#dateInput').value;
															const notes = Swal.getPopup().querySelector('#notesInput').value;
															const medications = Swal.getPopup().querySelector('#medicationsInput').value;
															if (!date || !notes || !medications) {
																Swal.showValidationMessage('Please fill out the form.');
															} else {
																const response = await fetch(`${globals.backendURL}/api/patients/${this.state.id}/medicalRecords`, {
																	method: 'PUT',
																	body: JSON.stringify({
																		date: date,
																		notes: notes,
																		medications: medications
																	})
																});
																if (response.status === 200) {
																	this.getPatient();
																	this.getMedicalRecords();
																} else {
																	Swal.fire({
																		title: '<h1>Error</h1>',
																		html: '<p>An error occurred. Please try again later.</p>',
																		confirmButtonColor: 'var(--color-primary)',
																		icon: 'error',
																		color: 'var(--color-font-dark)'
																	});
																};
															};
														}
													})
												}}
											/>
										</div>

										<table>
											<thead>
												<tr>
													<th>
														Date
													</th>
													<th>
														Notes
													</th>
													<th>
														Medications
													</th>
													<th>
														Actions
													</th>
												</tr>
											</thead>
											<tbody>
												{
													this.state.medicalRecords?.map((record, index) => {
														return (
															<tr key={index}>
																<td>
																	{record.date}
																</td>
																<td>
																	{record.notes}
																</td>
																<td>
																	{record.medications}
																</td>
																<td>
																	<div>
																		<Button
																			type='button'
																			label='Edit'
																			size='tiny'
																			onClick={() => {
																				Swal.fire({
																					title: '<h1>Edit Record</h1>',
																					html: `
<style>
	#editMedicalHistoryForm {
		padding: 2rem;

		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 2rem;

		text-align: center;
	}

	#editMedicalHistoryForm input {
		width: 100%;
	}
	#editMedicalHistoryForm textarea {
		width: 100%;
		height: 10rem;
	}
</style>

<div id="editMedicalHistoryForm">
	<p>Please fill out the form below.</p>

	<label for="dateInput">Date</label>
	<input class="input" id="dateInput" type="date" defaultValue="${record.date}" value="${record.date}" required />
	<br />
	<label for="notesInput">Notes</label>
	<textarea class="input" id="notesInput" placeholder="Notes" required>${record.notes}</textarea>
	<br />
	<label for="medicationsInput">Medications</label>
	<textarea class="input" id="medicationsInput" placeholder="Medications" required>${record.medications}</textarea>
</div>
`,
																					width: '60rem',
																					showConfirmButton: true,
																					confirmButtonText: 'Save',
																					confirmButtonColor: 'var(--color-primary)',
																					showCancelButton: true,
																					cancelButtonText: 'Cancel',

																					preConfirm: async () => {
																						const date = Swal.getPopup().querySelector('#dateInput').value;
																						const notes = Swal.getPopup().querySelector('#notesInput').value;
																						const medications = Swal.getPopup().querySelector('#medicationsInput').value;
																						if (!date || !notes || !medications) {
																							Swal.showValidationMessage('Please fill out the form.');
																						} else {
																							const response = await fetch(`${globals.backendURL}/api/patients/${this.state.id}/medicalRecords/${record.id}`, {
																								method: 'PATCH',
																								body: JSON.stringify({
																									date: date,
																									notes: notes,
																									medications: medications
																								})
																							});
																							if (response.status === 200) {
																								await this.getPatient();
																								this.getMedicalRecords();
																							} else {
																								Swal.fire({
																									title: '<h1>Error</h1>',
																									html: '<p>An error occurred. Please try again later.</p>',
																									confirmButtonColor: 'var(--color-primary)',
																									icon: 'error',
																									color: 'var(--color-font-dark)'
																								});
																							};
																						};
																					}
																				})
																			}}
																		/>

																		<Button
																			type='button'
																			label='Delete'
																			size='tiny'
																			onClick={async () => {
																				Swal.fire({
																					title: '<h1>Delete Record</h1>',
																					html: '<p>Are you sure you want to delete this record?</p>',
																					showConfirmButton: true,
																					confirmButtonText: 'Yes',
																					confirmButtonColor: 'var(--color-primary)',
																					showCancelButton: true,
																					cancelButtonText: 'No',
																					width: '60rem',
																					
																					preConfirm: async () => {
																						const response = await fetch(`${globals.backendURL}/api/patients/${this.state.id}/medicalRecords/${record.id}`, {
																							method: 'DELETE'
																						});
																						if (response.status === 200) {
																							await this.getPatient();
																							this.getMedicalRecords();
																						} else {
																							Swal.fire({
																								title: '<h1>Error</h1>',
																								html: '<p>An error occurred. Please try again later.</p>',
																								confirmButtonColor: 'var(--color-primary)',
																								icon: 'error',
																								color: 'var(--color-font-dark)'
																							});
																						};
																					}
																				})
																			}}
																		/>
																	</div>
																</td>
															</tr>
														);
													})
												}
											</tbody>
										</table>

										<div>
											<p></p>
											<Button
												type='button'
												label='Add Record'
												onClick={() => {
													document.getElementById('addRecordButton').click();
												}}
											/>
										</div>
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

export default Patient;