import { registerRootComponent } from 'expo';

import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as ScreenOrientation from 'expo-screen-orientation';
import { ActivityIndicator, SafeAreaView, ImageBackground } from 'react-native';

const Stack = createNativeStackNavigator();

import Index from './src/pages/Index';
import SignIn from './src/pages/Sign In';
import SignUp from './src/pages/Sign Up';
import UserDashboard from './src/pages/users/Dashboard';
import DoctorDashboard from './src/pages/doctors/Dashboard';
import ForgotPassword from './src/pages/ForgotPassword';

import * as globalStyles from './src/styles/globals.styles';

import globals from './src/utils/config';

import Background from './src/images/Background.jpg';

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			checkedAPI: false,
			checkedAuth: false,
			/**@type { 'user' | 'Doctor | null' } */
			authenticated: null
		};
	};

	async componentDidMount() {
		ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);

		await new Promise((resolve) => {
			if (this.state.checkedAPI) {
				resolve();
				return;
			};

			const aborter = new AbortController();

			fetch(`${globals.apiURL}/api/hello`, {
				signal: aborter.signal
			}).then(() => {
				resolve();
			}).catch(() => {
				globals.apiURL = 'https://medicare-api-8hhx.onrender.com';
				resolve();
			});

			setTimeout(() => {
				aborter.abort();
				resolve();
			}, 5000);
		});

		console.log(`API URL: ${globals.apiURL}`);
		this.setState({
			checkedAPI: true
		});

		console.log('Checking credentials');
		this.setState({
			authenticated: await globals.checkAuthorization()
		});

		this.setState({
			checkedAuth: true
		});
	};

	render() {
		if (!this.state.checkedAPI || !this.state.checkedAuth) {
			return (
				<SafeAreaView style={{
					width: '100%',
					height: '100%',
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center'
				}}

				>
					<ImageBackground
						source={Background}
						style={{
							width: '100%',
							height: '100%',
							flex: 1,
							justifyContent: 'center',
							alignItems: 'center'
						}}
					>
						<ActivityIndicator size='large' color={globalStyles.colors.primary} />
					</ImageBackground>
				</SafeAreaView>
			);
		};

		const screens = [
			{
				name: 'Index',
				component: Index,
				options: {
					title: 'Index',
					headerShown: false,

					navigationBarColor: 'none'
				}
			},
			{
				name: 'SignIn',
				component: SignIn,
				options: {
					title: 'Sign In',
					headerShown: false,

					navigationBarColor: 'none'
				}
			},
			{
				name: 'SignUp',
				component: SignUp,
				options: {
					title: 'Sign Up',
					headerShown: false,

					navigationBarColor: 'none'
				}
			},
			{
				name: 'UserDashboard',
				component: UserDashboard,
				options: {
					title: 'User Dashboard',
					headerShown: false,

					navigationBarColor: globalStyles.colors.white
				}
			},
			{
				name: 'DoctorDashboard',
				component: DoctorDashboard,
				options: {
					title: 'Doctor Dashboard',
					headerShown: false,

					navigationBarColor: globalStyles.colors.white
				}
			},
			{
				name: 'ForgotPassword',
				component: ForgotPassword,
				options: {
					title: 'Forgot Password',
					headerShown: false,

					navigationBarColor: 'none'
				}
			}
		];

		// Move the Dashboard to the first screen if authenticated
		if (this.state.authenticated === 'user') {
			const dashboardIndex = screens.findIndex((screen) => screen.name === 'UserDashboard');
			const dashboardScreen = screens[dashboardIndex];
			screens.splice(dashboardIndex, 1);
			screens.unshift(dashboardScreen);
		} else if (this.state.authenticated === 'doctor') {
			const dashboardIndex = screens.findIndex((screen) => screen.name === 'DoctorDashboard');
			const dashboardScreen = screens[dashboardIndex];
			screens.splice(dashboardIndex, 1);
			screens.unshift(dashboardScreen);
		};

		return (
			<NavigationContainer>
				<Stack.Navigator>
					{screens.map((screen, index) => {
						return (
							<Stack.Screen
								key={index}
								name={screen.name}
								component={screen.component}
								options={screen.options}
							/>
						);
					})}
				</Stack.Navigator>
			</NavigationContainer>
		);
	};
};

export default App;
registerRootComponent(App);