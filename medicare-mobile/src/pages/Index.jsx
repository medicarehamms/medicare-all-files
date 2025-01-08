import * as React from 'react';
import {
	SafeAreaView,
	View,
	Image
} from 'react-native';

import style from '../styles/home.styles';
import * as globalStyles from '../styles/globals.styles';

import Heading from '../components/Heading';
import Button from '../components/Button';

import Logo from '../images/Logo.png';
import Background from '../images/Background.jpg';

class Home extends React.Component {
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
					<Image
						source={Logo}
						style={style.logo}
					/>

					<Heading>
						Welcome to <Heading
							style={{ color: globalStyles.colors.primary }}
						>Medicare</Heading>!
					</Heading>

					<Button
						head={5}
						label='Get Started'
						onPress={() => this.props.navigation.navigate('SignIn')}
					/>
				</View>
			</SafeAreaView>
		);
	};
};

export default Home;