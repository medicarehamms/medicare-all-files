import { useFonts } from 'expo-font';

import * as React from 'react';
import { Pressable } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

import Heading from './Heading';

import * as globalStyles from '../styles/globals.styles';

/**
 * @param {import('react-native').PressableProps | {
 * 		label: String,
 * 		placeholder: String,
 * 		defaultValue: String,
 * 		value: String,
 * 		data: {
 * 			label: String,
 * 			value: Any
 * 		}[],
 * 		onChangeValue: (value: import('react-native-dropdown-picker').ValueType | null) => Any
 * }} props
 * @returns {React.ReactNode}
 */
const Dropdown = ({ label, placeholder, value, defaultValue, data, onChangeValue, ...props }) => {
	const [loaded] = useFonts({
		'Times New Roman': require('../fonts/Times New Roman.ttf'),
		'Times New Roman bold': require('../fonts/Times New Roman bold.ttf'),
		'Times New Roman italic': require('../fonts/Times New Roman italic.ttf'),
		'Times New Roman bold italic': require('../fonts/Times New Roman bold italic.ttf')
	});

	const [open, setOpen] = React.useState(false);
	const [currenValue, setValue] = React.useState(value || defaultValue);
	const [items, setItems] = React.useState([]);

	React.useEffect(() => {
		setItems(data || []);
	}, []);

	// Set the default value
	React.useEffect(() => {
		setValue(defaultValue);
	}, [defaultValue]);

	return (
		<Pressable
			style={{
				width: '100%',
				flexDirection: 'column',

				borderBottomColor: globalStyles.colors.black,
				borderBottomWidth: globalStyles.rem / 10,

				zIndex: 1
			}}
			onPress={() => {
				console.log('Pressed');
				setOpen(!open);
			}}
			{...props}
		>
			<Heading head={6}>
				{label}
			</Heading>

			<DropDownPicker
				open={open}
				defaultValue={defaultValue}
				value={currenValue}
				items={items}
				setOpen={(open) => setOpen(open)}
				setValue={(value) => setValue(value)}
				onChangeValue={onChangeValue}
				placeholder={placeholder}
				modalTitle={placeholder}
				style={{
					backgroundColor: 'transparent',
					borderWidth: 0,
					width: '100%',

					fontFamily: loaded ? 'Times New Roman' : 'serif'
				}}
				textStyle={{
					fontFamily: loaded ? 'Times New Roman' : 'serif'
				}}
				containerStyle={{
					width: '100%',
					fontFamily: loaded ? 'Times New Roman' : 'serif'
				}}
				dropDownContainerStyle={{
					width: '100%',
					borderRadius: 0,
					fontFamily: loaded ? 'Times New Roman' : 'serif'
				}}
				badgeStyle={{
					fontFamily: loaded ? 'Times New Roman' : 'serif'
				}}
				arrowStyle={{
					fontFamily: loaded ? 'Times New Roman' : 'serif'
				}}
				itemStyle={{
					fontFamily: loaded ? 'Times New Roman' : 'serif'
				}}

				listMode='MODAL'
			/>
		</Pressable>
	);
};

export default Dropdown;