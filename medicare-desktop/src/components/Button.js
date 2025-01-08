import * as React from 'react';

/**
 * @typedef {{
 * 		id: String,
 * 		className: String,
 * 		type: String,
 * 		label: React.ReactNode,
 * 		size: 'tiny' | 'regular',
 * 		contrast?: Boolean,
 * 		disabled?: Boolean,
 * 		onClick: () => Void,
 * 		children: React.ReactNode
 * }} ButtonProps
 */

class Button extends React.Component {
	/** @param {ButtonProps} props */
	constructor(props) {
		super(props);
	};

	render() {
		return (
			<button
				id={this.props.id}
				className={`button ${this.props.className} ${this.props.size === 'tiny' ? 'tiny' : 'regular'} ${this.props.contrast ? 'contrast' : ''}`}
				type={this.props.type}
				onClick={this.props.onClick}
				disabled={this.props.disabled}
			>
				<h6>{this.props.label || this.props.children || 'Button'}</h6>
			</button>
		);
	};
};

export default Button;