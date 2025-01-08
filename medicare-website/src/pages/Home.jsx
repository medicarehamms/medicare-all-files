
import React from 'react';

import '../css/home.css';

import Header from '../components/Header';

import Icon from '../assets/Icon.png';

import Dental from '../assets/dental.jpg';
import Checkup from '../assets/checkup.jpg';
import Circumcision from '../assets/circum.jpg';
import Vaccination from '../assets/vaccination.png';
import Prenatal from '../assets/prenatal.jpg';

import MedicalReport from '../assets/medical-report.png';
import Nurse from '../assets/nurse.png';
import Vaccine from '../assets/vaccine.png';
import DentistChair from '../assets/dentist-chair.png';
import Bandage from '../assets/bandage.png';

import FirstAid from '../assets/firstaid.png';
import Offer from '../assets/offer.png';
import Schedule from '../assets/schedule.png';
import LoyaltyProgram from '../assets/loyalty-program.png';

import Medicine from '../assets/medicine.png';

class Home extends React.Component {
	constructor(props) {
		super(props);

		this.API_URL = window.process?.env?.REACT_APP_API_URL?.trim() || 'http://localhost:4000';

		this.state = {
			loaded: false,
			API_URL: this.API_URL,

			doctors: [],

			prices: [
				{
					id: '',
					image: '',
					name: '',
					items: [
						{
							barcode: '',
							categoryID: '',
							id: '',
							name: '',
							price: 0,
							stock: 0
						}
					]
				}
			],

			displayedPrices: {
				id: '',
				image: '',
				name: '',
				items: [
					{
						barcode: '',
						categoryID: '',
						id: '',
						name: '',
						price: 0,
						stock: 0
					}
				]
			}
		};
	};

	async componentDidMount() {
		await new Promise((resolve, reject) => {
			const abortController = new AbortController();

			fetch(`${this.API_URL}/api/hello`, {
				method: 'GET',
				signal: abortController.signal
			})
				.then(response => {
					if (!response.ok)
						throw new Error('API_URL not available.');
				})
				.then(data => {
					resolve();
				})
				.catch(error => {
					this.API_URL = 'https://medicare-api-8hhx.onrender.com';
					this.setState({ API_URL: this.API_URL });
					resolve();
				});
			
			setTimeout(() => {
				abortController.abort();
				resolve();
			}, 5000);
		});

		console.log('API_URL:', this.API_URL);

		await this.fetchOnlineDoctors();
		await this.fetchSupplyPrices();

		this.setState({ loaded: true });
	};

	async fetchOnlineDoctors() {
		const response = await fetch(`${this.API_URL}/api/active/doctors`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok)
			return [];

		const data = await response.json();
		
		this.setState({ doctors: data });
	};

	async fetchSupplyPrices() {
		const response = await fetch(`${this.API_URL}/api/prices`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok)
			return [];

		const data = await response.json();

		this.setState({
			prices: data,
			displayedPrices: data[0]
		});
	};

	render() {
		if (!this.state.loaded)
			return (
				<main>
				</main>
			);

		return (
			<>
				<Header
					navigations={[
						{
							label: 'Home',
							href: '#home',
							icon: (
								<svg viewBox='0 0 801 801' stroke='var(--color)' strokeWidth='60' strokeLinecap='round' fill='transparent'>
									<path d='M733.928 733.739H500.595V567.072C500.595 519.932 500.595 496.362 485.952 481.716C471.305 467.072 447.735 467.072 400.595 467.072C353.455 467.072 329.884 467.072 315.24 481.716C300.595 496.362 300.595 519.932 300.595 567.072V733.739H67.2617M67.2617 367.072L338.125 150.383C374.648 121.165 426.542 121.165 463.065 150.383L733.928 367.072M517.262 183.739V117.072C517.262 107.868 524.725 100.406 533.928 100.406H617.262C626.465 100.406 633.928 107.868 633.928 117.072V283.739M133.928 733.739V317.072M667.262 733.739V317.072' />
								</svg>
							)
						},
						{
							label: 'Services',
							href: '#services',
							icon: (
								<svg viewBox='0 0 800 800'>
									<path d='M466.666 66.6667H333.333C306.811 66.6667 281.376 77.2024 262.622 95.9561C243.868 114.71 233.333 140.145 233.333 166.667V200H166.666C140.144 200 114.709 210.536 95.9553 229.289C77.2017 248.043 66.666 273.478 66.666 300V633.333C66.666 659.855 77.2017 685.29 95.9553 704.044C114.709 722.798 140.144 733.333 166.666 733.333H633.333C659.854 733.333 685.29 722.798 704.043 704.044C722.797 685.29 733.333 659.855 733.333 633.333V300C733.333 273.478 722.797 248.043 704.043 229.289C685.29 210.536 659.854 200 633.333 200H566.666V166.667C566.666 140.145 556.13 114.71 537.377 95.9561C518.623 77.2024 493.188 66.6667 466.666 66.6667ZM299.999 166.667C299.999 157.826 303.511 149.348 309.762 143.097C316.014 136.845 324.492 133.333 333.333 133.333H466.666C475.507 133.333 483.985 136.845 490.236 143.097C496.487 149.348 499.999 157.826 499.999 166.667V200H299.999V166.667ZM666.666 300V633.333C666.666 642.174 663.154 650.652 656.903 656.904C650.652 663.155 642.173 666.667 633.333 666.667H166.666C157.825 666.667 149.347 663.155 143.096 656.904C136.845 650.652 133.333 642.174 133.333 633.333V300C133.333 291.16 136.845 282.681 143.096 276.43C149.347 270.179 157.825 266.667 166.666 266.667H633.333C642.173 266.667 650.652 270.179 656.903 276.43C663.154 282.681 666.666 291.16 666.666 300ZM433.333 433.333H499.999V500H433.333V566.667H366.666V500H299.999V433.333H366.666V366.667H433.333V433.333Z' fill='var(--color)' />
								</svg>
							)
						},
						{
							label: 'Availability',
							href: '#availability',
							icon: (
								<svg viewBox='0 0 800 800' fill='var(--color)'>
									<path d='M766.667 400C766.667 602.503 602.504 766.667 400.001 766.667C197.496 766.667 33.334 602.503 33.334 400C33.334 197.496 197.496 33.3334 400.001 33.3334C602.504 33.3334 766.667 197.496 766.667 400ZM100.228 400C100.228 565.56 234.441 699.773 400.001 699.773C565.561 699.773 699.774 565.56 699.774 400C699.774 234.44 565.561 100.228 400.001 100.228C234.441 100.228 100.228 234.44 100.228 400Z' />
									<path d='M399.999 166.667C381.589 166.667 366.666 181.59 366.666 200V415.557C366.666 415.557 366.666 424.247 370.889 430.783C373.716 436.327 378.123 441.143 383.913 444.487L537.906 533.397C553.849 542.6 574.236 537.137 583.439 521.193C592.643 505.25 587.183 484.863 571.239 475.66L433.333 396.04V200C433.333 181.591 418.409 166.667 399.999 166.667Z' />
								</svg>
							)
						},
						{
							label: 'Membership',
							href: '#membership',
							icon: (
								<svg viewBox='0 0 800 800' stroke='var(--color)' strokeWidth='50' strokeLinecap='round' fill='transparent'>
									<path d='M66.666 400C66.666 274.292 66.666 211.438 105.718 172.386C144.771 133.333 207.625 133.333 333.333 133.333H466.666C592.373 133.333 655.229 133.333 694.279 172.386C733.333 211.438 733.333 274.292 733.333 400C733.333 525.707 733.333 588.563 694.279 627.613C655.229 666.667 592.373 666.667 466.666 666.667H333.333C207.625 666.667 144.771 666.667 105.718 627.613C66.666 588.563 66.666 525.707 66.666 400Z' />
									<path d='M333.333 550H200' />
									<path d='M266.667 450H200' />
									<path d='M66.666 333.333H733.333' />
									<path d='M466.666 500C466.666 468.573 466.666 452.86 476.429 443.097C486.193 433.333 501.906 433.333 533.333 433.333C564.759 433.333 580.473 433.333 590.236 443.097C599.999 452.86 599.999 468.573 599.999 500C599.999 531.427 599.999 547.14 590.236 556.903C580.473 566.667 564.759 566.667 533.333 566.667C501.906 566.667 486.193 566.667 476.429 556.903C466.666 547.14 466.666 531.427 466.666 500Z' />
								</svg>
							)
						}
					]}
				/>
				
				<main id='home'>
					<div>
						<h3><i>We think extraordinary<br />people deserve<br />extraordinary care.</i></h3>
						<p>“Your health, our mission; your journey, our commitment.”</p>
					</div>
				</main>

				<section>
					<section id='services'>
						<h2>Services</h2>
						<main>
							<article>
								<h4>Dental</h4>
								<img src={Dental} alt='Dental' />

								<main>
									<p>Dental clinics may offer additional specialized services based on their expertise, so it’s best to consult directly with the clinic for a full list of available services.</p>

									<h6>Oral Surgery</h6>
									<p><b>Tooth Extractions</b>: Removal of damaged or impacted teeth, including wisdom teeth.</p>

									<h6>Pediatric Dentistry:</h6>
									<ul>
										<li><b>Children’s Exams and Cleanings</b>: Dental care specifically tailored for children, with a focus on preventive care.</li>
										<li><b>Sealants and Fluoride Treatments</b>: Protective treatments to help prevent tooth decay in children.</li>
										<li><b>Habit Counseling</b>: Guidance on managing habits such as thumb-sucking that can affect a child's oral health.</li>
									</ul>
								</main>
							</article>

							<article>
								<h4>Check-Up</h4>
								<img src={Checkup} alt='Dental' />

								<main>
									<h6>General Examination</h6>
									<p>The doctor reviews your personal and family medical history, including any chronic conditions, previous surgeries, and current medications.</p>

									<h6>Physical Examination</h6>
									<p>A thorough physical exam where the doctor assesses vital signs (blood pressure, heart rate, temperature, respiratory rate), checks your overall physical condition, and evaluates major systems (cardiovascular, respiratory, digestive, etc.)</p>

									<h6>LABORATORY TEST Blood Tests</h6>
									<p>Routine blood work to check various markers like blood glucose levels, cholesterol levels, liver and kidney function, and complete blood count (CBC) to detect anemia or infections.</p>

									<h6>Urinalysis</h6>
									<p>Testing a urine sample to check for kidney function, infections, or other metabolic conditions.</p>
								</main>
							</article>

							<article>
								<h4>Circumcision</h4>
								<img src={Circumcision} alt='Dental' />

								<main>
									<h6>PRE-PROCEDURE CONSULTATION Medical History Review</h6>
									<p>The healthcare provider will review the patient's medical history, including any allergies, current medications, and previous surgeries.</p>

									<h6>Physical Examination</h6>
									<p>A brief examination to assess the health of the penis and surrounding area, ensuring that the patient is a suitable candidate for the procedure.</p>

									<h6>PREPARATION FOR SURGERY Informed Consent</h6>
									<p>The patient or guardians (for minors) will be required to sign an informed consent form, acknowledging understanding of the procedure and its risks.</p>

									<h6>Preoperative Instructions</h6>
									<p>Instructions on how to prepare for the procedure, including fasting if necessary, and any medications to avoid.</p>
								</main>
							</article>

							<article>
								<h4>Vaccination</h4>
								<img src={Vaccination} alt='Vaccination' />

								<main>
									<p>Stay protected with our reliable vaccination services. We offer a wide range of vaccines for individuals of all ages, ensuring you and your loved ones are safeguarded against serious diseases.</p>

									<h6>Available Vaccines:</h6>
									<ul>
										<li><b>Vaccinations</b>: Protects against diseases like measles, polio, and more.</li>
										<li><b>Adult Vaccinations</b>: Includes flu, hepatitis, tetanus, and others to keep you healthy.</li>
										<li><b>Travel Vaccines</b>: Safeguard yourself before international travel with vaccines like yellow fever and typhoid.</li>
										<li><b>COVID-19 Vaccine</b>: Stay up-to-date with COVID-19 vaccines and boosters.</li>
									</ul>

									<h6>How It Works:</h6>
									<ul>
										<li><b>Get Vaccinated</b>: We ensure a quick, safe, and comfortable experience.</li>
										<li><b>Post-Vaccination Care</b>: Our team will guide you on what to expect after vaccination. Vaccinations are safe, effective, and critical for preventing illnesses.</li>
									</ul>
								</main>
							</article>

							<article>
								<h4>Prenatal Care</h4>
								<img src={Prenatal} alt='Prenatal' />

								<main>
									<p>Our prenatal care services are dedicated to supporting the health of both mother and baby throughout pregnancy. From your first visit, we offer comprehensive care to help ensure a safe and healthy pregnancy.</p>

									<h6>Services We Offer:</h6>
									<ul>
										<li><b>Nutritional Guidance</b>: Personalized advice to maintain a healthy diet for you and your baby.</li>
										<li><b>Pregnancy Education</b>: Learn about each stage of pregnancy and what to expect during labor and delivery.</li>
									</ul>

									<h6>Why Prenatal Care is Important:</h6>
									<p>Receiving regular prenatal care helps reduce the risk of complications and ensures your baby’s healthy development. Our team will guide you through each stage of pregnancy with the care you need.</p>
								</main>
							</article>
						</main>
					</section>

					{
						this.state.prices.length > 0 && this.state.prices[0].items.length > 0 && (
							<>
								<section id='prices'>
									<h2>Prices</h2>
									<main>
										<aside>
											<img src={this.state.displayedPrices.image} alt='Price' />
											<h4>{this.state.displayedPrices.name}</h4>

											<select
												id='priceSelect'
												onChange={async event => {
													const priceID = event.target.value;
													const price = this.state.prices.find(price => price.id === priceID);
													await this.setState({ displayedPrices: price });

													if (price.items.length < 0)
														return;

													for (let i = 0; i < price.items.length; i++) {
														try {
															const item = price.items[i];
															document.getElementById(item.id).style.transition = '';
															document.getElementById(item.id).classList.remove('mounted');
															setTimeout(() => {
																try {
																	document.getElementById(item.id).style.transition = 'left var(--transition-speed)';
																	document.getElementById(item.id).classList.add('mounted');
																} catch (error) { };
															}, 100 * i);
														} catch (error) { };
													};
												}}

												value={this.state.displayedPrices.id}
												defaultValue={this.state.prices[0].id}
											>
												{
													this.state.prices.map((price, index) => (
														<option key={index} value={price.id}>{price.name}</option>
													))
												}
											</select>
										</aside>

										<section>
											{
												this.state.displayedPrices.items.map((item, index) => (
													<PriceItem key={index} item={item} index={index} />
												))
											}
										</section>
									</main>
								</section>
							</>
						)
					}

					<section id='availability'>
						<h2>Availability</h2>
						<main>
							<article>
								<img src={MedicalReport} alt='Doctor' />
								<div>
									<h4>Doctor</h4>
									<p><i>(Check-Up)</i></p>
								</div>
								<p><b>Monday</b> - <b>Friday</b></p>
								<p><b>8:00 AM</b> - <b>7:00 PM</b></p>
							</article>

							<article>
								<img src={Nurse} alt='Nurse' />
								<div>
									<h4>Nurse Midwife</h4>
									<p><i>(Prenatal Care)</i></p>
								</div>
								<p><b>Monday</b> - <b>Saturday</b></p>
								<p><b>8:00 AM</b> - <b>7:00 PM</b></p>
							</article>

							<article>
								<img src={Vaccine} alt='Vaccine' />
								<div>
									<h4>Vaccination</h4>
									<p><i>(General)</i></p>
								</div>
								<p><b>Wednesday</b> - <b>Friday</b></p>
								<p><b>8:00 AM</b> - <b>7:00 PM</b></p>
							</article>

							<article>
								<img src={DentistChair} alt='Dentist' />
								<div>
									<h4>Dentist</h4>
									<p><i>(Dental)</i></p>
								</div>
								<p><b>Tuesday</b></p>
								<p><b>8:00 AM</b> - <b>7:00 PM</b></p>
							</article>

							<article>
								<img src={Bandage} alt='Circumcision' />
								<div>
									<h4>Surgeon</h4>
									<p><i>(Circumcision)</i></p>
								</div>
								<p><b>Thursday</b></p>
								<p><b>8:00 AM</b> - <b>7:00 PM</b></p>
							</article>
						</main>
					</section>

					{
						this.state.doctors.length > 0 && (
							<>
								<section id='onlineDoctors'>
									<h2>Online Doctor{this.state.doctors.length > 1 ? 's' : ''}</h2>
									<main>
										{
											this.state.doctors.map((doctor, index) => (
												<article key={index}>
													<img src={doctor.profile.avatar} alt='Doctor' />
													<div>
														<h4>{doctor.name}</h4>
														{doctor.profile.about && <p><i>{doctor.profile.about}</i></p>}
													</div>
												</article>
											))
										}
									</main>
								</section>
							</>
						)
					}

					<section id='membership'>
						<h2>Membership</h2>
						<main>
							<img src={Icon} alt='Medicare Icon' />

							<article>
								<h4>Membership</h4>
								<p>Join our membership for exclusive health and wellness benefits! Our plans focus on personalized care, convenience, and savings.</p>
								<br />
								<h6>Why Become a Member?</h6>
								<p>Healthcare can be complex and costly. Our membership plans streamline your experience, offering priority care, discounts, and timely access to professionals.</p>
							</article>
						</main>
					</section>

					<section id='membershipBenefits'>
						<h2>Membership Benefits</h2>
						<main>
							<section>
								<article>
									<img src={Schedule} alt='Schedule' />
									<h4>Priority Appointments</h4>
									<p>Ensure you receive the care you need when you need it.</p>
								</article>

								<article>
									<img src={Offer} alt='Offer' />
									<h4>Exclusive Discounts</h4>
									<p>Enjoy special discounts on select services and products.</p>
								</article>

								<article>
									<img src={FirstAid} alt='First Aid' />
									<h4>Personalized Care</h4>
									<p>Receive tailored care plans to meet your unique health needs.</p>
								</article>
							</section>

							<section>
								<article>
									<h4>How to Become a Member?</h4>
									<ol>
										<li><b>Visit Our Center</b>: Speak with staff about membership plans.</li>
										<li><b>Complete the Membership Form</b>: Fill out the application and choose a payment method.</li>
										<li><b>Enjoy Your Benefits</b>: Your membership activates immediately.</li>
										<li><b>Join Today and Unlock Exclusive Benefits</b>, Start Your Membership Now and Save, Become a Member and Enjoy Instant Savings, Get Started Today for Just ₱599.</li>
									</ol>
								</article>

								<article>
									<img src={LoyaltyProgram} alt='Loyalty Program' />
								</article>
							</section>
						</main>
					</section>
				</section>

				<footer>
					<main>
						<article>
							<h4>Download Our App!</h4>
							<img src={`https://barcode.orcascan.com/?type=datamatrix&data=${this.state.API_URL}/download&format=svg&padding=0`} alt='Medicine' />
							<p>Scan the QR code to download our app and access our services on the go!</p>
						</article>

						<article>
							<img src={Medicine} alt='Medicine' />
							<p>"Providing expert care in circumcision, dental services, and routine check-ups to ensure your health and comfort."</p>
						</article>

						<article>
							<h4>Available</h4>
							<p><b>Monday</b> - <b>Saturday</b></p>
							<br />
							<h4>Hours</h4>
							<p><b>8:00 AM</b> - <b>7:00 PM</b></p>
						</article>

						<article>
							<h4>Contact Us</h4>
							<div><b>Phone:</b> 123-456-7890</div>
							<div><b>Email:</b> medicare.hamms@gmail.com</div>
						</article>
					</main>

					<p>&copy; 2025 Medicare. All rights reserved.</p>
				</footer>
			</>
		);
	};
};

export default Home;

class PriceItem extends React.Component {
	constructor(props) {
		super(props);

		this.state = {};
	};

	render() {
		return (
			<article id={this.props.item.id} className='mounted'>
				<h4>{this.props.item.name}</h4>
				<p><b>Price:</b> ₱{this.props.item.price.toFixed(2)}</p>
				<p><b>Stock:</b> {this.props.item.stock}</p>
			</article>
		);
	};
}