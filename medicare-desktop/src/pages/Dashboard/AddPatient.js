import React from 'react';

import '../../css/dashboard.css';
import '../../css/dashboard/patient.css';

import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';

import globals from '../../utils/globals';

class AddPatient extends React.Component {
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
					notes: '',
					symptoms: '',
					medications: ''
				}
			],
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
	};

	savePatient = async () => {
		const data = {
			info: {
				profilePicture: this.state.info?.profilePicture,
				gender: this.state.info?.gender,
				birthday: this.state.info?.birthday,
				phone: this.state.info?.phone,
				address: this.state.info?.address
			},
			name: this.state.name,
			email: this.state.email
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

		const response = await fetch(`${globals.backendURL}/api/patients`, {
			method: 'PUT',
			body: JSON.stringify(data)
		});

		if (response.status === 200) {
			window.location.hash = '#/dashboard/patients';
		} else {
			globals.Swal.fire({
				title: '<h1>Error</h1>',
				html: '<p>Failed to save patient.</p>',
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
				>
					{
						this.state.loaded ? (
							<>
								<h1>Add Patient</h1>
								<div
									id='patientPanel'
								>
									<div>
										<img
											id='profilePicture'
											alt='Profile Picture'
											src={this.state.info?.profilePicture || 'https://via.placeholder.com/200'}

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
													const info = this.state.info;
													info.profilePicture = event.target.result;
													this.setState({
														info: info
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
												const info = this.state.info;
												info.profilePicture = '';
												this.setState({
													info: info
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
											type='date'
											label='Birthday'
											value={this.state.birthday}
											defaultValue={this.state.birthday}
											onChange={(event) => {
												const info = this.state.info;
												info.birthday = event.target.value;
												this.setState({
													info: info
												});
											}}
										/>

										<Input
											id='phoneInput'
											type='tel'
											label='Phone'
											value={this.state.phone}
											defaultValue={this.state.phone}
											onChange={(event) => {
												const info = this.state.info;
												info.phone = event.target.value;
												this.setState({
													info: info
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
											id='addressInput'
											type='textarea'
											label='Address'
											value={this.state.address}
											defaultValue={this.state.address}
											onChange={(event) => {
												const info = this.state.info;
												info.address = event.target.value;
												this.setState({
													info: info
												});
											}}
										/>


										<Button
											id='saveButton'
											type='button'
											label='Save'
											onClick={async (event) => {
												event.target.disabled = true;
												await this.savePatient();
												event.target.disabled = false;
											}}
										/>

										<Button
											id='cancelButton'
											type='button'
											label='Cancel'
											onClick={() => {
												window.location.hash = '#/dashboard/patients';
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

export default AddPatient;