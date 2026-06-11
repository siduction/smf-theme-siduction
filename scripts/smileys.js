/**
 * Replace SMF's <img class="smiley"> tags with Unicode emoji.
 *
 * Loaded synchronously in <head> so a MutationObserver is in place before the
 * body is parsed: as soon as the parser inserts a smiley <img> we drop its
 * src, which aborts the GIF fetch before it hits the network in most cases.
 */
(function() {

	window.sidSmileys = {
		':)':   '🙂',   // smiley
		';)':   '😉',   // wink
		':D':   '😃',   // cheesy
		';D':   '😄',   // grin
		'>:(':  '😠',   // angry
		':(':   '🙁',   // sad
		':o':   '😮',   // shocked
		'8)':   '😎',   // cool
		'???':  '😕',   // huh
		'::)':  '🙄',   // rolleyes
		':P':   '😛',   // tongue
		':-[':  '😳',   // embarrassed
		':-X':  '🤐',   // lips sealed
		':-\\': '😐',   // undecided
		':-*':  '😘',   // kiss
		":'(":  '😢'    // cry
	};

	function swap(img) {
		var emoji = window.sidSmileys[img.getAttribute('alt')];
		if (!emoji)
			return;
		img.removeAttribute('src');
		img.replaceWith(document.createTextNode(emoji));
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

	// Pick up anything that was already in the DOM if this script lands late.
	document.addEventListener('DOMContentLoaded', function() {
		var imgs = document.querySelectorAll('img.smiley');
		for (var i = 0; i < imgs.length; i++)
			swap(imgs[i]);
	});

	// Register the service worker that stubs out the smiley GIF requests
	// before they reach the network. Needs Service-Worker-Allowed: / on
	// sw.js for the root scope (set in the sibling .htaccess).
	if ('serviceWorker' in navigator && document.currentScript) {
		var swUrl = document.currentScript.src.replace(/[^/]+$/, 'sw.js');
		navigator.serviceWorker.register(swUrl, { scope: '/' }).catch(function() {});
	}

})();
