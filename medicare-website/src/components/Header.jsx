import React from 'react';

import Icon from '../assets/Icon.png';

class Header extends React.Component {
	render() {
		return (
			<header id='header'>
				<div>
					<img
						src={Icon}
						alt='Medicare Logo'
					/>
					<h4>Medicare</h4>
				</div>

				<input type='checkbox' id='checkbox' />
				<label htmlFor='checkbox'>
					<svg viewBox='0 0 800 800' stroke='var(--color)' stroke-width='60' stroke-linecap='round' stroke-linejoin='round' >
						<path d='M133.334 200H666.667M133.334 400H666.667M133.334 600H666.667' />
					</svg>
				</label>

				<nav>
					{
						this.props.navigations.map((navigation, index) => {
							return (
								<a
									key={index}
									to={navigation.href}
									href={navigation.href}
								>
									{navigation.icon}
									{navigation.label}
								</a>
							);
						})
					}
				</nav>
			</header>
		);
	};
};

export default Header;