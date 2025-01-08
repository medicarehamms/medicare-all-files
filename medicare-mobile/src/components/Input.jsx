import { useFonts } from 'expo-font';

import * as React from 'react';
import { TextInput, View } from 'react-native';

import Heading from './Heading';

import * as globalStyles from '../styles/globals.styles';

/**
 * @param {import('react-native').View | {
 * 		label: String,
 * 		multiline?: Boolean,
 * 		numberOfLines?: Number,
 * 		placeholder: String,
 * 		value: String,
 * 		defaultValue: String,
 * 		onChangeText: (String) => Void,
 * 		type?: 'text' | 'password' | 'number' | 'phone'
 * }} props
 * @returns {React.ReactNode}
 */
const Text = ({ label, placeholder, multiline, numberOfLines, type, value, defaultValue, onChangeText, ...props }) => {
	const [loaded] = useFonts({
		'Times New Roman': require('../fonts/Times New Roman.ttf'),
		'Times New Roman bold': require('../fonts/Times New Roman bold.ttf'),
		'Times New Roman italic': require('../fonts/Times New Roman italic.ttf'),
		'Times New Roman bold italic': require('../fonts/Times New Roman bold italic.ttf')
	});

	return (
		<View
			style={{
				width: '100%',
				height: 'auto',
				flexDirection: 'column',

				borderBottomColor: globalStyles.colors.black,
				borderBottomWidth: globalStyles.rem / 10,
				
				...props.style
			}}
			{...props}
		>
			<Heading head={6}>
				{label}
			</Heading>
			<TextInput
				style={{
					width: '100%',
					fontFamily: loaded ? 'Times New Roman' : 'serif',
					fontSize: globalStyles.rem * 2
				}}
				placeholder={placeholder}
				multiline={multiline}
				numberOfLines={numberOfLines}
				value={value}
				defaultValue={defaultValue}
				onChangeText={onChangeText}
				secureTextEntry={type === 'password'}
				keyboardType={type === 'number' ? 'numeric' : type === 'phone' ? 'phone-pad' : 'default'}
			/>
		</View>
	);
};

export default Text;