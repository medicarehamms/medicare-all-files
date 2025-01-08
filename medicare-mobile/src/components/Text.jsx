import { useFonts } from 'expo-font';

import * as React from 'react';
import { Text as RNText } from 'react-native';

import * as globalStyles from '../styles/globals.styles';

/**
 * @param {import('react-native').TextProps | {
 * 		fontSize?: Number,
 * 		fontWeight?: 'normal' | 'bold' | 'italic' | 'bold italic'
 * }} props
 * @returns {React.ReactNode}
 */
const Text = ({ fontSize, fontWeight, ...props }) => {
	const [loaded] = useFonts({
		'Times New Roman': require('../fonts/Times New Roman.ttf'),
		'Times New Roman bold': require('../fonts/Times New Roman bold.ttf'),
		'Times New Roman italic': require('../fonts/Times New Roman italic.ttf'),
		'Times New Roman bold italic': require('../fonts/Times New Roman bold italic.ttf')
	});

	return (
		<RNText
			style={{
				fontFamily: loaded ?
					(
						fontWeight ?
							`Times New Roman ${fontWeight}` :
							'Times New Roman'
					)
					: 'serif',
				fontSize: fontSize ? fontSize : (globalStyles.rem * 1.5), // 15
				...props.style
			}}

			{...(() => {
				// Remove style and children from props
				const { style, children, ...rest } = props;
				return rest;
			})()}
		>
			{props.children}
		</RNText>
	);
};

export default Text;