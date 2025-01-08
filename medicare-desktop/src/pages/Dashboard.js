import React from 'react';

import '../css/dashboard.css';

import Header from '../components/Header';
import Button from '../components/Button';

import globals from '../utils/globals';

class Dashboard extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			loaded: false
		};
	};

	async componentDidMount() {
		if (!(await globals.checkAuthentication())) {
			localStorage.clear();
			window.location.hash = '#/';
			return;
		};

		this.setState({
			loaded: true
		});
	};

	render() {
		return (
			<>
				<Header>
					{
						localStorage.getItem('credentials') ? (
							JSON.parse(localStorage.getItem('credentials')).type === 'doctor'
								? (
									<>
										<a href='#/dashboard/appointments'>Appointments</a>
										<a href='#/dashboard/patients'>Patients</a>
										<a href='#/dashboard/history'>History</a>
									</>
								) : (
									<>
										<a href='#/dashboard/supply'>Supply</a>
										<a href='#/dashboard/appointments'>Appointments</a>
										<a href='#/dashboard/doctors'>Doctors</a>
										<a href='#/dashboard/users'>Users</a>
										<a href='#/dashboard/patients'>Patients</a>
										<a href='#/dashboard/history'>History</a>
									</>
								)
						) : null
					}
					<Button
						id='signOutButton'
						type='button'
						label='Sign Out'
						onClick={async () => {
							// Deauthenticate user
							await globals.deauthenticateUser();
						}}
					/>
				</Header>
				<main
					className='dashboardMain'
					id='mainDashboard'
				>
					<div>
						{
							this.state.loaded ? (
								<>
									<div id='titleCard'>
										<h1>We think extraordinary people deserve extraordinary care.</h1>
										<p>“Your Health, Our mission; your journey, our commitment.”</p>
									</div>
								</>
							) : null
						}
					</div>
					<div>
						{
							this.state.loaded ? (
								<>
									<div id='menuCard'>
										{
											localStorage.getItem('credentials') ? (
												JSON.parse(localStorage.getItem('credentials')).type === 'doctor'
													? (
														<>
															<Button
																id='appointmentsButton'
																type='button'
																label='Appointments'
																onClick={() => {
																	window.location.hash = '#/dashboard/appointments';
																}}
															/>
															<Button
																id='patientsButton'
																type='button'
																label='Patients'
																onClick={() => {
																	window.location.hash = '#/dashboard/patients';
																}}
															/>
															<Button
																id='historyButton'
																type='button'
																label='History'
																onClick={() => {
																	window.location.hash = '#/dashboard/history';
																}}
															/>
														</>
													) : (
														<>
															<Button
																id='supplyButton'
																type='button'
																label='Supply'
																onClick={() => {
																	window.location.hash = '#/dashboard/supply';
																}}
															/>
															<Button
																id='appointmentsButton'
																type='button'
																label='Appointments'
																onClick={() => {
																	window.location.hash = '#/dashboard/appointments';
																}}
															/>
															<Button
																id='doctorsButton'
																type='button'
																label='Doctors'
																onClick={() => {
																	window.location.hash = '#/dashboard/doctors';
																}}
															/>
															<Button
																id='usersButton'
																type='button'
																label='Users'
																onClick={() => {
																	window.location.hash = '#/dashboard/users';
																}}
															/>
															<Button
																id='patientsButton'
																type='button'
																label='Patients'
																onClick={() => {
																	window.location.hash = '#/dashboard/patients';
																}}
															/>
															<Button
																id='historyButton'
																type='button'
																label='History'
																onClick={() => {
																	window.location.hash = '#/dashboard/history';
																}}
															/>
														</>
													)
											) : null
										}
									</div>
								</>
							) : null
						}
					</div>
				</main>
			</>
		)
	};
};

export default Dashboard;