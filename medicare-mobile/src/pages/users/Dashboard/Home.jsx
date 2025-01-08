import * as React from 'react';
import {
	SafeAreaView,
	View,
	Image,
	ImageBackground,
	ScrollView
} from 'react-native';

import Heading from '../../../components/Heading';
import Text from '../../../components/Text';
import ServiceCard from '../../../components/ServiceCard';

import style from '../../../styles/dashboard.styles';
import * as globalStyles from '../../../styles/globals.styles';

import FemaleDoctorBackgrond from '../../../images/Female Doctor Background.jpg';
import dentalImage from '../../../images/dental.jpg';
import checkupImage from '../../../images/checkup.jpg';
import circumcisionImage from '../../../images/circumcision.jpg';
import vaccinationImage from '../../../images/vaccination.png';

class Home extends React.Component {
	constructor(props) {
		super(props);
	};
	render() {
		return (
			<ScrollView
				style={style.home_body}

				contentContainerStyle={{
					gap: globalStyles.rem * 2, // 20

					...paddingCreator(globalStyles.rem * 2) // 20
				}}

				showsHorizontalScrollIndicator={false}
			>
				<ImageBackground
					source={FemaleDoctorBackgrond}
					style={style.home_hero}
					resizeMode='cover'
				>
					<View
						style={style.home_title}
					>
						<Heading style={{ color: 'white', textAlign: 'center' }}>
							We think extraordinary people deserve extraordinary care.
						</Heading>
						<Text style={{ color: 'white', textAlign: 'center' }}>
							"Your health, our mission; your journey, our commitment."
						</Text>
					</View>
				</ImageBackground>

				<Heading style={{ textAlign: 'center' }}>
					Our Services
				</Heading>

				<View style={style.home_services}>
					<ServiceCard
						image={dentalImage}
						label='Dental'
					/>
					<ServiceCard
						image={checkupImage}
						label='Checkup'
					/>
					<ServiceCard
						image={circumcisionImage}
						label='Circumcision'
					/>
					<ServiceCard
						image={vaccinationImage}
						label='Vaccination'
					/>
				</View>
			</ScrollView>
		);
	};
};

export default Home;