import React from 'react';

import '../css/home.css';

import Header from '../components/Header';
import Button from '../components/Button';

import globals from '../utils/globals';

class Home extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			loaded: false
		};
	};

	async componentDidMount() {
		if (await globals.checkAuthentication()) {
			window.location.hash = '/dashboard';
		};

		this.setState({
			loaded: true
		});
	};

	render() {
		return (
			<>
				<Header>
					<Button
						className='button'
						type='button'
						onClick={() => {
							window.location.hash = '/signIn';
						}}
						label='Sign In'
					/>
					<Button
						className='button'
						type='button'
						onClick={() => {
							window.location.hash = '/signUp';
						}}
						label='Sign Up'
					/>
				</Header>
				<main
					id='homeMain'
				>
					<div>
						<div id='titleCard'>
							<h1>We think extraordinary people deserve extraordinary care.</h1>
							<p>“Your Health, Our mission; your journey, our commitment.”</p>
						</div>
					</div>
					<div>
						<span>
							<img
								src={`https://firebasestorage.googleapis.com/v0/b/medicare-a38ad.appspot.com/o/assets%2Fpregnancy dental.jpg?alt=media`}
								alt='Dental'
							/>
						</span>
						<span>
							<img
								src={`https://firebasestorage.googleapis.com/v0/b/medicare-a38ad.appspot.com/o/assets%2Fcardiology.jpg?alt=media`}
								alt='Cardiology'
							/>
						</span>
						<span>
							<img
								src={`https://firebasestorage.googleapis.com/v0/b/medicare-a38ad.appspot.com/o/assets%2Fcircumcision.jpg?alt=media`}
								alt='Circumcision'
							/>
						</span>
					</div>
				</main>
			</>
		)
	};
};

export default Home;