import * as React from 'react';

import { View, Image } from 'react-native';

import Heading from './Heading';

import * as globalStyles from '../styles/globals.styles';

import paddingCreator from '../utils/paddingCreator';

/**
 * @param {import('react-native').ViewProps | {
 * 		image: import('react-native').ImageSourcePropType,
 * 		label: string,
 * 		onPress?: () => Void
 * }} props
 * @returns {React.ReactNode}
 */
const ServiceCard = ({ image, label, onPress, ...props }) => {
	return (
		<View
			style={{
				width: globalStyles.rem * 12, // 120
				height: globalStyles.rem * 16, // 160

				gap: globalStyles.rem // 10
			}}
		>
			<Image
				source={image}
				style={{
					width: globalStyles.rem * 12, // 120
					height: globalStyles.rem * 12, // 120

					borderRadius: globalStyles.rem // 10
				}}
			/>
			<Heading style={{ textAlign: 'center' }}>
				{label}
			</Heading>
		</View>
	);
};

export default ServiceCard;