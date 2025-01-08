
module.exports = {
	entry: './src/index.js',
	fallback: {
		"fs": false,
		"os": false,
		"path": false
	}
};