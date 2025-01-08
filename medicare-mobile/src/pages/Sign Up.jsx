import Checkbox from 'expo-checkbox';
import * as React from 'react';
import {
	SafeAreaView,
	View,
	Image
} from 'react-native';

import style from '../styles/home.styles';
import * as globalStyles from '../styles/globals.styles';

import Heading from '../components/Heading';
import Text from '../components/Text';
import Input from '../components/Input';
import Button from '../components/Button';

import Logo from '../images/Logo.png';
import Background from '../images/Background.jpg';

import globals from '../utils/config';

class SignUp extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			name: '',
			email: '',
			password: '',
			confirmPassword: '',
			showPassword: false,
			alert: null,
			disabled: false
		};
	};

	handleSignUp = async () => {
		if (!this.state.name || !this.state.email || !this.state.password || !this.state.confirmPassword) {
			this.setState({
				alert: 'Please fill in all fields!'
			});
			return;
		};

		if (this.state.password !== this.state.confirmPassword) {
			this.setState({
				alert: 'Passwords do not match!'
			});
			return;
		};

		const response = await fetch(`${globals.apiURL}/api/users/`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: this.state.name,
				email: this.state.email,
				password: this.state.password
			})
		});

		if (response.status === 200) {
			const data = await response.json();
			this.props.navigation.navigate('SignIn');
		} else {
			const data = await response.json();
			this.setState({
				alert: data.message
			});
		};
	};

	render() {
		return (
			<SafeAreaView
				style={{ position: 'relative', height: '100%' }}
			>
				<Image
					source={Background}
					style={style.background}
					resizeMode='cover'
				/>

				<View style={style.body}>
					<View
						style={style.container}
					>
						<Image
							source={Logo}
							style={style.logo}
						/>

						<Heading
							style={{ textAlign: 'center' }}
						>
							Sign Up
						</Heading>
					</View>

					<View
						style={style.container}
					>
						<Input
							label='Name'
							onChangeText={(name) => this.setState({ name })}
						/>

						<Input
							label='Email'
							onChangeText={(email) => this.setState({ email })}
						/>

						<Input
							label='Password'
							type={this.state.showPassword ? 'text' : 'password'}
							onChangeText={(password) => {
								this.setState({ password });
								if (password !== this.state.confirmPassword) {
									this.setState({
										alert: 'Passwords do not match!'
									});
								} else {
									this.setState({
										alert: null
									});
								};
							}}
						/>

						<Input
							label='Confirm Password'
							type={this.state.showPassword ? 'text' : 'password'}
							onChangeText={(confirmPassword) => {
								this.setState({ confirmPassword });
								if (this.state.password !== confirmPassword) {
									this.setState({
										alert: 'Passwords do not match!'
									});
								} else {
									this.setState({
										alert: null
									});
								};
							}}
						/>

						<Text style={{
							width: '100%',
							color: '#FF0000',
							textAlign: 'center',

							display: this.state.alert ? 'flex' : 'none'
						}}>{this.state.alert}</Text>

						<Button
							disabled={this.state.disabled}
							onPress={async () => {
								this.setState({
									alert: null,
									disabled: true
								});
								await this.handleSignUp();
								this.setState({
									disabled: false
								});
							}}
						>Sign Up</Button>

						<View
							style={{
								width: '100%',
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'flex-start',
								gap: globalStyles.rem
							}}
						>
							<Checkbox
								value={this.state.showPassword}
								onValueChange={() => {
									this.setState({
										showPassword: !this.state.showPassword
									});
								}}
								color={globalStyles.colors.primary}
							/>
							<Text
								onPress={() => {
									this.setState({
										showPassword: !this.state.showPassword
									});
								}}
							>Show Passwords</Text>
						</View>
					</View>

					<Text
						style={{
							width: '100%',
							textAlign: 'center'
						}}
					>Already have an account? <Text
							style={{ color: globalStyles.colors.primary }}
						fontWeight='bold'
						onPress={() => this.props.navigation.navigate('SignIn')}
					>Sign In</Text> here!
					</Text>

					<Text
						style={{
							width: '100%',
							textAlign: 'center'
						}}
					>Forgot your password? <Text
							style={{ color: globalStyles.colors.primary }}
						fontWeight='bold'
						onPress={() => this.props.navigation.navigate('ForgotPassword')}
					>Reset</Text> it here!
					</Text>
				</View>
			</SafeAreaView>
		);
	};
};

export default SignUp;