import { StyleSheet } from 'react-native';

import * as globalStyles from './globals.styles';

import paddingCreator from '../utils/paddingCreator';

const homeStyles = StyleSheet.create({
	body: {
		...paddingCreator(
			globalStyles.rem * 2
		),
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		gap: globalStyles.rem * 4
	},
	container: {
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center',
		flexDirection: 'column',
		gap: globalStyles.rem * 2
	},
	logo: {
		width: (globalStyles.rem) * 12, // 120
		height: (globalStyles.rem) * 12 // 120
	},
	background: {
		position: 'absolute',
		width: '100%',
		height: '100%',
		backgroundColor: globalStyles.colors.secondary
	}
});

export default homeStyles;