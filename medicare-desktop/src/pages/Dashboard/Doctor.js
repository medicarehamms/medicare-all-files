import React from 'react';
import Swal from 'sweetalert2';

import '../../css/dashboard.css';
import '../../css/dashboard/doctor.css';

import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';

import globals from '../../utils/globals';

class Doctor extends React.Component {
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

		const doctor = await this.getDoctor();

		const subscribe = async () => {
			globals.ws.send(JSON.stringify({
				type: 'subscribe',
				page: `doctors/${doctor.id}`
			}));
	
			globals.ws.onmessage = async (event) => {
				const data = JSON.parse(event.data) ?? {};
				if (data.type === 'refresh' && data.from === `doctors/${doctor.id}`) {
					console.log('Refreshing doctor data...');
	
					const doctor = await this.getDoctor();
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

	async getDoctor() {
		const doctorID = (() => {
			const path = window.location.hash;
			const id = path.split('/')[3];
			return id.charAt(0).toUpperCase() + id.slice(1);
		})();

		const response = await fetch(`${globals.backendURL}/api/doctors/${doctorID}`, {
			method: 'GET'
		});

		if (response.status === 200) {
			const data = await response.json();
			console.log(data);

			const doctor = {
				profile: {
					avatar: data.profile?.avatar,
					gender: data.profile?.gender,
					birthday: data.profile?.birthday,
					phone: data.profile?.phone,
				},
				name: data.name,
				id: data.id,
				email: data.email
			};
			this.setState(doctor);
			return doctor;
		} else {
			await globals.Swal.fire({
				title: '<h1>Error</h1>',
				html: '<p>Failed to get doctor.</p>',
				confirmButtonColor: 'var(--color-primary)',
				icon: 'error',
				color: 'var(--color-font-dark)'
			});
			window.location.hash = '#/dashboard/doctors';
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
					id='doctor'
				>
					{
						this.state.loaded ? (
							<>
								<div id='head'>
									<h1>Doctor Profile</h1>

									<Button
										id='backButton'
										type='button'
										label='Back'
										onClick={() => {
											window.location.hash = '#/dashboard/doctors';
										}}
									/>
								</div>
								<div
									id='doctorPanel'
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
													const doctorID = (() => {
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
													const response = await fetch(`${globals.backendURL}/api/doctors/${doctorID}`, {
														method: 'PATCH',
														body: JSON.stringify(data)
													});
													if (response.status === 200) {
														window.location.hash = '#/dashboard/doctors';
													} else {
														globals.Swal.fire({
															title: '<h1>Error</h1>',
															html: '<p>Failed to update doctor.</p>',
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
														title: '<h1>Delete Doctor</h1>',
														html: '<p>Are you sure you want to delete this doctor?</p>',
														showCancelButton: true,
														confirmButtonText: 'Delete',
														confirmButtonColor: 'var(--color-primary)',
														cancelButtonText: 'Cancel',
														cancelButtonColor: 'var(--color-font-dark)'
													}).then(async (result) => {
														if (result.isConfirmed) {
															const doctorID = (() => {
																const path = window.location.hash;
																const id = path.split('/')[3];
																return id.charAt(0).toUpperCase() + id.slice(1);
															})();
															const response = await fetch(`${globals.backendURL}/api/doctors/${doctorID}`, {
																method: 'DELETE'
															});
															
															if (!response.ok) {
																await Swal.fire({
																	title: '<h1>Error</h1>',
																	html: '<p>Failed to delete doctor.</p>',
																	confirmButtonColor: 'var(--color-primary)',
																	icon: 'error',
																	color: 'var(--color-font-dark)'
																});
															}
															window.location.hash = '#/dashboard/doctors';
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
												window.location.hash = '#/dashboard/doctors';
											}}
										/>
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

export default Doctor;