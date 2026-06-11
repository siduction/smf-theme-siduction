/**
 * Color scheme handling for the Siduction theme.
 *
 * Loaded synchronously in the <head> so the scheme is set before the first
 * paint. "auto" follows the browser via the prefers-color-scheme media query;
 * "light" / "dark" force a scheme through the data-theme attribute.
 */
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

		button.setAttribute('data-mode', readMode());

		button.addEventListener('click', function () {
			var next = MODES[(MODES.indexOf(readMode()) + 1) % MODES.length];
			try {
				window.localStorage.setItem(STORAGE_KEY, next);
			} catch (e) {}
			applyMode(next);
			button.setAttribute('data-mode', next);
		});
	}

	if (document.readyState === 'loading')
		document.addEventListener('DOMContentLoaded', bindToggle);
	else
		bindToggle();
})();
