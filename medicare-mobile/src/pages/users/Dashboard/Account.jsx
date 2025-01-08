import * as React from 'react';
import {
	ScrollView,
	View,
	Image,
	ToastAndroid
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { launchImageLibraryAsync } from 'expo-image-picker';

import DateTimePicker from 'react-native-ui-datepicker';
import dayjs from 'dayjs';

import Heading from '../../../components/Heading';
import Text from '../../../components/Text';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import Dropdown from '../../../components/Dropdown';

import style from '../../../styles/dashboard.styles';
import * as globalStyles from '../../../styles/globals.styles';

import paddingCreator from '../../../utils/paddingCreator';

import globals from '../../../utils/config';

class Account extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			profile: {
				avatar: '',
				gender: '',
				birthday: '0000-00-00', // YYYY-MM-DD (String)
				phone: ''
			},
			email: '',
			id: '',
			name: '',
			membership: {
				rfid: '',
				since: '',
				until: ''
			},
			editMode: false,
			disableSave: false
		};
	};

	async getProfile() {
		const credentials = await AsyncStorage.getItem('credentials');
		const user = JSON.parse(credentials);

		const response = await fetch(`${globals.apiURL}/api/users/${user.id}`);
		if (!response.ok) {
			ToastAndroid.show('Failed to fetch profile.', ToastAndroid.SHORT);
			return;
		};

		const profile = await response.json();
		this.setState({
			profile: {
				avatar: profile.profile?.avatar,
				gender: profile.profile?.gender,
				birthday: profile.profile?.birthday || '0000-00-00', // YYYY-MM-DD (String)
				phone: profile.profile?.phone
			},
			email: profile.email,
			id: profile.id,
			name: profile.name,
			membership: {
				rfid: profile.membership?.rfid,
				since: profile.membership?.since,
				until: profile.membership?.until
			},
			doNotChangeProfile: true
		});
	};

	async componentDidMount() {
		const subscibe = async () => {
			const credentials = await AsyncStorage.getItem('credentials');
			const user = JSON.parse(credentials);
			if (!user) {
				console.log('No user');
				return;
			};
	
			globals.ws.send(JSON.stringify({
				type: 'subscribe',
				page: `users/${user.id}`
			}));
	
			globals.ws.onmessage = (event) => {
				const data = JSON.parse(event.data) ?? {};
				if (data.type === 'refresh' && data.from === `users/${user.id}`) {
					console.log('Refreshing account');
					this.getProfile();
				};
			};
		};
		globals.ws.addEventListener('open', async () => {
			subscibe();
		});
		globals.ws.addEventListener('close', async () => {
			setTimeout(() => {
				subscibe();
			}, 5000);
		});
		subscibe();

		this.getProfile();
	};

	render() {
		return (
			<>
				<ScrollView
					style={style.account_body}

					contentContainerStyle={{
						gap: globalStyles.rem * 2, // 20

						alignItems: 'center',

						...paddingCreator(globalStyles.rem * 2), // 20

						overflow: 'visible'
					}}
				>
					{
						this.state.editMode ? (
							<>
								<Image
									source={{ uri: this.state.profile.avatar || 'https://via.placeholder.com/100' }}
									style={{
										width: globalStyles.rem * 16, // 160
										height: globalStyles.rem * 16, // 160

										borderRadius: globalStyles.rem, // 10

										backgroundColor: globalStyles.colors.white
									}}
								/>
								<Button
									label='Change Profile Picture'
									type='sub'
									head={5}
									style={{ width: '100%' }}

									onPress={() => {
										launchImageLibraryAsync({
											mediaTypes: 'Images',
											allowsEditing: true,
											aspect: [1, 1],
											quality: 1
										}).then((response) => {
											if (response.canceled) return;

											this.setState({
												profile: {
													...this.state.profile,
													avatar: response.assets[0].uri
												},
												doNotChangeProfile: false
											});
										});
									}}
								/>

								<Input
									label='Name'
									placeholder='Name'
									defaultValue={this.state.name}
									onChangeText={(name) => {
										this.setState({ name });
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
									defaultValue={this.state.profile.gender?.toLowerCase()}
									onChangeValue={(value) => {
										this.setState({
											profile: {
												...this.state.profile,
												gender: value
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
									<Heading head={5.5}>Birthday</Heading>

									<View
										style={{
											width: '100%',
											display: 'flex',
											flexDirection: 'row',
											justifyContent: 'space-between',
											gap: globalStyles.rem // 10
										}}
									>
										<Input
											label='Year'
											type='number'
											placeholder='YYYY'
											defaultValue={this.state.profile.birthday?.split('-')[0]}
											style={{
												flex: 2,
												width: '100%'
											}}

											onChangeText={(year) => {
												this.setState({
													profile: {
														...this.state.profile,
														birthday: `${year}-${this.state.profile.birthday?.split('-')[1]}-${this.state.profile.birthday?.split('-')[2]}`
													}
												});
											}}
										/>
										<Input
											label='Month'
											type='number'
											placeholder='MM'
											defaultValue={this.state.profile.birthday?.split('-')[1]}
											style={{
												flex: 2,
												width: '100%'
											}}

											onChangeText={(month) => {
												this.setState({
													profile: {
														...this.state.profile,
														birthday: `${this.state.profile.birthday?.split('-')[0]}-${month}-${this.state.profile.birthday?.split('-')[2]}`
													}
												});
											}}
										/>
										<Input
											label='Day'
											type='number'
											placeholder='DD'
											defaultValue={this.state.profile.birthday?.split('-')[2]}
											style={{
												flex: 2,
												width: '100%'
											}}

											onChangeText={(day) => {
												this.setState({
													profile: {
														...this.state.profile,
														birthday: `${this.state.profile.birthday?.split('-')[0]}-${this.state.profile.birthday?.split('-')[1]}-${day}`
													}
												});
											}}
										/>
									</View>
								</View>

								<Input
									label='Phone'
									type='phone'
									placeholder='Phone'
									defaultValue={this.state.profile.phone}
									onChangeText={(phone) => {
										this.setState({
											profile: {
												...this.state.profile,
												phone
											}
										});
									}}
								/>

								<Input
									label='Email'
									placeholder='Email'
									defaultValue={this.state.email}
									onChangeText={(email) => {
										this.setState({ email });
									}}
								/>

								<View
									style={{
										display: 'flex',
										flexDirection: 'row',
										justifyContent: 'space-between',
										gap: globalStyles.rem // 10
									}}
								>
									<Button
										label='Save'
										type='main'
										head={5}
										disabled={this.state.disableSave}
										style={{ width: '100%', flex: 1 }}
										onPress={async () => {
											this.setState({ disableSave: true });
											const data = {
												profile: {
													avatar: this.state.profile.avatar,
													gender: this.state.profile.gender,
													birthday: this.state.profile.birthday,
													phone: this.state.profile.phone
												},
												email: this.state.email,
												name: this.state.name,
												membership: this.state.membership,
												doNotChangeProfile: this.state.doNotChangeProfile
											};
											if (!data.doNotChangeProfile) {
												// open profile picture uri and convert to base64
												const response = await fetch(data.profile.avatar);
												const blob = await response.blob();
												const base64 = await new Promise((resolve, reject) => {
													const reader = new FileReader();
													reader.onload = () => resolve(reader.result);
													reader.onerror = reject;
													reader.readAsDataURL(blob);
												});
												data.profile.avatar = base64;
												data.doNotChangeProfile = false;
											};

											const response = await fetch(`${globals.apiURL}/api/users/${this.state.id}`, {
												method: 'PATCH',
												headers: {
													'Content-Type': 'application/json',
													'Authorization': await (async () => { const credentials = await AsyncStorage.getItem('credentials'); return credentials ? `${JSON.parse(credentials).id} ${JSON.parse(credentials).sessionKey}` : '' })()
												},
												body: JSON.stringify(data)
											});

											if (!response.ok) {
												ToastAndroid.show('Failed to save changes.', ToastAndroid.SHORT);
												this.setState({ disableSave: false });
												this.setState({ editMode: false });
												this.getProfile();
												return;
											};

											this.setState({ disableSave: false });
											this.setState({ editMode: false });
											this.getProfile();
										}}
									/>
									<Button
										label='Cancel'
										type='sub'
										head={5}
										style={{ width: '100%', flex: 1 }}
										onPress={() => {
											this.setState({ editMode: false });
											this.getProfile();
										}}
									/>
								</View>
							</>
						) : (
							<>
								<Image
									source={{ uri: this.state.profile.avatar || 'https://via.placeholder.com/100' }}
									style={{
										width: globalStyles.rem * 16, // 160
										height: globalStyles.rem * 16, // 160

										borderRadius: globalStyles.rem, // 10

										backgroundColor: globalStyles.colors.white
									}}
								/>

								<Heading
									head={2}
									style={{
										textAlign: 'center'
									}}
								>
									{this.state.name}
								</Heading>
									{
										this.state.membership.rfid && (
											<>
												<Text
													style={{
														width: '100%',
														...paddingCreator(globalStyles.rem / 2), // 5
														textAlign: 'center',
														color: globalStyles.colors.white,
														textAlign: 'center',
														textAlignVertical: 'center',
														backgroundColor: globalStyles.colors.primary,
														borderRadius: globalStyles.rem / 2, // 5
													}}
												>
													Member since {dayjs(this.state.membership.since).format('MMMM D, YYYY')}
												</Text>
											</>
										)
									}

								<View
									style={{
										width: '100%',
										display: 'flex',
										flexDirection: 'row',
										justifyContent: 'space-between',
									}}
								>
										<Heading head={5.5}>Gender</Heading>
										<Text>{this.state.profile.gender}</Text>
								</View>

									<View
										style={{
											width: '100%',
											display: 'flex',
											flexDirection: 'row',
											justifyContent: 'space-between',
										}}
									>
										<Heading head={5.5}>Birthday</Heading>
										<Text>{this.state.profile.birthday}</Text>
									</View>

									<View
										style={{
											width: '100%',
											display: 'flex',
											flexDirection: 'row',
											justifyContent: 'space-between',
										}}
									>
										<Heading head={5.5}>Phone</Heading>
										<Text>{this.state.profile.phone}</Text>
									</View>

									<View
										style={{
											width: '100%',
											display: 'flex',
											flexDirection: 'row',
											justifyContent: 'space-between',
										}}
									>
										<Heading head={5.5}>Email</Heading>
										<Text>{this.state.email}</Text>
									</View>

								<Button
									label='Edit Profile'
									type='main'
									head={5}
									style={{ width: '100%' }}

									onPress={async () => {
										if (!this.state.profile.birthday) {
											this.setState({
												profile: {
													...this.state.profile,
													birthday: dayjs().format('YYYY-MM-DD')
												}
											});
										};
										await this.getProfile();
										this.setState({ editMode: true });
									}}
								/>

								<Button
									label='Sign Out'
									type='sub'
									head={5}
									style={{ width: '100%' }}

									onPress={async () => {
										const credentials = await AsyncStorage.getItem('credentials');
										const response = await fetch(`${globals.apiURL}/api/users/deauthenticate`, {
											method: 'POST',
											headers: {
												'Content-Type': 'application/json',
												'Authorization': await (async () => { const credentials = await AsyncStorage.getItem('credentials'); return credentials ? `${JSON.parse(credentials).id} ${JSON.parse(credentials).sessionKey}` : '' })()
											},
											body: JSON.stringify({
												sessionKey: JSON.parse(credentials).sessionKey,
												id: JSON.parse(credentials).id
											})
										});
										await AsyncStorage.removeItem('credentials');
										this.props.navigation.navigate('SignIn');
									}}
								/>

								{
									!this.state.membership || !this.state.membership.rfid && (
										<>
											<Text
												style={{
													width: '100%',
													textAlign: 'center'
												}}
											>
												Want to become a member? Contact us at <Text style={{ color: globalStyles.colors.primary }}>medicare.hamms@gmail.com</Text>
											</Text>
										</>
									)
								}
							</>
						)
					}
				</ScrollView>
			</>
		);
	};
};

export default Account;