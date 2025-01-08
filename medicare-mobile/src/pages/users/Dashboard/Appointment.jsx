import * as React from 'react';
import {
	ScrollView,
	View,
	ToastAndroid
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';

import Heading from '../../../components/Heading';
import Text from '../../../components/Text';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import Dropdown from '../../../components/Dropdown';

import style from '../../../styles/dashboard.styles';
import * as globalStyles from '../../../styles/globals.styles';

import paddingCreator from '../../../utils/paddingCreator';

import globals from '../../../utils/config';

class Appointment extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			dropdownOpened: false,
			modalShown: false,
			modalRef: React.createRef(),
			date: dayjs().add(1, 'day').set('hour', 8).set('minute', 0).format('YYYY-MM-DD HH:mm'),

			appointment: {
				name: undefined,
				gender: undefined,
				age: undefined,
				phone: undefined,
				service: undefined,
				date: undefined,
				time: undefined
			},

			disabled: false,

			alert: null
		};
	};

	async handleBooking() {
		console.log(this.state.appointment);
		if (!this.state.appointment.name
			|| !this.state.appointment.gender
			|| !this.state.appointment.age
			|| !this.state.appointment.phone
			|| !this.state.appointment.service
			|| !this.state.appointment.date
			|| !this.state.appointment.time) {
			this.setState({
				alert: 'Please fill all fields.'
			});
			return;
		};
		if (this.state.alert) {
			return;
		};

		const credentials = await AsyncStorage.getItem('credentials');
		const user = JSON.parse(credentials);

		// API Call
		const response = await fetch(`${globals.apiURL}/api/appointments`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': await (async () => { const credentials = await AsyncStorage.getItem('credentials'); return credentials ? `${JSON.parse(credentials).id} ${JSON.parse(credentials).sessionKey}` : '' })()
			},
			body: JSON.stringify({
				patient: {
					name: this.state.appointment.name,
					gender: this.state.appointment.gender,
					age: this.state.appointment.age,
					phone: this.state.appointment.phone
				},
				appointment: {
					service: this.state.appointment.service,
					date: this.state.appointment.date,
					time: this.state.appointment.time
				},
				user: {
					id: user.id
				}
			})
		}).catch(() => {
			console.log('Failed to connect to server!');
		});

		if (response.status === 200) {
			this.props.changePage('home');
			ToastAndroid.show('Appointment Booked!', ToastAndroid.SHORT);
		} else {
			const data = await response.json();
			this.setState({
				alert: data.message
			});
		};
	};

	render() {
		return (
			<>
				<View
					ref={this.state.modalRef}
					style={{
						...style.appointment_calendarModal,
						display: this.state.modalShown ? 'flex' : 'none'
					}}

					zIndex={100}
				>
					<DateTimePicker
						mode='single'
						date={this.state.date}
						onChange={(params) => {
							if (params.action === 'dismissed') {
								this.setState({ modalShown: false });
								return;
							};
							this.setState({
								date: params.date
							});
						}}
						timePicker={true}

						style={{
							backgroundColor: globalStyles.colors.white,
							borderRadius: globalStyles.rem // 10
						}}
						calendarTextStyle={{
							color: globalStyles.colors.black,
							fontFamily: 'Times New Roman'
						}}
						selectedTextStyle={{
							color: globalStyles.colors.white,
							fontFamily: 'Times New Roman'
						}}
						selectedItemColor={globalStyles.colors.primary}

						disabledDates={(rawDate) => {
							// Disable dates before tomorrow
							const date = dayjs(rawDate);
							const tomorrow = dayjs().add(1, 'day');

							// Also disable dates that are not the same day as the service
							const service = this.state.appointment.service;
							const day = date.day();
							if (service === 'dental' && day !== 2) {
								return true;
							};
							if (service === 'checkup' && day === 0) {
								return true;
							};
							if (service === 'circumcision' && day !== 4) {
								return true;
							};
							if (service === 'vaccination' && day < 2) {
								return true;
							};
							if (service === 'prenatal' && day === 0) {
								return true;
							};

							// Disable times before 8 AM and after 7 PM
							const time = date.format('HH:mm');
							if (time < '08:00' || time > '19:00') {
								return true;
							};

							return date.isBefore(tomorrow);
						}}
					/>

					<Button
						label='Confirm'
						onPress={() => {
							this.setState({ modalShown: false });
							const [date, time] = this.state.date.split(' ');
							console.log(date, time);
							this.setState({
								appointment: {
									...this.state.appointment,
									date: date,
									time: time
								}
							});
						}}
					/>
				</View>

				<ScrollView
					style={style.appointment_body}

					contentContainerStyle={{
						gap: globalStyles.rem * 2, // 20

						...paddingCreator(globalStyles.rem * 2), // 20

						overflow: 'visible'
					}}
				>
					<Heading>Book an Appointment</Heading>

					<Input
						label='Patient Name'

						defaultValue={this.state.appointment.name}

						onChangeText={(value) => {
							this.setState({
								appointment: {
									...this.state.appointment,
									name: value
								}
							});
						}}
					/>

					<Dropdown
						label='Gender'
						placeholder='Select Gender'
						data={[
							{ label: 'Male', value: 'male' },
							{ label: 'Female', value: 'female' },
							{ label: 'Other', value: 'other' }
						]}

						defaultValue={this.state.appointment.gender}

						onChangeValue={(value) => {
							if (this.state.appointment.gender !== 'male' && value === 'circumcision') {
								this.setState({
									alert: 'Circumcision is only available for male patients.'
								});
							} else {
								this.setState({
									alert: null
								});
							};

							this.setState({
								appointment: {
									...this.state.appointment,
									gender: value
								}
							});
						}}
					/>

					<Input
						label='Age'
						type='number'

						defaultValue={this.state.appointment.age}

						onChangeText={(value) => {
							this.setState({
								appointment: {
									...this.state.appointment,
									age: value
								}
							});
						}}
					/>

					<Input
						label='Phone Number'
						type='phone'

						defaultValue={this.state.appointment.phone}

						onChangeText={(value) => {
							this.setState({
								appointment: {
									...this.state.appointment,
									phone: value
								}
							});
						}}
					/>

					<Dropdown
						label='Service to Appoint'
						placeholder='Select Service'
						data={[
							{ label: 'Dental (Tuesday)', value: 'dental' },
							{ label: 'Checkup (Monday - Friday)', value: 'checkup' },
							{ label: 'Circumcision (Thursday)', value: 'circumcision' },
							{ label: 'Vaccination (Wednesday - Friday)', value: 'vaccination' },
							{ label: 'Prenatal (Monday - Saturday)', value: 'prenatal' }
						]}
						onChangeValue={(value) => {
							if (this.state.appointment.gender !== 'male' && value === 'circumcision') {
								this.setState({
									alert: 'Circumcision is only available for male patients.'
								});
							} else if (this.state.appointment.gender !== 'female' && value === 'prenatal') {
								this.setState({
									alert: 'Prenatal care is only available for female patients.'
								});
							} else {
								this.setState({
									alert: null
								});
							};

							const service = value;
							let date = dayjs(this.state.date);

							switch (service) {
								case 'dental':
									if (date.day() < 2) {
										date = date.set('day', 2);
									} else if (date.day() > 2) {
										date = date.add(1, 'week').set('day', 2);
									};
									break;
								case 'checkup':
									if (date.day() < 1) {
										date = date.set('day', 1);
									} else if (date.day() > 5) {
										date = date.add(1, 'week').set('day', 1);
									};
									break;
								case 'circumcision':
									if (date.day() < 4) {
										date = date.set('day', 4);
									} else if (date.day() > 4) {
										date = date.add(1, 'week').set('day', 4);
									};
									break;
								case 'vaccination':
									if (date.day() < 3) {
										date = date.set('day', 3);
									} else if (date.day() > 5) {
										date = date.add(1, 'week').set('day', 3);
									};
									break;
								case 'prenatal':
									if (date.day() < 1) {
										date = date.set('day', 1);
									} else if (date.day() > 6) {
										date = date.add(1, 'week').set('day', 1);
									};
									break;
							};
							console.log(`Setting date to ${date.format('YYYY-MM-DD HH:mm')} for service ${service}`);

							this.setState({
								date: date.format('YYYY-MM-DD HH:mm'),
								appointment: {
									...this.state.appointment,
									service: service,
									date: date.format('YYYY-MM-DD'),
									time: date.format('HH:mm')
								}
							});
						}}
					/>

					<View
						style={{
							display: 'flex',
							flexDirection: 'column',
							gap: globalStyles.rem // 10
						}}
					>
						<Heading head={6}>Select Date and Time from 8 AM to 7 PM{'\n'}(MM|DD|YYYY - HH:MM AM/PM)</Heading>

						<Button
							head={5}
							label={(() => {
								const [date, time] = this.state.date.split(' ');
								const [year, month, day] = date.split('-');
								if (time) {
									const [hour, minute] = time.split(':');
									const meridiem = parseInt(hour) >= 12 ? 'PM' : 'AM';
									return `${month}|${day}|${year} — ${hour % 12}:${minute} ${meridiem}`;
								} else {
									return 'Select Date and Time';
								};
							})()}
							type='sub'
							onPress={() => {
								if (!this.state.appointment.service) {
									this.setState({
										alert: 'Please select a service first.'
									});
									return;
								};

								this.setState({ modalShown: true })
							}}
						/>
					</View>

					<Text style={{
						width: '100%',
						color: '#FF0000',
						textAlign: 'center',

						display: this.state.alert ? 'flex' : 'none'
					}}>{this.state.alert}</Text>

					<Button
						label='Book Appointment'
						disabled={this.state.disabled}
						onPress={async () => {
							this.setState({ disabled: true });
							await this.handleBooking();
							this.setState({ disabled: false });
						}}
					/>

					<Text
						style={{
							color: globalStyles.colors.primary,
							textAlign: 'center'
						}}
						onPress={async () => {
							const credentials = await AsyncStorage.getItem('credentials');
							const user = JSON.parse(credentials);
							
							const response = await fetch(`${globals.apiURL}/api/users/${user.id}`);

							if (!response.ok) {
								console.log('Failed to connect to server!');
								ToastAndroid.show('Failed to connect to server!', ToastAndroid.SHORT);
								return;
							};

							const data = await response.json();

							const age = parseInt(new Date().getFullYear() - new Date(data.profile.birthday).getFullYear());

							this.setState({
								appointment: {
									...this.state.appointment,
									name: data.name,
									gender: data.profile.gender?.toLowerCase(),
									age: isNaN(age) ? undefined : `${age}`,
									phone: data.profile.phone
								}
							});
						}}
					>
						Tap here to autofill.
					</Text>
				</ScrollView>
			</>
		);
	};
};

export default Appointment;