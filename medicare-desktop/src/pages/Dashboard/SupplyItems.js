import React from 'react';

import '../../css/dashboard.css';
import '../../css/dashboard/supply.css';

import Header from '../../components/Header';
import Button from '../../components/Button';

import globals from '../../utils/globals';

class SupplyItems extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			category: {
				name: '',
				id: '',
				image: 'https://picsum.photos/200/160'
			},
			supplyItems: [],
			loaded: false
		};
	};

	async fetchSupplyItems() {
		const categoryID = (() => {
			const path = window.location.hash;
			const id = path.split('/')[3];
			try {
				return id.charAt(0).toUpperCase() + id.slice(1);
			} catch (error) {
				window.location.hash = '#/dashboard/supply';
			};
		})();

		const categoryResponse = await fetch(`${globals.backendURL}/api/supply/categories/${categoryID}`);
		if (!categoryResponse.ok) {
			await globals.Swal.fire({
				title: '<h1>Error</h1>',
				html: '<p>Failed to fetch category</p>',
				icon: 'error',
				confirmButtonColor: 'var(--color-primary)',
				color: 'var(--color-font-dark)'
			});
			window.location.hash = '#/dashboard/supply';
		};
		const categoryData = await categoryResponse.json();
		this.setState({
			category: {
				id: categoryData.id,
				name: categoryData.name,
				image: categoryData.image
			}
		});

		const itemsResponse = await fetch(`${globals.backendURL}/api/supply/categories/${categoryID}/items`);
		const items = [];
		const itemsData = await itemsResponse.json();
		for (const id in itemsData) {
			const item = itemsData[id];
			items.push({
				id: item.id,
				name: item.name,
				price: item.price,
				stock: item.stock,
				barcode: item.barcode || null
			});
		};

		this.setState({
			supplyItems: items,
			loaded: true
		});
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

		const categoryID = (() => {
			const path = window.location.hash;
			const id = path.split('/')[3];
			return id.charAt(0).toUpperCase() + id.slice(1);
		})();

		const subscribe = async () => {
			globals.ws.send(JSON.stringify({
				type: 'subscribe',
				page: `supplyCategories/${categoryID}`
			}));
	
			globals.ws.onmessage = (event) => {
				const data = JSON.parse(event.data) ?? {};
				if (data.type === 'refresh' && data.from === `supplyCategories/${categoryID}`) {
					this.fetchSupplyItems();
				} else if (data.type === 'redirect' && data.from === `supplyCategories/${categoryID}`) {
					window.location.href = '#/dashboard/supply';
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

		this.fetchSupplyItems();
	};

	componentDidUpdate() {
		if (!this.state.loaded) return;

		const table = document.querySelector('#itemsPanel table');
		const controlRow = document.querySelector('#controlRow');
		const thead = table.querySelector('thead');
		const th = thead.querySelectorAll('th');
		for (const tHead of th) {
			tHead.onclick = null;
			tHead.onclick = () => {
				const index = [...th].indexOf(tHead);
				const order = table.getAttribute('data-order');
				const tbody = table.querySelector('tbody');
				const tr = tbody.querySelectorAll('tr:not(#controlRow)');

				const sorted = [];
				if (index === 0) {
					// Sort by item name inside input
					const sort = Array.from(tr).sort((a, b) => {
						const inputA = a.querySelector('input');
						const inputB = b.querySelector('input');

						if (order === 'ascending') {
							if (inputA.value < inputB.value)
								return -1;
							else if (inputA.value > inputB.value)
								return 1;
							else
								return 0;
						} else {
							if (inputA.value < inputB.value)
								return 1;
							else if (inputA.value > inputB.value)
								return -1;
							else
								return 0;
						};
					});

					sorted.push(...sort);
				} else {
					// Sort by stock
					const sort = Array.from(tr).sort((a, b) => {
						const stockA = parseInt(a.querySelectorAll('td')[index].textContent);
						const stockB = parseInt(b.querySelectorAll('td')[index].textContent);

						if (order === 'ascending') {
							return stockA - stockB;
						} else {
							return stockB - stockA;
						};
					});

					sorted.push(...sort);
				};

				if (order === 'ascending') {
					table.setAttribute('data-order', 'descending');
				} else {
					table.setAttribute('data-order', 'ascending');
				};

				// Remove all rows
				for (const row of tr) {
					tbody.removeChild(row);
				};

				// Add sorted rows
				for (const row of sorted) {
					tbody.insertBefore(row, controlRow);
				};

				// Add back control row
				tbody.appendChild(controlRow);
			};
		};

		const params = new URLSearchParams(window.location.hash.split('?')[1]);
		if (params.get('itemID')) {
			const itemID = params.get('itemID');
			const item = document.getElementById(itemID);
			if (item) {
				item.scrollIntoView();
				item.style.backgroundColor = 'var(--color-primary)';
				item.style.transition = 'background-color 0.25s';
				setTimeout(() => {
					item.style.backgroundColor = '';
				}, 250);
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
										<b><a href='#/dashboard/supply'>Supply</a></b>
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
					id='supply'
				>
					{
						this.state.loaded ? (
							<>
								<div
									id='head'
								>
									<h1>Supply</h1>

									<Button
										id='addItemButton2'
										type='button'
										label='Add'
										onClick={async () => {
											document.getElementById('addItemButton').click();
										}}
									/>
									<Button
										id='backButton'
										type='button'
										label='Back'
										onClick={() => {
											window.location.hash = '#/dashboard/supply';
										}}
									/>
								</div>
								<div
									id='itemsPanel'
								>
									<div id='categoryPanel'>
										<img
											src={this.state.category.image}
											alt={this.state.category.name}
											onClick={() => {
												document.getElementById('categoryImageInput').click();
											}}
										/>

										<input
											type='file'
											accept='image/*'
											id='categoryImageInput'
											onChange={(event) => {
												const file = event.target.files[0];
												const reader = new FileReader();
												reader.onload = async (event) => {
													this.setState({
														category: {
															...this.state.category,
															image: event.target.result
														}
													});

													const categoryID = (() => {
														const path = window.location.hash;
														const id = path.split('/')[3];
														return id.charAt(0).toUpperCase() + id.slice(1);
													})();
													await fetch(`${globals.backendURL}/api/supply/categories/${categoryID}`, {
														method: 'PATCH',
														body: JSON.stringify({
															image: event.target.result
														})
													});
													this.fetchSupplyItems();
												};
												reader.readAsDataURL(file);
											}}
										/>
										<div>
											<h2>
												<input
													type='text'
													defaultValue={this.state.category.name}
													style={{
														fontSize: 'inherit',
														textAlign: 'inherit',
														width: '100%',
														border: 'none',
														fontWeight: 'inherit',
														color: 'inherit',
														backgroundColor: 'inherit'
													}}
													onBlur={async (event) => {
														const name = event.target.value;
														const categoryID = (() => {
															const path = window.location.hash;
															const id = path.split('/')[3];
															return id.charAt(0).toUpperCase() + id.slice(1);
														})();
														const response = await fetch(`${globals.backendURL}/api/supply/categories/${categoryID}`, {
															method: 'PATCH',
															body: JSON.stringify({
																name
															})
														});

														if (response.status === 200) {
															const data = await response.json();
															this.setState({
																category: data
															});
														} else {
															event.target.value = this.state.category.name;
															globals.Swal.fire({ title: '<h1>Error</h1>', html: '<p>Failed to update category name</p>', confirmButtonColor: 'var(--color-primary)', icon: 'error', color: 'var(--color-font-dark)' });
														};
													}}
													onKeyDown={(event) => {
														if (event.key === 'Enter')
															event.target.blur();
													}}
												/>
											</h2>
											<Button
												id='deleteCategoryButton'
												type='button'
												label='Delete Category'
												onClick={async () => {
													const categoryID = (() => {
														const path = window.location.hash;
														const id = path.split('/')[3];
														return id.charAt(0).toUpperCase() + id.slice(1);
													})();
													const response = await fetch(`${globals.backendURL}/api/supply/categories/${categoryID}`, {
														method: 'DELETE',
													});

													if (response.status === 200) {
														window.location.hash = '#/dashboard/supply';
													} else {
														globals.Swal.fire({ title: '<h1>Error</h1>', html: '<p>Failed to delete category</p>', confirmButtonColor: 'var(--color-primary)', icon: 'error', color: 'var(--color-font-dark)' });
													};
												}}
											/>
										</div>
									</div>
									<table>
										<thead>
											<tr>
												<th>Drugname</th>
												<th>Price</th>
												<th>Barcode</th>
												<th>Stock</th>
												<th>Actions</th>
											</tr>
										</thead>
										<tbody>
											{this.state.supplyItems.map((item, index) => (
												<tr
													key={index}
													id={item.id}
												>
													<td
														onClick={() => {
															document.querySelector(`#${item.id} > td:nth-child(1) > input`).focus();
														}}
													>
														<input
															type='text'
															onBlur={async (event) => {
																const name = event.target.value;
																const response = await fetch(`${globals.backendURL}/api/supply/items/${item.id}`, {
																	method: 'PATCH',
																	body: JSON.stringify({
																		name
																	})
																});

																if (response.status === 200) {
																	const data = await response.json();
																	this.setState({
																		supplyItems: this.state.supplyItems.map((supplyItem, supplyIndex) => {
																			if (index === supplyIndex) {
																				return data;
																			};
																			return supplyItem;
																		})
																	});
																} else {
																	event.target.value = this.state.supplyItems[index].name;
																	globals.Swal.fire({ title: '<h1>Error</h1>', html: '<p>Failed to update item name</p>', confirmButtonColor: 'var(--color-primary)', icon: 'error', color: 'var(--color-font-dark)' });
																};
															}}
															onKeyDown={(event) => {
																if (event.key === 'Enter')
																	event.target.blur();
															}}
															defaultValue={item.name}
															value={item.name}
															onChange={(event) => {
																this.setState({
																	supplyItems: this.state.supplyItems.map((supplyItem, supplyIndex) => {
																		if (index === supplyIndex) {
																			return {
																				...supplyItem,
																				name: event.target.value
																			};
																		};
																		return supplyItem;
																	})
																});
															}}
														/>
													</td>
													<td
														onClick={() => {
															document.querySelector(`#${item.id} > td:nth-child(2) > input`).focus();
														}}
													>
														₱ <input
															type='number'
															onBlur={async (event) => {
																const price = parseFloat(event.target.value);
																const response = await fetch(`${globals.backendURL}/api/supply/items/${item.id}`, {
																	method: 'PATCH',
																	body: JSON.stringify({
																		price
																	})
																});

																if (response.status === 200) {
																	const data = await response.json();
																	this.setState({
																		supplyItems: this.state.supplyItems.map((supplyItem, supplyIndex) => {
																			if (index === supplyIndex) {
																				return data;
																			};
																			return supplyItem;
																		})
																	});
																} else {
																	event.target.value = this.state.supplyItems[index].price;
																	globals.Swal.fire({ title: '<h1>Error</h1>', html: '<p>Failed to update price</p>', confirmButtonColor: 'var(--color-primary)', icon: 'error', color: 'var(--color-font-dark)' });
																};
															}}
															onKeyDown={(event) => {
																if (event.key === 'Enter')
																	event.target.blur();
															}}
															defaultValue={item.price}
															value={item.price}
															onChange={(event) => {
																this.setState({
																	supplyItems: this.state.supplyItems.map((supplyItem, supplyIndex) => {
																		if (index === supplyIndex) {
																			return {
																				...supplyItem,
																				price: parseFloat(event.target.value)
																			};
																		};
																		return supplyItem;
																	})
																});
															}}
														/>
													</td>
													<td
														onClick={() => {
															document.querySelector(`#${item.id} > td:nth-child(3) > input`).focus();
														}}
													>
														<img
															src={`https://barcode.orcascan.com/?data=${item.barcode}&type=code128&format=svg`}
															onClick={() => {
																document.querySelector(`#${item.id} > td:nth-child(3) > input`).focus();
															}}
														/>
														<br />
														<input
															type='text'
															onFocus={(event) => {
																event.target.value = '';
															}}
															onBlur={async (event) => {
																const barcode = event.target.value;
																const response = await fetch(`${globals.backendURL}/api/supply/items/${item.id}`, {
																	method: 'PATCH',
																	body: JSON.stringify({
																		barcode
																	})
																});

																if (response.status === 200) {
																	const data = await response.json();
																	this.setState({
																		supplyItems: this.state.supplyItems.map((supplyItem, supplyIndex) => {
																			if (index === supplyIndex) {
																				return data;
																			};
																			return supplyItem;
																		})
																	});
																} else {
																	event.target.value = this.state.supplyItems[index].barcode;
																	globals.Swal.fire({ title: '<h1>Error</h1>', html: '<p>Failed to update barcode</p>', confirmButtonColor: 'var(--color-primary)', icon: 'error', color: 'var(--color-font-dark)' });
																};
															}}
															onKeyDown={(event) => {
																if (event.key === 'Enter')
																	event.target.blur();
															}}
															defaultValue={item.barcode}
															value={item.barcode}
															onChange={(event) => {
																this.setState({
																	supplyItems: this.state.supplyItems.map((supplyItem, supplyIndex) => {
																		if (index === supplyIndex) {
																			return {
																				...supplyItem,
																				barcode: event.target.value
																			};
																		};
																		return supplyItem;
																	})
																});
															}}
														/>
													</td>
													<td
														onClick={() => {
															document.querySelector(`#${item.id} > td:nth-child(4) > input`).focus();
														}}
													>
														<input
															type='number'
															onBlur={async (event) => {
																const stock = parseInt(event.target.value);
																const response = await fetch(`${globals.backendURL}/api/supply/items/${item.id}`, {
																	method: 'PATCH',
																	body: JSON.stringify({
																		stock
																	})
																});

																if (response.status === 200) {
																	const data = await response.json();
																	this.setState({
																		supplyItems: this.state.supplyItems.map((supplyItem, supplyIndex) => {
																			if (index === supplyIndex) {
																				return data;
																			};
																			return supplyItem;
																		})
																	});
																} else {
																	event.target.value = this.state.supplyItems[index].stock;
																	globals.Swal.fire({ title: '<h1>Error</h1>', html: '<p>Failed to update stock</p>', confirmButtonColor: 'var(--color-primary)', icon: 'error', color: 'var(--color-font-dark)' });
																};
															}}
															onKeyDown={(event) => {
																if (event.key === 'Enter')
																	event.target.blur();
															}}
															defaultValue={item.stock}
															value={item.stock}
															onChange={(event) => {
																this.setState({
																	supplyItems: this.state.supplyItems.map((supplyItem, supplyIndex) => {
																		if (index === supplyIndex) {
																			return {
																				...supplyItem,
																				stock: parseInt(event.target.value)
																			};
																		};
																		return supplyItem;
																	})
																});
															}}
														/>
													</td>
													<td>
														<div>
															<Button
																id='addButton'
																type='button'
																label='+'
																size='tiny'
																onClick={async (event) => {
																	event.target.disabled = true;
																	const item = this.state.supplyItems[index];
																	const response = await fetch(`${globals.backendURL}/api/supply/items/${item.id}`, {
																		method: 'PATCH',
																		body: JSON.stringify({
																			stock: item.stock + 1
																		})
																	});
																	const data = await response.json();
																	this.setState({
																		supplyItems: this.state.supplyItems.map((supplyItem, supplyIndex) => {
																			if (index === supplyIndex) {
																				return data;
																			};
																			return supplyItem;
																		})
																	});
																	event.target.disabled = false;
																}}
															/>
															<Button
																id='subtractButton'
																type='button'
																label='-'
																size='tiny'
																onClick={async (event) => {
																	event.target.disabled = true;
																	const item = this.state.supplyItems[index];
																	if (item.stock <= 0) {
																		const response = await fetch(`${globals.backendURL}/api/supply/items/${item.id}`, {
																			method: 'DELETE',
																		});
																		const data = await response.json();
																		this.setState({
																			supplyItems: this.state.supplyItems.filter((supplyItem, supplyIndex) => index !== supplyIndex)
																		});
																		return;
																	};
																	const response = await fetch(`${globals.backendURL}/api/supply/items/${item.id}`, {
																		method: 'PATCH',
																		body: JSON.stringify({
																			stock: item.stock - 1
																		})
																	});
																	const data = await response.json();
																	this.setState({
																		supplyItems: this.state.supplyItems.map((supplyItem, supplyIndex) => {
																			if (index === supplyIndex) {
																				return data;
																			};
																			return supplyItem;
																		})
																	});
																	event.target.disabled = false;
																}}
															/>
														</div>
													</td>
												</tr>
											))}
											<tr
												id='controlRow'
											>
												<td colSpan={3}>
													* click on the field to edit
												</td>
												<td colSpan={2}>
													<Button
														id='addItemButton'
														type='button'
														label='Add'
														onClick={async () => {
															setTimeout(() => {
																document.querySelector('#itemForm > input').focus();
															}, 250);
															globals.Swal.fire({
																title: '<h1>Add Item</h1>',
																html: `
<style>
	#itemForm {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 2rem;
	}
</style>
<div id='itemForm'>
	<input
		class="input"
		type="text"
		placeholder="Item Name"
		onKeyDown="((event) => {
			if (event.key === 'Enter') {
				const barcode = event.target.value;
				const confirmButton = document.querySelector('.swal2-confirm');
				confirmButton.click();
			};
			if (event.key === 'Escape')
				event.target.blur();
		})(event);"
		onBlur="((event) => {
			setTimeout(() => {
				try {
					const cancelButton = document.querySelector('.swal2-cancel');
					cancelButton.click();
				} catch (error) { };
			}, 250);
		})(event);"
		required
	/>
</div>
												`,
																width: '40rem',
																showCancelButton: true,
																confirmButtonText: 'Add',
																confirmButtonColor: 'var(--color-primary)',
																cancelButtonText: 'Cancel',
																cancelButtonColor: 'var(--color-font-dark)',
															}).then(async (result) => {
																if (result.isConfirmed) {
																	const categoryID = (() => {
																		const path = window.location.hash;
																		const id = path.split('/')[3];
																		return id.charAt(0).toUpperCase() + id.slice(1);
																	})();
																	const body = JSON.stringify({
																		categoryID: categoryID,
																		name: document.querySelector('#itemForm > input').value,
																		price: 1,
																		stock: 1
																	});

																	const response = await fetch(`${globals.backendURL}/api/supply/items`, {
																		method: 'POST',
																		body
																	});
																	const data = await response.json();
																	this.setState({
																		supplyItems: [...this.state.supplyItems, data]
																	});

																	globals.Swal.fire({ title: '<h1>Success</h1>', html: '<p>Item added</p>', confirmButtonColor: 'var(--color-primary)', icon: 'success', color: 'var(--color-font-dark)' });

																	// Scroll to the bottom of the page
																	window.scrollTo(0, document.body.scrollHeight);
																};
															})
														}}
													/>
												</td>
											</tr>
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

export default SupplyItems;