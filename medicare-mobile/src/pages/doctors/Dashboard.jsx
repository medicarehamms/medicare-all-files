import * as React from 'react';
import {
	SafeAreaView,
	View,
	TouchableOpacity,
	Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Heading from '../../components/Heading';

import style from '../../styles/dashboard.styles';
import * as globalStyles from '../../styles/globals.styles';

import Logo from '../../images/Logo.png';

import Appointments from './Dashboard/Appointments';
import Account from './Dashboard/Account';

import AppointmentsIcon from '../../svg/Appointment.svg';
import AccountIcon from '../../svg/Account.svg';

import globals from '../../utils/config';

class Dashboard extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			/**
			 * @type {'appointments' | 'account'}
			 */
			page: 'appointments'
		};
	};

	componentDidMount() {
		const connect = () => {
			try {
				globals.ws = new WebSocket(`${globals.apiURL.replace('http', 'ws')}/ws`);
				let connected = false;

				// Modify ws.send to wait for connection before sending
				const originalSend = globals.ws.send.bind(globals.ws);
				globals.ws.send = async (data) => {
					await new Promise((resolve) => {
						if (connected) {
							resolve();
						} else {
							globals.ws.onopen = () => {
								resolve();
							};
						};
					});

					originalSend(data);
				};

				globals.ws.onopen = () => {
					const authenticate = async () => {
						const credentials = await AsyncStorage.getItem('credentials');

						if (!credentials) {
							console.log('No credentials found');
							return;
						};

						const userCredentials = JSON.parse(credentials);

						originalSend(JSON.stringify({
							type: 'credentials',
							credentials: {
								sessionKey: userCredentials.sessionKey,
								id: userCredentials.id
							}
						}));
						console.log('WebSocket connection established');
						connected = true;
					};
					authenticate();
				};
				globals.ws.onclose = () => {
					console.log('WebSocket connection closed. Reconnecting in 5 seconds...');

					setTimeout(() => {
						connect();
					}, 5000);
				};
			} catch (error) {
				console.log('WebSocket error:', error);
				console.log('Reconnecting in 5 seconds...');

				setTimeout(() => {
					connect();
				}, 5000);
			};
		};

		connect();
	};

	render() {
		return (
			<SafeAreaView
				style={{ position: 'relative', height: '100%' }}
			>
				<View
					style={style.header}
				>
					<Image
						source={Logo}
						style={style.logo}
					/>

					<Heading>
						Medicare for Doctors
					</Heading>
				</View>

				{
					this.state.page === 'appointments' ? <Appointments navigation={this.props.navigation} /> : <Account navigation={this.props.navigation} />
				}

				<View style={style.footer}>
					<TouchableOpacity
						style={{
							...style.footerIcon,

							opacity: this.state.page === 'appointment' ? 1 : 0.5
						}}

						onPress={() => this.setState({ page: 'appointments' })}
					>
						<AppointmentsIcon
							height={globalStyles.rem * 2} // 20
							width={globalStyles.rem * 2} // 20
						/>
						<Heading head={6} style={{ color: globalStyles.colors.primary }}>Appointments</Heading>
					</TouchableOpacity>
					<TouchableOpacity
						style={{
							...style.footerIcon,

							opacity: this.state.page === 'account' ? 1 : 0.5
						}}

						onPress={() => this.setState({ page: 'account' })}
					>
						<AccountIcon
							height={globalStyles.rem * 2} // 20
							width={globalStyles.rem * 2} // 20
						/>
						<Heading head={6} style={{ color: globalStyles.colors.primary }}>Account</Heading>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	};
};

export default Dashboard;