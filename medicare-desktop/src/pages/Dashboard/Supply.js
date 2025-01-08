import React from 'react';

import '../../css/dashboard.css';
import '../../css/dashboard/supply.css';

import Header from '../../components/Header';
import Button from '../../components/Button';
import Input from '../../components/Input';

import globals from '../../utils/globals';

class Supply extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			categories: [],
			loaded: false,
			scanning: false
		};
	};

	async fetchSupplyCategories() {
		const categoriesResponse = await fetch(`${globals.backendURL}/api/supply/categories`);
		const categoriesData = await categoriesResponse.json();
		const categories = [];
		for (const id in categoriesData) {
			const category = categoriesData[id];
			categories.push({
				id,
				image: category.image,
				name: category.name
			});
		};
		this.setState({
			categories: categories
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

		const subscribe = async () => {
			globals.ws.send(JSON.stringify({
				type: 'subscribe',
				page: 'supplyCategories'
			}));
	
			globals.ws.onmessage = (event) => {
				const data = JSON.parse(event.data) ?? {};
				if (data.type === 'refresh' && data.from === 'supplyCategories') {
					this.fetchSupplyCategories();
					console.log('Refreshed supply categories');
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

		this.fetchSupplyCategories();
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
									<h1>Supply Category Section</h1>

									<div>
										<Button
											id='scanBarcodeButton'
											type='button'
											label='Scan Barcode'
											onClick={() => {
												setTimeout(() => {
													document.getElementById('barcodeInput').focus();
												}, 10);
												globals.Swal.fire({
													title: '<h1>Scan Barcode</h1>',
													html: `
<style>
	#scanBarcodeForm {
		padding: 2rem;

		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 2rem;

		text-align: center;
	}
</style>
<div id="scanBarcodeForm">
	<p>Scan the barcode of the item.</p>

	<input
		id="barcodeInput"
		class="input"
		type="text"
		placeholder="Barcode"
		onKeyDown="((event) => {
			if (event.key === 'Enter') {
				const barcode = event.target.value;
				const confirmButton = document.querySelector('.swal2-confirm');
				confirmButton.click();
			};
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
													const barcode = document.getElementById('barcodeInput').value;
													console.log(result);

													if (result.isConfirmed) {
														const response = await fetch(`${globals.backendURL}/api/supply/barcode/?barcode=${barcode}`, {
															method: 'SEARCH'
														});

														if (response.status === 200) {
															const item = await response.json();
															const categoryID = item.categoryID;
															const itemID = item.id;

															window.location.hash = `#/dashboard/supply/${categoryID}/?itemID=${itemID}`;
														} else {
															globals.Swal.fire({ title: '<h1>Error</h1>', html: '<p>Item not found!</p>', confirmButtonColor: 'var(--color-primary)', icon: 'error', color: 'var(--color-font-dark)' });
														};
													};
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
									id='categoryCards'
								>
									{
										this.state.categories.map((category, index) => (
											<CategoryCard
												key={index}
												name={category.name}
												image={category.image}
												id={category.id}
											/>
										))
									}

									<div
										id='addButton'

										onClick={() => {

											globals.Swal.fire({
												title: '<h1>Add Supply Category</h1>',
												html: `
<style>
	#addSupplyCategoryForm {
		padding: 2rem;

		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 2rem;

		text-align: center;
	}
	#addSupplyCategoryForm > img {
		width: 20rem;
		height: 16rem;
		object-fit: cover;
	}
	#addSupplyCategoryForm > input[type="file"] {
		display: none;
	}
	#addSupplyCategoryForm > div {
		display: flex;
		flex-direction: row;
		gap: 2rem;
	}
</style>
<div id="addSupplyCategoryForm">
	<img
		id="categoryImage"
		alt="Category Image"
		src="https://via.placeholder.com/200x160"

		onclick="document.getElementById('categoryImageInput').click();"
	/>

	<input
		type="file"
		accept="image/*"
		id="categoryImageInput"
		onchange="((event) => {
						const file = event.target.files[0];
						const reader = new FileReader();
						reader.onload = (event) => {
							document.getElementById('categoryImage').src = event.target.result;
						};
						reader.readAsDataURL(file);
					})(event);"
	/>

	<button
		type="button"
		class="button"
		onclick="document.getElementById('categoryImageInput').click();"
	>
		Upload Image
	</button>

	<input
		id="category"
		class="input"
		type="text"
		placeholder="Category"
		onchange="((event) => {
		})(event);"
	/>
</div>
												`,
												width: '60rem',
												showCancelButton: true,
												confirmButtonText: 'Add',
												confirmButtonColor: 'var(--color-primary)',
												cancelButtonText: 'Cancel',
												cancelButtonColor: 'var(--color-font-dark)'
											}).then(async (result) => {
												if (result.isConfirmed) {
													const name = document.getElementById('category').value;
													const image = document.getElementById('categoryImageInput').files[0];

													if (!name) {
														globals.Swal.fire({ title: '<h1>Error</h1>', html: '<p>Category name is required.</p>', confirmButtonColor: 'var(--color-primary)', icon: 'error', color: 'var(--color-font-dark)' });
														return;
													};

													if (!image) {
														globals.Swal.fire({ title: '<h1>Error</h1>', html: '<p>Category image is required.</p>', confirmButtonColor: 'var(--color-primary)', icon: 'error', color: 'var(--color-font-dark)' });
														return;
													};

													const reader = new FileReader();
													reader.onload = async (event) => {
														const image = event.target.result;
														const response = await fetch(`${globals.backendURL}/api/supply/categories`, {
															method: 'POST',
															body: JSON.stringify({
																name,
																image
															})
														});

														if (response.status === 200) {
															globals.Swal.fire({ title: '<h1>Success</h1>', html: '<p>Category added successfully.</p>', confirmButtonColor: 'var(--color-primary)', icon: 'success', color: 'var(--color-font-dark)' });
															this.fetchSupplyCategories();
														} else {
															globals.Swal.fire({ title: '<h1>Error</h1>', html: '<p>Category could not be added.</p>', confirmButtonColor: 'var(--color-primary)', icon: 'error', color: 'var(--color-font-dark)' });
															this.fetchSupplyCategories();
														};
													};
													reader.readAsDataURL(image);
												};
											});
										}}
									/>
								</div>
							</>
						) : null
					}
				</main>
			</>
		);
	};
};

export default Supply;

class CategoryCard extends React.Component {
	render() {
		return (
			<a
				id={this.props.id}
				className='categoryCard'
				href={`#/dashboard/supply/${this.props.id}/`}
			>
				<img
					src={this.props.image || 'https://via.placeholder.com/200'}
					alt={this.props.name}
				/>
				<h2>{this.props.name}</h2>
			</a>
		);
	};
};