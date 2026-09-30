// Replace SMF's <img class="smiley"> tags with Unicode emoji.
(function() {

	window.sidSmileys = {
		':)':   '🙂',
		';)':   '😉',
		':D':   '😃',
		';D':   '😄',
		'>:(':  '😠',
		':(':   '🙁',
		':o':   '😮',
		'8)':   '😎',
		'???':  '😕',
		'::)':  '🙄',
		':P':   '😛',
		':-[':  '😳',
		':-X':  '🤐',
		':-\\': '😐',
		':-*':  '😘',
		":'(":  '😢',
		'>:D':  '😈',
		'O:-)': '😇'
	};

	// A code without an emoji falls back to its text, so every smiley on the
	// page renders the same way.
	function swap(img) {
		var code = img.getAttribute('alt');
		if (!code)
			return;
		img.removeAttribute('src');
		img.replaceWith(document.createTextNode(window.sidSmileys[code] || code));
	}

	new MutationObserver(function(records) {
		for (var i = 0; i < records.length; i++) {
			var added = records[i].addedNodes;
			for (var j = 0; j < added.length; j++) {
				var n = added[j];
				if (n.nodeType !== 1)
					continue;
				if (n.tagName === 'IMG' && n.classList.contains('smiley'))
					swap(n);
				else if (n.querySelectorAll) {
					var imgs = n.querySelectorAll('img.smiley');
					for (var k = 0; k < imgs.length; k++)
						swap(imgs[k]);
				}
			}
		}
	}).observe(document.documentElement, { childList: true, subtree: true });

	// Pick up nodes already in the DOM when this script loads late.
	document.addEventListener('DOMContentLoaded', function() {
		var imgs = document.querySelectorAll('img.smiley');
		for (var i = 0; i < imgs.length; i++)
			swap(imgs[i]);
	});

	// Up to 1.2.2 the theme registered a service worker (scripts/sw.js) to
	// blank smiley GIFs. Drop any sw.js worker browsers still have.
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.getRegistrations().then(function(registrations) {
			registrations.forEach(function(registration) {
				var worker = registration.active || registration.waiting || registration.installing;
				if (worker && /\/sw\.js$/.test(new URL(worker.scriptURL).pathname))
					registration.unregister();
			});
		}).catch(function() {});
	}

})();
