import React from 'react';

import '../../css/dashboard.css';
import '../../css/dashboard/users.css';

import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';

import globals from '../../utils/globals';

class Users extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			users: [],
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

		this.getAppUsers();

		const subscribe = async () => {

			globals.ws.send(JSON.stringify({
				type: 'subscribe',
				page: 'users'
			}));
	
			globals.ws.onmessage = (event) => {
				const data = JSON.parse(event.data) ?? {};
				if (data.type === 'refresh' && data.from === 'users') {
					this.getAppUsers();
				};
			};
		};
		globals.ws.addEventListener('open', subscribe);
		globals.ws.addEventListener('close', () => {
			setTimeout(() => {
				subscribe();
			}, 5000);
		});
		subscribe();
	};

	async getAppUsers() {
		const response = await fetch(`${globals.backendURL}/api/users`, {
			method: 'GET'
		});

		if (response.status === 200) {
			const data = await response.json();
			const users = [];
			for (const id in data) {
				const user = data[id];
				users.push({
					email: user.email,
					id,
					name: user.name
				});
			};
			this.setState({
				users: users
			});
		} else {
			globals.Swal.fire({
				title: '<h1>Error</h1>',
				html: '<p>Failed to fetch users.</p>',
				confirmButtonColor: 'var(--color-primary)',
				icon: 'error',
				color: 'var(--color-font-dark)'
			});
		};
	};

	componentDidUpdate() {
		if (!this.state.loaded) return;

		const table = document.querySelector('#usersPanel table');
		const thead = table.querySelector('thead');
		const th = thead.querySelectorAll('th');
		const tbody = table.querySelector('tbody');
		const tr = tbody.querySelectorAll('tr');
		for (const thElement of th) {
			thElement.onclick = () => {
				const index = [...th].indexOf(thElement);
				const order = thElement.getAttribute('data-order');
				const sort = (a, b) => {
					if (order === 'asc') {
						if (a.children[index].innerHTML < b.children[index].innerHTML) {
							return -1;
						} else if (a.children[index].innerHTML > b.children[index].innerHTML) {
							return 1;
						} else {
							return 0;
						};
					} else {
						if (a.children[index].innerHTML < b.children[index].innerHTML) {
							return 1;
						} else if (a.children[index].innerHTML > b.children[index].innerHTML) {
							return -1;
						} else {
							return 0;
						};
					};
				};

				const sorted = [...tr].sort(sort);
				if (order === 'asc') {
					thElement.setAttribute('data-order', 'desc');
				} else {
					thElement.setAttribute('data-order', 'asc');
				};

				for (const trElement of tr) {
					tbody.removeChild(trElement);
				};

				for (const trElement of sorted) {
					tbody.appendChild(trElement);
				};
			};
		};
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
										<b><a href='#/dashboard/users'>Users</a></b>
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
					id='users'
				>
					{
						this.state.loaded ? (
							<>
								<div
									id='head'
								>
									<h1>Users</h1>
									<Input
										id='search'
										type='search'
										placeholder='Search (ID, Name, Email)'

										onChange={(event) => {
											const query = event.target.value.toLowerCase();
											const users = this.state.users;
											const filtered = users.filter((user) => {
												return user.id.toLowerCase().includes(query) || user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
											});

											const tbody = document.querySelector('#usersPanel table tbody');
											const tr = tbody.querySelectorAll('tr');
											for (const trElement of tr) {
												if (filtered.map((user) => user.id).includes(trElement.id)) {
													trElement.style.display = '';
												} else {
													trElement.style.display = 'none';
												};
											};
										}}
									/>
									<div>
										<Button
											id='scanRFIDButton'
											type='button'
											label='Scan RFID'
											onClick={() => {
												setTimeout(() => {
													document.getElementById('RFIDInput').focus();
												}, 10);
												globals.Swal.fire({
													title: '<h1>Scan RFID</h1>',
													html: `
<style>
	#scanRFIDForm {
		padding: 2rem;

		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 2rem;

		text-align: center;
	}
</style>
<div id="scanRFIDForm">
	<p>Scan the RFID of the item.</p>

	<input
		id="RFIDInput"
		class="input"
		type="text"
		placeholder="RFID"
		onKeyDown="((event) => {
			if (event.key === 'Enter') {
				const RFID = event.target.value;
				const confirmButton = document.querySelector('.swal2-confirm');
				confirmButton.click();
			};
			if (event.key === 'Escape')
				event.target.blur();
		})(event);"
	/>
</div>
												`,
													width: '60rem',
													showCancelButton: true,
													confirmButtonText: 'Scan',
													confirmButtonColor: 'var(--color-primary)',
													cancelButtonText: 'Cancel',
													cancelButtonColor: 'var(--color-font-dark)'
												}).then(async (result) => {
													const rfid = document.getElementById('RFIDInput').value;
													if (rfid === '') {
														globals.Swal.fire({
															title: '<h1>Error</h1>',
															html: '<p>RFID cannot be empty.</p>',
															icon: 'error',
															confirmButtonColor: 'var(--color-primary)',
															color: 'var(--color-font-dark)'
														});
														return;
													};

													const response = await fetch(`${globals.backendURL}/api/users/rfid`, {
														method: 'SEARCH',
														headers: {
															'Content-Type': 'application/json'
														},
														body: JSON.stringify({
															rfid
														})
													});

													if (!response.ok) {
														globals.Swal.fire({
															title: '<h1>Error</h1>',
															html: '<p>Failed to find user.</p>',
															icon: 'error',
															confirmButtonColor: 'var(--color-primary)',
															color: 'var(--color-font-dark)'
														});
														return;
													};

													const data = await response.json();
													window.location.hash = `#/dashboard/users/${data.id}`;
												});
											}}
										/>
										<Button
											id='backButton'
											type='button'
											label='Back'
											onClick={() => {
												window.location.hash = '#/dashboard/';
											}}
										/>
									</div>
								</div>
								<div
									id='usersPanel'
								>
									<table>
										<thead>
											<tr>
												<th>ID</th>
												<th>Name</th>
												<th>Email</th>
												<th>Actions</th>
											</tr>
										</thead>
										<tbody>
											{
												this.state.users.map((user, index) => {
													return (
														<tr
															key={index}
															id={user.id}
														>
															<td>{user.id}</td>
															<td>{user.name}</td>
															<td>{user.email}</td>
															<td>
																<Button
																	id='viewButton'
																	type='button'
																	label='View'
																	onClick={() => {
																		window.location.hash = `#/dashboard/users/${user.id}`;
																	}}
																/>
															</td>
														</tr>
													);
												})
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

export default Users;