import * as React from 'react';

/**
 * @typedef {{
 * 		id: String,
 * 		name: String,
 * 		className: String,
 * 		type: String,
 * 		placeholder: String,
 * 		label?: String,
 * 		options?: String[],
 * 		required?: Boolean,
 * 		disabled?: Boolean,
 * 		value: String
 * 		onChange: (event: React.ChangeEvent<HTMLInputElement>) => Void,
 * 		onFocus?: (event: React.FocusEvent<HTMLInputElement>) => Void,
 * 		onBlur?: (event: React.FocusEvent<HTMLInputElement>) => Void,
 * 		onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => Void,
 * 		onClick?: (event: React.MouseEvent<HTMLInputElement>) => Void,
 * 		value: String
 * }} InputProps
 */

class Input extends React.Component {
	/** @param {InputProps} props */
	constructor(props) {
		super(props);
	};

	render() {
		if (this.props.type === 'dropdown') {
			if (this.props.label) {
				return (
					<div>
						<label
							htmlFor={this.props.id}
							className='label'
						>
							<h6>{this.props.label}{this.props.required ? ' *' : ''}</h6>
						</label>
						<select
							id={this.props.id}
							name={this.props.name}
							className={`input ${this.props.className} ${this.props.label ? 'labeled' : ''}`}
							onChange={this.props.onChange}
							onFocus={this.props.onFocus}
							onBlur={this.props.onBlur}
							onKeyDown={this.props.onKeyDown}
							onClick={this.props.onClick}
							value={this.props.value}
							required={this.props.required}
							disabled={this.props.disabled}
						>
							{this.props.options.map((option, index) => {
								return (
									<option
										key={index}
										value={option}
									>
										{option}
									</option>
								);
							})}
						</select>
					</div>
				);
			};

			return (
				<select
					id={this.props.id}
					name={this.props.name}
					className={`input ${this.props.className}`}
					onChange={this.props.onChange}
					onFocus={this.props.onFocus}
					onBlur={this.props.onBlur}
					onKeyDown={this.props.onKeyDown}
					onClick={this.props.onClick}
					value={this.props.value}
					required={this.props.required}
					disabled={this.props.disabled}
				>
					{this.props.options.map((option, index) => {
						return (
							<option
								key={index}
								value={option}
							>
								{option}
							</option>
						);
					})}
				</select>
			);
		};



		if (this.props.type === 'textarea') {
			if (this.props.label) {
				return (
					<div>
						<label
							htmlFor={this.props.id}
							className='label'
						>
							<h6>{this.props.label}{this.props.required ? ' *' : ''}</h6>
						</label>
						<textarea
							id={this.props.id}
							name={this.props.name}
							className={`input ${this.props.className} ${this.props.label ? 'labeled' : ''}`}
							placeholder={this.props.placeholder}
							onChange={this.props.onChange}
							onFocus={this.props.onFocus}
							onBlur={this.props.onBlur}
							onKeyDown={this.props.onKeyDown}
							onClick={this.props.onClick}
							defaultValue={this.props.value}
							required={this.props.required}
							disabled={this.props.disabled}
						/>
					</div>
				);
			};

			return (
				<textarea
					id={this.props.id}
					name={this.props.name}
					className={`input ${this.props.className}`}
					placeholder={this.props.placeholder}
					onChange={this.props.onChange}
					onFocus={this.props.onFocus}
					onBlur={this.props.onBlur}
					onKeyDown={this.props.onKeyDown}
					onClick={this.props.onClick}
					defaultValue={this.props.value}
					required={this.props.required}
					disabled={this.props.disabled}
				/>
			);
		};



		if (this.props.label) {
			return (
				<div>
					<label
						htmlFor={this.props.id}
						className='label'
					>
						<h6>{this.props.label}{this.props.required ? ' *' : ''}</h6>
					</label>
					<input
						id={this.props.id}
						name={this.props.name}
						className={`input ${this.props.className} ${this.props.label ? 'labeled' : ''}`}
						type={this.props.type}
						placeholder={this.props.placeholder}
						onChange={this.props.onChange}
						onFocus={this.props.onFocus}
						onBlur={this.props.onBlur}
						onKeyDown={this.props.onKeyDown}
						onClick={this.props.onClick}
						defaultValue={this.props.value}
						required={this.props.required}
						disabled={this.props.disabled}
					/>
				</div>
			);
		};
		return (
			<input
				id={this.props.id}
				name={this.props.name}
				className={`input ${this.props.className}`}
				type={this.props.type}
				placeholder={this.props.placeholder}
				onChange={this.props.onChange}
				onFocus={this.props.onFocus}
				onBlur={this.props.onBlur}
				onKeyDown={this.props.onKeyDown}
				onClick={this.props.onClick}
				defaultValue={this.props.value}
				required={this.props.required}
				disabled={this.props.disabled}
			/>
		);
	};
};

export default Input;