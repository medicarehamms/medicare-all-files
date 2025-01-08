import Checkbox from 'expo-checkbox';
import * as React from 'react';
import {
	SafeAreaView,
	View,
	Image,
	ToastAndroid
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

export default class ForgotPassword extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			email: '',
			OTP: '',
			password: '',
			confirmPassword: '',
			/** @type {'email' | 'OTP' | 'password'} */
			phase: 'email',

			showPassword: false
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
							Forgot Password
						</Heading>
					</View>

					{
						this.state.phase === 'email' && (
							<View
								style={style.container}
							>
								<Input
									label='Email'
									onChangeText={(email) => this.setState({ email })}
								/>

								<Button
									onPress={async (event) => {
										this.setState({ disabled: true });
										if (!event) return;

										const response = await fetch(`${globals.apiURL}/api/forgotPassword`, {
											method: 'POST',
											headers: {
												'Content-Type': 'application/json'
											},
											body: JSON.stringify({
												email: this.state.email
											})
										});

										if (!response.ok) {
											const data = await response.json();
											this.setState({
												alert: data.message
											});
											return;
										};

										ToastAndroid.show('OTP sent to your email', ToastAndroid.SHORT);

										this.setState({ phase: 'OTP', disabled: false });
									}}
								>Send OTP</Button>
							</View>
						)
					}

					{
						this.state.phase === 'OTP' && (
							<View
								style={style.container}
							>
								<Input
									label='OTP'
									onChangeText={(OTP) => this.setState({ OTP })}
								/>

								<Button
									onPress={async (event) => {
										this.setState({ disabled: true });
										if (!event) return;

										const response = await fetch(`${globals.apiURL}/api/forgotPassword/verify`, {
											method: 'POST',
											headers: {
												'Content-Type': 'application/json'
											},
											body: JSON.stringify({
												email: this.state.email,
												OTP: this.state.OTP
											})
										});

										if (!response.ok) {
											const data = await response.json();
											this.setState({
												alert: data.message
											});
											return;
										};

										ToastAndroid.show('OTP verified', ToastAndroid.SHORT);

										this.setState({ phase: 'password', disabled: false });
									}}
								>Verify OTP</Button>
							</View>
						)
					}

					{
						this.state.phase === 'password' && (
							<View
								style={style.container}
							>
								<Input
									label='New Password'
									secureTextEntry={!this.state.showPassword}
									onChangeText={(password) => this.setState({ password })}
								/>

								<Input
									label='Confirm Password'
									secureTextEntry={!this.state.showPassword}
									onChangeText={(confirmPassword) => this.setState({ confirmPassword })}
								/>

								<Button
									onPress={async (event) => {
										this.setState({ disabled: true });
										if (!event) return;

										if (this.state.password !== this.state.confirmPassword) {
											this.setState({
												alert: 'Passwords do not match!'
											});
											return;
										};

										const response = await fetch(`${globals.apiURL}/api/forgotPassword/reset`, {
											method: 'POST',
											headers: {
												'Content-Type': 'application/json'
											},
											body: JSON.stringify({
												email: this.state.email,
												password: this.state.password
											})
										});

										if (!response.ok) {
											const data = await response.json();
											this.setState({
												alert: data.message
											});
											return;
										};

										ToastAndroid.show('Password reset', ToastAndroid.SHORT);

										this.props.navigation.navigate('SignIn');
									}}
								>Reset Password</Button>

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
						)
					}

					<Text
						style={{
							width: '100%',
							textAlign: 'center'
						}}
					>Rather remember your password? <Text
						style={{ color: globalStyles.colors.primary }}
						fontWeight='bold'
						onPress={() => this.props.navigation.navigate('ForgotPassword')}
					>Sign in</Text> here!
					</Text>
				</View>
			</SafeAreaView>
		);
	};
};