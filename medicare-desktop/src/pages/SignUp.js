import React from 'react';

import '../css/signUp.css';

import Button from '../components/Button';
import Input from '../components/Input';

import globals from '../utils/globals';

class SignUp extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			email: '',
			name: '',
			type: 'staff',
			password: '',

			showPassword: false,
			loaded: false
		};
	};

	/**
	 * @type {(event: React.FormEvent<HTMLFormElement>) => Void}
	 */
	handleSignUp = async (event) => {
		event.preventDefault();
		const signUpButton = document.getElementById('signUpButton');
		signUpButton.disabled = true;


		// Validate input
		if (!this.state.email || !this.state.name || !this.state.type || !this.state.password) {
			globals.Swal.fire({ title: '<h1>Error</h1>', html: '<p>Please fill in all fields.</p>', confirmButtonColor: 'var(--color-primary)', icon: 'error', color: 'var(--color-font-dark)' });
			signUpButton.disabled = false;
			return;
		};
		if (!globals.emailRegex.test(this.state.email)) {
			globals.Swal.fire({ title: '<h1>Error</h1>', html: '<p>Please enter a valid email address.</p>', confirmButtonColor: 'var(--color-primary)', icon: 'error', color: 'var(--color-font-dark)' });
			signUpButton.disabled = false;
			return;
		};
		if (this.state.password.length < 8 || this.state.password.length > 32) {
			globals.Swal.fire({ title: '<h1>Error</h1>', html: '<p>Password must be between 8 and 32 characters long.</p>', confirmButtonColor: 'var(--color-primary)', icon: 'error', color: 'var(--color-font-dark)' });
			signUpButton.disabled = false;
			return;
		};
		if (!globals.passwordRegex.test(this.state.password)) {
			globals.Swal.fire({ title: '<h1>Error</h1>', html: '<p>Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character "@$!%*?&".</p>', confirmButtonColor: 'var(--color-primary)', icon: 'error', color: 'var(--color-font-dark)' });
			signUpButton.disabled = false;
			return;
		};

		const options = {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `${localStorage.getItem('credentials') ? `${JSON.parse(localStorage.getItem('credentials')).id} ${JSON.parse(localStorage.getItem('credentials')).sessionKey}` : ''}`
			},
			body: JSON.stringify({
				email: this.state.email,
				name: this.state.name,
				password: this.state.password
			})
		};

		const response = this.state.type === 'staff' ?
			await fetch(`${globals.backendURL}/api/staffs`, options) :
			await fetch(`${globals.backendURL}/api/doctors`, options);

		/**
		 * @type {{
		 * 		error?: String,
		 * 		message: String
		 */
		const data = await response.json();

		if (data.error) {
			globals.Swal.fire({ title: '<h1>Error</h1>', html: `<pre>${JSON.stringify(data.error, null, 4)}</pre>`, confirmButtonColor: 'var(--color-primary)', icon: 'error', color: 'var(--color-font-dark)' });
			signUpButton.disabled = false;
			return;
		};
		if (response.status === 400) {
			globals.Swal.fire({ title: '<h1>Error</h1>', html: `<p>${data.message}</p>`, confirmButtonColor: 'var(--color-primary)', icon: 'error', color: 'var(--color-font-dark)' });
			signUpButton.disabled = false;
			return;
		};

		window.location.hash = '#/signIn';
	};



	async componentDidMount() {
		if (await globals.checkAuthentication()) {
			window.location.hash = '#/dashboard';
			return;
		};

		this.setState({
			loaded: true
		});
	};

	render() {
		return (
			<main
				id='signUpMain'
			>
				<div>
					<img
						src={`https://firebasestorage.googleapis.com/v0/b/medicare-a38ad.appspot.com/o/assets%2FIcon.png?alt=media`}
						alt='Icon'
					/>

					<form>
						<h1>Sign Up</h1>

						{
							this.state.loaded ? (
								<>
									<Input
										id='email'
										name='email'
										type='email'
										placeholder='Email'
										required
										onChange={(event) => {
											this.setState({
												email: event.target.value
											});
										}}
									/>

									<div>
										<Input
											id='name'
											name='name'
											type='text'
											placeholder='Name'
											required
											onChange={(event) => {
												this.setState({
													name: event.target.value
												});
											}}
										/>
										<Input
											id='type'
											name='type'
											type='dropdown'
											placeholder='Type'
											required
											options={['staff', 'doctor']}
											onChange={(event) => {
												this.setState({
													type: event.target.value
												});
											}}
										/>
									</div>

									<div>
										<Input
											id='password'
											name='password'
											type='password'
											placeholder='Password'
											required
											onChange={(event) => {
												this.setState({
													password: event.target.value
												});
											}}
										/>

										<Button
											id='showPasswordButton'
											type='button'
											label={this.state.showPassword ? 'Hide' : 'Show'}

											onClick={() => {
												const passwordInput = document.getElementById('password');

												if (this.state.showPassword) {
													passwordInput.type = 'password';
												} else {
													passwordInput.type = 'text';
												};

												this.setState({
													showPassword: !this.state.showPassword
												});
											}}
										/>
									</div>

									<Button
										id='backButton'
										type='button'
										label='Back'

										onClick={() => {
											window.location.hash = '#/';
										}}
									/>

									<Button
										id='signUpButton'
										type='submit'
										label='Sign Up'

										onClick={this.handleSignUp}
									/>
								</>
							) : null
						}

						<p>Already have an account? <a href='#/signIn'>Sign In</a></p>
						<p>Fogot your password? <a href='#/forgotPassword'>Reset</a></p>
					</form>
				</div>

				<img
					src={`https://firebasestorage.googleapis.com/v0/b/medicare-a38ad.appspot.com/o/assets%2FBackground image.jpeg?alt=media`}
					alt='Sign Up'
				/>
			</main>
		)
	};
};

export default SignUp;