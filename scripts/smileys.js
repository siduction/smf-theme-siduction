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
		":'(":  '😢'
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

	// Pick up nodes already in the DOM when this script loads late.
	document.addEventListener('DOMContentLoaded', function() {
		var imgs = document.querySelectorAll('img.smiley');
		for (var i = 0; i < imgs.length; i++)
			swap(imgs[i]);
	});

	// Register the service worker that intercepts smiley GIF requests.
	if ('serviceWorker' in navigator && document.currentScript) {
		var swUrl = document.currentScript.src.replace(/[^/]+$/, 'sw.js');
		navigator.serviceWorker.register(swUrl, { scope: '/' }).catch(function() {});
	}

})();
