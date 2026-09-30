// Color scheme handling. Loaded in <head> to set the scheme before first paint.
(function () {
	'use strict';

	var STORAGE_KEY = 'siduction-color-mode';
	var MODES = ['auto', 'light', 'dark'];
	var root = document.documentElement;

	function readMode() {
		try {
			var stored = window.localStorage.getItem(STORAGE_KEY);
			return MODES.indexOf(stored) !== -1 ? stored : 'auto';
		} catch (e) {
			return 'auto';
		}
	}

	function applyMode(mode) {
		if (mode === 'light' || mode === 'dark')
			root.setAttribute('data-theme', mode);
		else
			root.removeAttribute('data-theme');
	}

	// Run immediately to avoid a flash of the wrong scheme.
	applyMode(readMode());

	function bindToggle() {
		var button = document.getElementById('color-mode-toggle');
		if (!button)
			return;

		var baseLabel = button.getAttribute('aria-label') || '';

		// Show the current scheme in the tooltip and accessible name.
		function showMode(mode) {
			button.setAttribute('data-mode', mode);
			var name = button.getAttribute('data-label-' + mode);
			if (name) {
				button.setAttribute('aria-label', baseLabel + ': ' + name);
				button.title = baseLabel + ': ' + name;
			}
		}

		showMode(readMode());

		button.addEventListener('click', function () {
			var next = MODES[(MODES.indexOf(readMode()) + 1) % MODES.length];
			try {
				window.localStorage.setItem(STORAGE_KEY, next);
			} catch (e) {}
			applyMode(next);
			showMode(next);
		});
	}

	if (document.readyState === 'loading')
		document.addEventListener('DOMContentLoaded', bindToggle);
	else
		bindToggle();
})();
