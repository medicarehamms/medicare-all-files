const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');

const dir = path.join(__dirname);

(async () => {
	console.log(`Working directory: ${dir}`);

	// Check if `npm`, `expo`, `expo-cli`, `react-scripts`, and `electron-forge` are installed and up-to-date
	const packages = ['npm', 'expo', 'expo-cli', 'react-scripts', 'electron-forge'];
	const packageList = [];
	console.log('Checking dependencies...');
	await new Promise((resolve, reject) => {
		exec('npm list -g --depth=0', (err, stdout, stderr) => {
			if (err) {
				reject(err);
			}
			const lines = stdout.split('\n');
			for (const line of lines) {
				const package = {
					name: line.split('@')[0].split(' ')[1],
					version: line.split('@')[1]
				};

				for (const pkg of packages) {
					if (pkg === package.name) {
						packageList.push(package);
					};
				};
			};
			resolve();
		});
	});
	console.log('Dependencies checked.');
	console.log(packageList.map(pkg => `\t${pkg.name}: ${pkg.version}`).join('\n'));

	// Install missing dependencies
	for (const pkg of packages) {
		if (!packageList.find(p => p.name.includes(pkg))) {
			process.stdout.write(`Installing ${pkg}...`);
			await new Promise((resolve, reject) => {
				exec(`npm install -g ${pkg} --legacy-peer-deps  --force`, (err, stdout, stderr) => {
					if (err) {
						reject(err);
					};
					resolve();
				});
			});
			process.stdout.write(' done.\n');
		};
	};

	console.log('Checking if all dependencies are up-to-date...');
	for (const pkg of packageList) {
		process.stdout.write(`\t${pkg.name}...`);
		await new Promise((resolve, reject) => {
			exec(`npm show ${pkg.name} version`, async (err, stdout, stderr) => {
				if (err) {
					reject(err);
				}
				const latestVersion = stdout.trim();
				if (pkg.version !== latestVersion) {
					process.stdout.write(` updating to ${latestVersion}...`);
					await new Promise((resolve, reject) => {
						exec(`npm install -g ${pkg.name}@${latestVersion}`, (err, stdout, stderr) => {
							if (err) {
								reject(err);
							};
							resolve();
						});
					});
					process.stdout.write(' done.\n');
				} else {
					process.stdout.write(' up-to-date.\n');
				};
				resolve();
			});
		});
	};


	// Get IPv4 address
	const IPv4 = (await new Promise((resolve, reject) => {
		exec('ipconfig', (err, stdout, stderr) => {
			if (err) {
				reject(err);
			};
			const lines = stdout.split('\n');
			let ip = '';
			for (const line of lines) {
				if (line.includes('IPv4 Address')) {
					ip = line.split(': ')[1];
				};
			};
			resolve(ip);
		});
	})).trim();
	const API_URL = `http://${IPv4}:4000`;

	// Start Projects

	// Check if wt.exe is installed
	const wtInstalled = await new Promise((resolve, reject) => {
		exec('where wt', (err, stdout, stderr) => {
			if (err) {
				reject(err);
			};
			resolve(stdout.includes('wt.exe'));
		});
	}).catch(() => false);

	// Start API
	process.stdout.write('Starting Projects...');
	if (wtInstalled) {
		await new Promise((resolve, reject) => {
			// start wt -p "Command Prompt" -d "${dir}/medicare-api" cmd /K "if exist node_modules\ ( npm run dev ) else ( npm install & npm run dev )"; ^
			// 	split-pane -V -p "Command Prompt" -d "${dir}/medicare-mobile" cmd /K "if exist node_modules\ ( set EXPO_PUBLIC_API_URL=%API_URL% & npx expo start ) else ( npm install & set EXPO_PUBLIC_API_URL=%API_URL% & npx expo start )"; ^
			// 	move-focus right; ^
			// 	split-pane -H -p "Command Prompt" -d "${dir}/medicare-desktop" cmd /K "if exist node_modules\ ( set API_URL=${API_URL} & npx electron-forge start ) else ( npm install & set API_URL=${API_URL} & npx electron-forge start )"; ^
			// 	split-pane -H -p "Command Prompt" -d "${dir}/medicare-website" cmd /K "if exist node_modules\ ( set API_URL=%API_URL% & set PORT=8090 & npx react-scripts start ) else ( npm install --legacy-peer-deps  --force & set API_URL=%API_URL% & set PORT=8090 & npx react-scripts start )"; ^
			// 	move-focus right;
			spawn('wt', [
				'-p', 'Command Prompt',
				'-d', `${dir}/medicare-api`,
				'cmd', '/K', 'if exist node_modules\\ ( npm run dev ) else ( npm install & npm run dev )',
				';',
				'split-pane', '-V', '-p', 'Command Prompt',
				'-d', `${dir}/medicare-mobile`,
				'cmd', '/K', `if exist node_modules\\ ( set EXPO_PUBLIC_API_URL=${API_URL} & npx expo start ) else ( npm install & set EXPO_PUBLIC_API_URL=${API_URL} & npx expo start )`,
				';',
				'move-focus', 'right',
				';',
				'split-pane', '-H', '-p', 'Command Prompt',
				'-d', `${dir}/medicare-desktop`,
				'cmd', '/K', `if exist node_modules\\ ( set API_URL=${API_URL} & npx electron-forge start ) else ( npm install & set API_URL=${API_URL} & npx electron-forge start )`,
				';',
				'split-pane', '-H', '-p', 'Command Prompt',
				'-d', `${dir}/medicare-website`,
				'cmd', '/K', `if exist node_modules\\ ( set REACT_APP_API_URL=${API_URL} & set PORT=8090 & npx react-scripts start ) else ( npm install --legacy-peer-deps  --force & set REACT_APP_API_URL=${API_URL} & set PORT=8090 & npx react-scripts start )`,
				';',
				'move-focus', 'right'
			], {
				detached: true,
				stdio: 'inherit'
			}, (err, stdout, stderr) => {
				if (err) {
					reject(err);
				};
				resolve();
			});
		});
		console.log(' done.');
	} else {
		// start cmd /K "cd ${dir}/medicare-api & if exist node_modules\ ( npm run dev ) else ( npm install & npm run dev )";
		// start cmd /K "cd ${dir}/medicare-mobile & if exist node_modules\ ( set EXPO_PUBLIC_API_URL=${API_URL} & npx expo start ) else ( npm install & set EXPO_PUBLIC_API_URL=${API_URL} & npx expo start )";
		// start cmd /K "cd ${dir}/medicare-desktop & if exist node_modules\ ( set API_URL=${API_URL} & npx electron-forge start ) else ( npm install & set API_URL=${API_URL} & npx electron-forge start )";
		// start cmd /K "cd ${dir}/medicare-website & if exist node_modules\ ( set API_URL=${API_URL} & set PORT=8090 & npx react-scripts start ) else ( npm install --legacy-peer-deps  --force & set API_URL=${API_URL} & set PORT=8090 & npx react-scripts start )";
		exec(`start cmd /K "cd ${dir}/medicare-api & if exist node_modules\\ ( npm run dev ) else ( npm install & npm run dev )"`, (err, stdout, stderr) => {
			if (err) {
				reject(err);
			};
			resolve();
		});

		exec(`start cmd /K "cd ${dir}/medicare-mobile & if exist node_modules\\ ( set EXPO_PUBLIC_API_URL=${API_URL} & npx expo start ) else ( npm install & set EXPO_PUBLIC_API_URL=${API_URL} & npx expo start )"`, (err, stdout, stderr) => {
			if (err) {
				reject(err);
			};
			resolve();
		});

		exec(`start cmd /K "cd ${dir}/medicare-desktop & if exist node_modules\\ ( set API_URL=${API_URL} & npx electron-forge start ) else ( npm install & set API_URL=${API_URL} & npx electron-forge start )"`, (err, stdout, stderr) => {
			if (err) {
				reject(err);
			};
			resolve();
		});

		exec(`start cmd /K "cd ${dir}/medicare-website & if exist node_modules\\ ( set REACT_APP_API_URL=${API_URL} & set PORT=8090 & npx react-scripts start ) else ( npm install --legacy-peer-deps  --force & set REACT_APP_API_URL=${API_URL} & set PORT=8090 & npx react-scripts start )"`, (err, stdout, stderr) => {
			if (err) {
				reject(err);
			};
			resolve();
		});

		console.log(' done.');
	};

	// Exit
	process.exit(0);
})()