import * as React from 'react';

import Button from './Button';

import globals from '../utils/globals';

/**
 * @typedef {{
 * 		children: React.ReactNode,
 * }} HeaderProps
 */

class Header extends React.Component {
	/** @param {HeaderProps} props */
	constructor(props) {
		super(props);
	};

	render() {
		return (
			<header
				id='header'
			>
				<img
					src={`https://firebasestorage.googleapis.com/v0/b/medicare-a38ad.appspot.com/o/assets%2FIcon.png?alt=media`}
					alt='Medicare Logo'
				/>

				<h3>
					{
						localStorage.getItem('credentials') ? (
							`Welcome to Medicare for ${JSON.parse(localStorage.getItem('credentials')).type.charAt(0).toUpperCase()}${JSON.parse(localStorage.getItem('credentials')).type.slice(1)}s`
						) : 'Welcome to Medicare'
					}
				</h3>

				<nav>
					{
						this.props.children || (
							<Button
								label='Home'
								onClick={() => this.props.history.push('/')}
							/>
						)
					}
				</nav>
			</header>
		);
	};
};

export default Header;