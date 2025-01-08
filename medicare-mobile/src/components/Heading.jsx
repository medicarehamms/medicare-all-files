import * as React from 'react';

import Text from './Text';

import * as globalStyles from '../styles/globals.styles';

/**
 * @param {import('react-native').TextProps | {
 * 		head?: 6 | 5 | 4 | 3 | 2 | 1
 * }} props
 * @returns {React.ReactNode}
 */
const Heading = ({ head, ...props }) => {
	return (
		<Text
			fontSize={head ? globalStyles.rem * (7 - head) : globalStyles.rem * 2}
			fontWeight='bold'
			{...props}
		/>
	);
};

export default Heading;