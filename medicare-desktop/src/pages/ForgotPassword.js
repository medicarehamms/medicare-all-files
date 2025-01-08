import React from 'react';

import '../css/forgotPassword.css';

import Button from '../components/Button';
import Input from '../components/Input';

import globals from '../utils/globals';

class ForgotPassword extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			email: '',
			OTP: '',
			password: '',
			confirmPassword: '',
			/** @type {'email' | 'OTP' | 'password'} */
			phase: 'email',

			showPassword: false,
			loaded: false
		};
	};

	async componentDidMount() {
		this.setState({
			loaded: true
		});
	};

	render() {
		return (
			<main
				id='forgotMain'
			>
				<div>
					<img
						src={`https://firebasestorage.googleapis.com/v0/b/medicare-a38ad.appspot.com/o/assets%2FIcon.png?alt=media`}
						alt='Icon'
					/>

					<form>
						<h1>Forgot Password</h1>

						{this.state.phase === 'email' && (
							<>
								<Input
									type='email'
									placeholder='Email'
									value={this.state.email}
									onChange={(e) => this.setState({ email: e.target.value })}
								/>

								<Button
									type='button'
									label='Send OTP'
									onClick={async () => {
										if (!this.state.email) {
											globals.Swal.fire({
												icon: 'error',
												title: '<h1>Please enter your email</h1>',
												width: '60rem'
											});
											return;
										};

										const response = await fetch(`${globals.backendURL}/api/forgotPassword`, {
											method: 'POST',
											headers: {
												'Content-Type': 'application/json',
												'Authorization': ''
											},
											body: JSON.stringify({
												email: this.state.email
											})
										});
										
										const data = await response.json();

										if (!response.ok) {
											globals.Swal.fire({
												icon: 'error',
												title: '<h1>An error occurred</h1>',
												html: `<p>${data.message}</p>`,
												width: '60rem'
											});
											return;
										};

										globals.Swal.fire({
											icon: 'success',
											title: `<h1>${data.message}</h1>`,
											width: '60rem'
										});

										this.setState({
											phase: 'OTP'
										});
									}}
								/>
							</>
						)}

						{this.state.phase === 'OTP' && (
							<>
								<Input
									type='text'
									placeholder='OTP'
									value={this.state.OTP}
									onChange={(e) => this.setState({ OTP: e.target.value })}
								/>

								<Button
									type='button'
									label='Verify OTP'
									onClick={async () => {
										if (!this.state.OTP) {
											globals.Swal.fire({
												icon: 'error',
												title: '<h1>Please enter the OTP</h1>',
												width: '60rem'
											});
											return;
										};

										const response = await fetch(`${globals.backendURL}/api/forgotPassword/verify`, {
											method: 'POST',
											headers: {
												'Content-Type': 'application/json',
												'Authorization': ''
											},
											body: JSON.stringify({
												email: this.state.email,
												OTP: this.state.OTP
											})
										});

										const data = await response.json();

										if (!response.ok) {
											globals.Swal.fire({
												icon: 'error',
												title: '<h1>An error occurred</h1>',
												html: `<p>${data.message}</p>`,
												width: '60rem'
											});
											return;
										};

										globals.Swal.fire({
											icon: 'success',
											title: '<h1>OTP verified successfully</h1>',
											width: '60rem'
										});

										this.setState({
											phase: 'password'
										});
									}}
								/>
							</>
						)}

						{this.state.phase === 'password' && (
							<>
								<Input
									type={this.state.showPassword ? 'text' : 'password'}
									placeholder='Password'
									value={this.state.password}
									onChange={(e) => this.setState({ password: e.target.value })}
								/>

								<Input
									type={this.state.showPassword ? 'text' : 'password'}
									placeholder='Confirm Password'
									value={this.state.confirmPassword}
									onChange={(e) => this.setState({ confirmPassword: e.target.value })}
								/>

								<Button
									type='button'
									label='Reset Password'
									onClick={async () => {
										if (!this.state.password) {
											globals.Swal.fire({
												icon: 'error',
												title: '<h1>Please enter your password</h1>',
												width: '60rem'
											});
											return;
										};
										if (this.state.password.length < 8 || this.state.password.length > 32) {
											globals.Swal.fire({ title: '<h1>Error</h1>', html: '<p>Password must be between 8 and 32 characters long.</p>', confirmButtonColor: 'var(--color-primary)', icon: 'error', color: 'var(--color-font-dark)', width: '60rem' });
											return;
										};
										if (!globals.passwordRegex.test(this.state.password)) {
											globals.Swal.fire({ title: '<h1>Error</h1>', html: '<p>Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character "@$!%*?&".</p>', confirmButtonColor: 'var(--color-primary)', icon: 'error', color: 'var(--color-font-dark)', width: '60rem' });
											return;
										};

										if (!this.state.confirmPassword) {
											globals.Swal.fire({
												icon: 'error',
												title: '<h1>Please confirm your password</h1>',
												width: '60rem'
											});
											return;
										};

										if (this.state.password !== this.state.confirmPassword) {
											globals.Swal.fire({
												icon: 'error',
												title: '<h1>Passwords do not match</h1>',
												width: '60rem'
											});
											return;
										};

										const response = await fetch(`${globals.backendURL}/api/forgotPassword/reset`, {
											method: 'POST',
											headers: {
												'Content-Type': 'application/json',
												'Authorization': ''
											},
											body: JSON.stringify({
												email: this.state.email,
												password: this.state.password
											})
										});

										const data = await response.json();

										if (!response.ok) {
											globals.Swal.fire({
												icon: 'error',
												title: '<h1>An error occurred</h1>',
												html: `<p>${data.message}</p>`,
												width: '60rem'
											});
											return;
										};

										await globals.Swal.fire({
											icon: 'success',
											title: '<h1>Password reset successfully</h1>',
											width: '60rem'
										});
										window.location.href = '#/signIn';
									}}
								/>

								<Button
									type='button'
									label={this.state.showPassword ? 'Hide Password' : 'Show Password'}
									onClick={() => this.setState({ showPassword: !this.state.showPassword })}
								/>
							</>
						)}

						<p>Remeber your password? <a href='#/signIn'>Sign In</a></p>
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

export default ForgotPassword;