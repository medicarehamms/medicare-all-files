import * as React from 'react';
import {
	ScrollView,
	View,
	ToastAndroid
} from 'react-native';
import dayjs from 'dayjs';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Heading from '../../../components/Heading';
import Text from '../../../components/Text';
import Button from '../../../components/Button';

import style from '../../../styles/dashboard.styles';
import * as globalStyles from '../../../styles/globals.styles';

import paddingCreator from '../../../utils/paddingCreator';

import globals from '../../../utils/config';

class History extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			dropdownOpened: false,
			modalShown: false,
			modalRef: React.createRef(),
			date: dayjs().format('YYYY-MM-DD'),

			appointments: []
		};
	};

	async getHistory() {
		const credentials = await AsyncStorage.getItem('credentials');
		const user = JSON.parse(credentials);
		if (!user) {
			console.log('No user');
			return;
		};

		const response = await fetch(`${globals.apiURL}/api/appointments/user/${user.id}`);
		if (!response.ok) {
			ToastAndroid.show('Failed to fetch history.', ToastAndroid.SHORT);
			return;
		};

		const appointmentsData = await response.json();
		const appointments = [];
		for (const id in appointmentsData) {
			const appointment = appointmentsData[id];
			appointments.push({
				appointment: {
					date: appointment.appointment.date,
					service: appointment.appointment.service,
					status: appointment.appointment.status,
					time: appointment.appointment.time,
					rejectedReason: appointment.appointment.rejectedReason
				},
				created: appointment.created,
				id: appointment.id,
				patient: {
					age: appointment.patient.age,
					gender: appointment.patient.gender,
					name: appointment.patient.name,
					phone: appointment.patient.phone
				}
			});
			console.log(appointment);
		};
		this.setState({ appointments: appointments });
	};

	async componentDidMount() {
		const credentials = await AsyncStorage.getItem('credentials');
		const user = JSON.parse(credentials);
		if (!user) {
			console.log('No user');
			return;
		};

		globals.ws.send(JSON.stringify({
			type: 'subscribe',
			page: `appointments/${user.id}`
		}));

		globals.ws.onmessage = (event) => {
			const data = JSON.parse(event.data) ?? {};
			if (data.type === 'refresh' && data.from === `appointments/${user.id}`) {
				console.log('Refreshing history');
				this.getHistory();
			};
		};

		this.getHistory();
	};

	render() {
		return (
			<>
				<ScrollView
					style={style.history_body}

					contentContainerStyle={{
						gap: globalStyles.rem * 2, // 20

						...paddingCreator(globalStyles.rem * 2), // 20

						overflow: 'visible'
					}}
				>
					<Heading>Appointment History</Heading>

					{
						this.state.appointments.length === 0 ? (
							<Text>No appointments found.</Text>
						) : (
							this.state.appointments.map((appointment, index) => (
								<View
									key={index}
									style={{
										backgroundColor: appointment.appointment.status === 'pending' ? globalStyles.colors.white : 'rgba(0, 0, 0, 0.25)',
										borderLeftColor: globalStyles.colors.primary,
										borderLeftWidth: globalStyles.rem / 5, // 2
									}}
								>
									<View
										style={{
											...paddingCreator(globalStyles.rem), // 10
											justifyContent: 'flex-start',
											gap: globalStyles.rem // 10
										}}
									>
										<View>
											<Heading head={5}>
												{appointment.patient.name}
											</Heading>
											<Text>
												{appointment.patient.age} {parseInt(appointment.patient.age) === 1 ? 'year' : 'years'} old, {appointment.patient.gender}
											</Text>
											<Text>
												{appointment.appointment.date} {appointment.appointment.time}
											</Text>
										</View>
										{
											appointment.appointment.status === 'pending' ? (
												<Button
													label='Cancel'
													type='sub'
													head={5}
													style={{ width: '100%' }}
													onPress={async () => {
														const response = await fetch(`${globals.apiURL}/api/appointments/cancel/${appointment.id}`, {
															method: 'POST'
														});
														if (!response.ok) {
															ToastAndroid.show('Failed to cancel appointment.', ToastAndroid.SHORT);
															return;
														};
														this.getHistory();
													}}
												/>
											) : (
												<Heading
													head={5}
													style={{
														textAlign: 'center'
													}}
												>
													{appointment.appointment.status}
												</Heading>
											)
										}
									</View>

									{
										appointment.appointment.status === 'rejected' ? (
											<View
												style={{
													...paddingCreator(
														0,
														globalStyles.rem,
														globalStyles.rem,
														globalStyles.rem
													), // 10
													borderBottomColor: globalStyles.colors.primary,
													borderBottomWidth: globalStyles.rem / 5, // 2
													gap: globalStyles.rem / 5 // 2
												}}
											>
												<Heading>Reason:</Heading>
												<Text>
													{appointment.appointment.rejectedReason}
												</Text>
											</View>
										) : null
									}
								</View>
							))
						)
					}
				</ScrollView>
			</>
		);
	};
};

export default History;