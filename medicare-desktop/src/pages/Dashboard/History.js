import React from 'react';

import '../../css/dashboard.css';
import '../../css/dashboard/history.css';

import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';

import globals from '../../utils/globals';

class History extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			routes: [
				{
					name: '',
					subroutes: ['']
				}
			],
			route: '',
			subroute: '',
			history: [],
			sorted: [],
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

		await this.fetchRoutes();
	};

	async fetchRoutes() {
		const response = await fetch(`${globals.backendURL}/api/routes`);

		if (!response.ok) {
			return;
		};

		const routes = await response.json();
		await this.setState({
			routes: routes,
			route: routes[routes.length - 1].name,
			subroute: routes[routes.length - 1].subroutes[routes[routes.length - 1].subroutes.length - 1]
		}, async () => {
			await this.fetchHistory();
		});
	};

	async fetchHistory() {
		const response = await fetch(`${globals.backendURL}/api/history/${this.state.route}/${this.state.subroute || ''}`);

		if (!response.ok) {
			return;
		};

		const history = await response.json();
		if (history.length === 0) {
			return;
		};
		const sorted = history.sort((a, b) => {
			if (a.date < b.date) {
				return 1;
			} else if (a.date > b.date) {
				return -1;
			} else {
				return 0;
			};
		});
		const groups = [];
		for (const history of sorted) {
			// If the current history has the same actor and action with the previous history, append the history to the last group
			// If not, create a new group of history
			if (groups.length === 0 || groups[groups.length - 1][0].actor.id !== history.actor.id || groups[groups.length - 1][0].action !== history.action) {
				groups.push([history]);
			} else {
				groups[groups.length - 1].push(history);
			};
		};

		await this.setState({
			history: groups,
			sorted: groups
		});
	};

	componentDidUpdate() {
		if (!this.state.loaded) return;
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
										<b><a href='#/dashboard/history'>History</a></b>
									</>
								) : (
									<>
										<a href='#/dashboard/supply'>Supply</a>
										<a href='#/dashboard/appointments'>Appointments</a>
										<a href='#/dashboard/doctors'>Doctors</a>
										<a href='#/dashboard/users'>Users</a>
										<a href='#/dashboard/patients'>Patients</a>
										<b><a href='#/dashboard/history'>History</a></b>
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
					id='history'
				>
					{
						this.state.loaded ? (
							<>
								<div
									id='head'
								>
									<h1>History</h1>
									<Button
										id='backButton'
										type='button'
										label='Back'
										onClick={() => {
											window.location.hash = '#/dashboard/';
										}}
									/>
								</div>
								<div
									id='historyPanel'
								>
									<aside>
										<Input
											id='route'
											name='route'
											type='dropdown'
											label='Route'
											options={this.state.routes.map((route) => route.name)}
											value={this.state.route}
											onChange={async (event) => {
												await this.setState({
													route: event.target.value
												}, async () => {
													await this.setState({
														subroute: this.state.routes.find((route) => route.name === this.state.route).subroutes[0]
													}, async () => {
														await this.fetchHistory();
													});
												});
											}}
										/>
										{
											this.state.routes.find((route) => route.name === this.state.route).subroutes.length > 0 ? (
												<Input
													id='subroute'
													name='subroute'
													type='dropdown'
													label='Subroute'
													options={this.state.routes.find((route) => route.name === this.state.route).subroutes}
													value={this.state.subroute}
													onChange={async (event) => {
														await this.setState({
															subroute: event.target.value
														}, async () => {
															await this.fetchHistory();
														});
													}}
												/>
											) : null
										}
									</aside>
									<table>
										<thead>
											<tr>
												<th>Action</th>
												<th>Actor</th>
												<th>Summary</th>
												<th>Date</th>
											</tr>
										</thead>
										<tbody>
											{
												this.state.sorted.map((group, index) => (
													<>
														<tr
															key={index}
														>
															<td
																rowSpan={group.length}
															>{group[0].action}</td>
															<td
																rowSpan={group.length}
															>
																{
																	group[0].actor?.type === 'doctor' ? `Dr. ${group[0].actor?.name}` : null
																}
																{
																	group[0].actor?.type === 'staff' ? `Staff: ${group[0].actor?.name}` : null
																}
																{
																	group[0].actor?.type === 'user' ? `User: ${group[0].actor?.name}` : null
																} ({group[0].actor?.id})
															</td>
															<td>{group[0].summary}</td>
															<td>{new Date(group[0].date).toLocaleString()}</td>
														</tr>
														{
															group.slice(1).map((history, index) => (
																<tr
																	key={index}
																>
																	<td>{history.summary}</td>
																	<td>{new Date(history.date).toLocaleString()}</td>
																</tr>
															))
														}
													</>
												))
											}
										</tbody>
									</table>
								</div>
							</>
						) : null
					}
				</main>
			</>
		);
	};
};

export default History;