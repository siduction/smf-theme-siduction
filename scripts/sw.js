/**
 * Siduction theme service worker.
 *
 * Catches requests for SMF's smiley GIFs (which we've replaced with Unicode
 * emoji in the DOM) and answers them with a 1x1 transparent GIF, so the
 * browser never actually hits the network for them.
 *
 * Needs Service-Worker-Allowed: / on the response that serves this file —
 * see the .htaccess next to it.
 */

self.addEventListener('install', function() {
	self.skipWaiting();
});

self.addEventListener('activate', function(event) {
	event.waitUntil(self.clients.claim());
});

var EMPTY_GIF = new Uint8Array([
	0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
	0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0x21,
	0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
	0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x01, 0x44,
	0x00, 0x3b
]);

self.addEventListener('fetch', function(event) {
	if (/\/Smileys\/[^/?#]+\/[^/?#]+\.(gif|png)/i.test(event.request.url)) {
		event.respondWith(new Response(EMPTY_GIF, {
			headers: {
				'Content-Type': 'image/gif',
				'Cache-Control': 'max-age=31536000, immutable'
			}
		}));
	}
});
