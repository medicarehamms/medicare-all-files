import React from 'react';

import {
	BrowserRouter as Router,
	Routes,
	Route
} from 'react-router-dom';

import './font-faces/font-face.css';
import './css/global.css';

import Home from './pages/Home';

class App extends React.Component {
	render() {
		return (
			<Router>
				<Routes>
					<Route path='/' element={<Home />} />
				</Routes>
			</Router>
		);
	};
};

export default App;
