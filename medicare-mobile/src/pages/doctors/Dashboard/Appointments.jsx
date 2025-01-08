import * as React from 'react';
import {
	ScrollView,
	View,
	ToastAndroid,
	Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

import Heading from '../../../components/Heading';
import Text from '../../../components/Text';
import Button from '../../../components/Button';
import Input from '../../../components/Input';

import style from '../../../styles/dashboard.styles';
import * as globalStyles from '../../../styles/globals.styles';

import paddingCreator from '../../../utils/paddingCreator';

import globals from '../../../utils/config';

class Appointments extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			dropdownOpened: false,
			modalShown: false,
			toBeRejected: null,
			date: dayjs().format('YYYY-MM-DD'),

			appointments: [],

			reason: '',

			disabled: false
		};
	};

	async getAppointments() {
		const response = await fetch(`${globals.apiURL}/api/appointments/`);
		if (!response.ok) {
			ToastAndroid.show('Failed to fetch appointments.', ToastAndroid.SHORT);
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
			page: 'appointments'
		}));

		globals.ws.onmessage = (event) => {
			const data = JSON.parse(event.data) ?? {};
			if (data.type === 'refresh' && data.from === 'appointments') {
				console.log('Refreshing history');
				this.getAppointments();
			};
		};

		this.getAppointments();
	};

	render() {
		return (
			<>
				<Modal
					visible={this.state.modalShown}
					onRequestClose={() => this.setState({ modalShown: false })}
					transparent
				>
					<View
						style={{
							...paddingCreator(globalStyles.rem * 2), // 20
							backgroundColor: globalStyles.colors.white,
							overflow: 'hidden',
							backgroundColor: 'rgba(0, 0, 0, 0.5)',
							flex: 1,
							justifyContent: 'center',
							alignItems: 'center'
						}}
					>
						<View
							style={{
								...paddingCreator(globalStyles.rem * 2), // 20
								backgroundColor: globalStyles.colors.white,
								overflow: 'hidden',
								borderRadius: globalStyles.rem / 2, // 5
								width: '100%',
								maxWidth: globalStyles.rem * 40, // 400
								maxHeight: globalStyles.rem * 60, // 600
								gap: globalStyles.rem // 10
							}}
						>
							<Heading head={4}>Reject Appointment</Heading>
							<Text>Are you sure you want to reject this appointment?</Text>
							<Input
								label='Reason'
								placeholder='Reason'
								multiline={true}
								numberOfLines={5}
								onChangeText={(text) => this.setState({ reason: text })}
							/>

							<View
								style={{
									display: 'flex',
									flexDirection: 'row',
									gap: globalStyles.rem
								}}
							>
								<Button
									label='Reject'
									style={{ flex: 1 }}
									disabled={this.state.disabled}
									onPress={async () => {
										this.setState({ disabled: true });
										if (this.state.reason.trim() === '') {
											ToastAndroid.show('Please enter a reason.', ToastAndroid.SHORT);
											this.setState({ disabled: false });
											return;
										};
										const response = await fetch(`${globals.apiURL}/api/appointments/reject/${this.state.toBeRejected}`, {
											method: 'POST',
											headers: {
												'Content-Type': 'application/json',
												'Authorization': await (async () => { const credentials = await AsyncStorage.getItem('credentials'); return credentials ? `${JSON.parse(credentials).id} ${JSON.parse(credentials).sessionKey}` : '' })()
											},
											body: JSON.stringify({ reason: this.state.reason })
										});
										if (!response.ok) {
											ToastAndroid.show('Failed to reject appointment.', ToastAndroid.SHORT);
											this.getAppointments();
											this.setState({ disabled: false });
											return;
										};
										ToastAndroid.show('Appointment rejected.', ToastAndroid.SHORT);
										this.getAppointments();
										this.setState({ modalShown: false, disabled: false });
									}}
									/>
								<Button
									label='Cancel'
									type='sub'
									style={{ flex: 1 }}
									onPress={() => this.setState({ modalShown: false })}
								/>
							</View>
						</View>
					</View>
				</Modal>
				<ScrollView
					style={style.appointments_body}

					contentContainerStyle={{
						gap: globalStyles.rem * 2, // 20

						...paddingCreator(globalStyles.rem * 2), // 20

						overflow: 'visible'
					}}
				>
					<Heading>Appointments</Heading>

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
										</View>
										<View
											style={{
												display: 'flex',
												flexDirection: 'row',
												justifyContent: 'space-between',
												flexWrap: 'wrap',
												gap: globalStyles.rem // 10
											}}
										>
											<View style={{ flex: 1 }}>
												<Heading head={5.5}>
													Date
												</Heading>
												<Text>
													{appointment.appointment.date}
												</Text>
											</View>
											<View style={{ flex: 1 }}>
												<Heading head={5.5}>
													Time
												</Heading>
												<Text>
													{appointment.appointment.time}
												</Text>
											</View>
										</View>
										<View
											style={{
												display: 'flex',
												flexDirection: 'row',
												justifyContent: 'space-between',
												flexWrap: 'wrap',
												gap: globalStyles.rem // 10
											}}
										>
											<View style={{ flex: 1 }}>
												<Heading head={5.5}>
													Service
												</Heading>
												<Text>
													{appointment.appointment.service}
												</Text>
											</View>
											<View style={{ flex: 1 }}>
												<Heading head={5.5}>
													Status
												</Heading>
												<Text>
													{appointment.appointment.status}
												</Text>
											</View>
										</View>
										{
											appointment.appointment.status === 'pending' ? (
												<View
													style={{
														display: 'flex',
														flexDirection: 'row',
														gap: globalStyles.rem
													}}
												>
													<Button
														label='✔'
														head={5}
														style={{ flex: 1 }}
														disabled={this.state.disabled}
														onPress={async () => {
															this.setState({ disabled: true });
															const response = await fetch(`${globals.apiURL}/api/appointments/approve/${appointment.id}`, {
																method: 'POST',
																headers: {
																	'Content-Type': 'application/json',
																	'Authorization': await (async () => { const credentials = await AsyncStorage.getItem('credentials'); return credentials ? `${JSON.parse(credentials).id} ${JSON.parse(credentials).sessionKey}` : '' })()
																}
															});
															if (!response.ok) {
																ToastAndroid.show('Failed to approve appointment.', ToastAndroid.SHORT);
																this.getAppointments();
																this.setState({ disabled: false });
																return;
															};
															ToastAndroid.show('Appointment approved.', ToastAndroid.SHORT);
															this.getAppointments();
															this.setState({ disabled: false });
														}}
													/>
													<Button
														label='✖'
														type='sub'
														head={5}
														style={{ flex: 1 }}
														onPress={async () => {
															this.setState({ modalShown: true, toBeRejected: appointment.id });
														}}
													/>
												</View>
											) : (
												<Heading
													head={5}
													style={{
														verticalAlign: 'middle',
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

export default Appointments;