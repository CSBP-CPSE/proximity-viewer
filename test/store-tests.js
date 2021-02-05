import Store from '../src/store.js';
import assert from 'assert';

describe('Store.js Tests:\n  ------------------------------', function() {
	let TestStore = new Store();

	describe('Lat():', function() {
		it('Get default Latitude, should return 60.847', function() {
			assert.strictEqual(TestStore.Lat(), 60.847);
		});
	});
});
