import React from 'react';

import '../css/signIn.css';

import Button from '../components/Button';
import Input from '../components/Input';

import globals from '../utils/globals';

class SignIn extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			email: '',
			password: '',

			showPassword: false,
			loaded: false
		};
	};

	/**
	 * @type {(event: React.FormEvent<HTMLFormElement>) => Void}
	 */
	handleSignIn = async (event) => {
		event.preventDefault();
		const signInButton = document.getElementById('signInButton');
		// signInButton.disabled = true;

		const options = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				email: this.state.email,
				password: this.state.password
			})
		};

		let response = await fetch(`${globals.backendURL}/api/staffs/`, options);

		if (response.status !== 200) {
			response = await fetch(`${globals.backendURL}/api/doctors/`, options);
		};

		if (response.status !== 200) {
			globals.Swal.fire({ title: '<h1>Error</h1>', html: '<p>Invalid email or password.</p>', confirmButtonColor: 'var(--color-primary)', icon: 'error', color: 'var(--color-font-dark)' });
			signInButton.disabled = false;
			return;
		};

		/**
		 * @type {{
		 * 		message: string,
		 * 		credentials: {
		 * 			id: string,
		 * 			sessionKey: string,
		 * 			type: 'staff' | 'doctor'
		 * 		}
		 * }}
		 */
		const data = await response.json();

		localStorage.setItem('credentials', JSON.stringify(data.credentials));

		window.location.hash = '#/dashboard';
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
				id='signInMain'
			>
				<div>
					<img
						src={`https://firebasestorage.googleapis.com/v0/b/medicare-a38ad.appspot.com/o/assets%2FIcon.png?alt=media`}
						alt='Icon'
					/>

					<form>
						<h1>Sign In</h1>

						{
							this.state.loaded ? (
								<>
									<Input
										id='email'
										className='signInInput'
										type='email'
										placeholder='Email'
										onChange={(event) => {
											this.setState({
												email: event.target.value
											});
										}}
									/>

									<div>
										<Input
											id='password'
											type='password'
											placeholder='Password'
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
										id='signInButton'
										type='submit'
										label='Sign In'

										onClick={this.handleSignIn}
									/>
								</>
							) : null
						}

						<p>Don't have an account? <a href='#/signUp'>Sign Up</a></p>
						<p>Fogot your password? <a href='#/forgotPassword'>Reset</a></p>
					</form>
				</div>

				<img
					src={`https://firebasestorage.googleapis.com/v0/b/medicare-a38ad.appspot.com/o/assets%2FBackground image.jpeg?alt=media`}
					alt='Sign In'
				/>
			</main>
		)
	};
};

export default SignIn;