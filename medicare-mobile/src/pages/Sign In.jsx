import Checkbox from 'expo-checkbox';
import * as React from 'react';
import {
	SafeAreaView,
	View,
	Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import style from '../styles/home.styles';
import * as globalStyles from '../styles/globals.styles';

import Heading from '../components/Heading';
import Text from '../components/Text';
import Input from '../components/Input';
import Button from '../components/Button';

import Logo from '../images/Logo.png';
import Background from '../images/Background.jpg';

import globals from '../utils/config';

class SignIn extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			email: '',
			password: '',
			showPassword: false,
			alert: null,
			disabled: false
		};
	};

	handleSignIn = async () => {
		if (!this.state.email || !this.state.password) {
			this.setState({
				alert: 'Please fill in all fields!'
			});
			return;
		};

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

		let response = await fetch(`${globals.apiURL}/api/users/`, options);

		if (response.status !== 200) {
			response = await fetch(`${globals.apiURL}/api/doctors/`, options);
		};

		if (response.status !== 200) {
			this.setState({
				alert: 'Invalid email or password!'
			});
			return;
		};

		/**
		 * @type {{
		 * 		message: string,
		 * 		credentials: {
		 * 			id: string,
		 * 			sessionKey: string,
		 * 			type: 'user' | 'doctor'
		 * 		}
		 * }}
		 */
		const data = await response.json();
		await AsyncStorage.setItem('credentials', JSON.stringify(data.credentials));

		this.props.navigation.navigate(data.credentials.type === 'user' ? 'UserDashboard' : 'DoctorDashboard');
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
							Sign In
						</Heading>
					</View>

					<View
						style={style.container}
					>
						<Input
							label='Email'
							onChangeText={(email) => this.setState({ email })}
						/>

						<Input
							label='Password'
							type={this.state.showPassword ? 'text' : 'password'}
							onChangeText={(password) => this.setState({ password })}
						/>

						<Text style={{
							width: '100%',
							color: '#FF0000',
							textAlign: 'center',

							display: this.state.alert ? 'flex' : 'none'
						}}>{this.state.alert}</Text>

						<Button
							disabled={this.state.disabled}
							onPress={async (event) => {
								this.setState({ disabled: true });
								await this.handleSignIn();
								this.setState({ disabled: false });
							}}
						>Sign In</Button>

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
							>Show Password</Text>
						</View>
					</View>

					<Text
						style={{
							width: '100%',
							textAlign: 'center'
						}}
					>Don't have an account? <Text
							style={{ color: globalStyles.colors.primary }}
						fontWeight='bold'
						onPress={() => this.props.navigation.navigate('SignUp')}
					>Sign Up</Text> here!
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

export default SignIn;