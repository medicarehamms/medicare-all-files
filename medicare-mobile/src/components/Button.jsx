import * as React from 'react';

import { ActivityIndicator } from 'react-native';

import Heading from './Heading';

import * as globalStyles from '../styles/globals.styles';

import paddingCreator from '../utils/paddingCreator';

/**
 * @param {import('react-native').TextProps | {
 * 		head?: 6 | 5 | 4 | 3 | 2 | 1,
 * 		label: String,
 * 		disabled?: Boolean,
 * 		type?: 'main' | 'sub',
 * 		onPress?: (event: import('react-native').GestureResponderEvent, ref: React.MutableRefObject<import('react-native').Text>) => Void,
 * 		style?: TextProps.style?: StyleProp<TextStyle>
 * }} props
 * @returns {React.ReactNode}
 */
const Button = ({ head, label, disabled, type, onPress, ...props }) => {
	return (
		<Heading
			head={head ? head : 5}
			style={{
				width: '100%',

				backgroundColor: type === 'sub' ? globalStyles.colors.white : globalStyles.colors.primary,
				borderColor: type === 'sub' ? globalStyles.colors.black : globalStyles.colors.primary,
				borderWidth: type === 'sub' ? globalStyles.rem / 10 : 0, // 1
				borderRadius: globalStyles.rem / 2, // 5

				...paddingCreator(
					globalStyles.rem / 2,
					globalStyles.rem * 2
				),

				color: type === 'sub' ? globalStyles.colors.black : globalStyles.colors.white,
				textAlign: 'center',
				verticalAlign: 'middle',
				cursor: 'pointer',

				...props.style
			}}

			disabled={disabled}

			onPress={onPress}
		>
			{
				disabled ?
					<ActivityIndicator size='small' color={type === 'sub' ? globalStyles.colors.black : globalStyles.colors.white} />
					: label || props.children
			}
		</Heading>
	);
};

export default Button;