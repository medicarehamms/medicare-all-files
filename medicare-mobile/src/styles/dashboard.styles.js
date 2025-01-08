import { StyleSheet, StatusBar } from 'react-native';

import * as globalStyles from './globals.styles';

import paddingCreator from '../utils/paddingCreator';

const statusBarHeight = StatusBar.currentHeight;

const dashboardStyles = StyleSheet.create({
	header: {
		...paddingCreator(
			globalStyles.rem / 2 + statusBarHeight, // 5 + statusBarHeight
			globalStyles.rem, // 10
			globalStyles.rem / 2, // 5
			globalStyles.rem // 10
		), // (5 + statusBarHeight) 10 5 10

		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'center',
		gap: globalStyles.rem, // 10

		borderBottomColor: globalStyles.colors.primary,
		borderBottomWidth: globalStyles.rem * 0.1 // 1
	},
	logo: {
		width: globalStyles.rem * 4, // 40
		height: globalStyles.rem * 4 // 40
	},

	home_body: {
		flex: 1
	},
	home_hero: {
		width: '100%',
		height: globalStyles.rem * 24, // 240
		justifyContent: 'center',
		alignItems: 'center',

		borderRadius: globalStyles.rem, // 10
		overflow: 'hidden'
	},
	home_title: {
		backgroundColor: 'rgba(0, 0, 0, 0.5)',

		gap: globalStyles.rem, // 10

		margin: globalStyles.rem, // 10
		padding: globalStyles.rem, // 10
		borderRadius: globalStyles.rem // 10
	},
	home_services: {
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-evenly',
		alignItems: 'flex-start',
		gap: globalStyles.rem // 10
	},

	appointment_body: {
		flex: 1
	},
	appointment_calendarModal: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',

		...paddingCreator(globalStyles.rem * 2), // 20

		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		gap: globalStyles.rem * 2, // 20

		backgroundColor: globalStyles.colors.white,

		zIndex: 100
	},

	history_body: {
		flex: 1
	},

	account_body: {
		flex: 1
	},

	appointments_body: {
		flex: 1
	},

	footer: {
		height: globalStyles.rem * 4, // 40
		backgroundColor: globalStyles.colors.white,

		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'stretch',
		alignItems: 'stretch',
		gap: globalStyles.rem, // 10

		borderTopColor: globalStyles.colors.primary,
		borderTopWidth: globalStyles.rem * 0.1 // 1
	},
	footerIcon: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		gap: globalStyles.rem / 4 // 2.5
	},
});

export default dashboardStyles;