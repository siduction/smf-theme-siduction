// Theme behaviour — replaces inline event handlers for CSP compatibility.
$(function() {

	$('.preview').SMFtooltip();
	$('#nojs_logout').hide();

	// SMF doesn't auto-focus the 2FA input.
	var tfaInput = document.querySelector('input[name="tfa_code"]');
	if (tfaInput)
		tfaInput.focus({ preventScroll: true });

	$('#language_select').on('change', function() {
		$(this).closest('form').trigger('submit');
	});

	$('a[data-overlay]').on('click', function(e) {
		if (typeof reqOverlayDiv !== 'function')
			return;
		e.preventDefault();
		reqOverlayDiv(this.href, $(this).attr('data-overlay-title') || '', $(this).attr('data-overlay'));
	});

	$('.expand_pages').on('click', function() {
		if (typeof expandPages !== 'function')
			return;
		var url = String($(this).attr('data-baseurl') || '').replace(/^['"]+|['"]+$/g, '');
		expandPages(this, url,
			parseInt($(this).attr('data-firstpage'), 10),
			parseInt($(this).attr('data-lastpage'), 10),
			parseInt($(this).attr('data-perpage'), 10));
	});

	$('.mobile_user_menu').on('click', function(e) {
		e.preventDefault();
		var open = $('#main_menu').toggleClass('is-open').hasClass('is-open');
		this.setAttribute('aria-expanded', open ? 'true' : 'false');
	});
	$('#main_menu .hide_popup').on('click', function(e) {
		e.preventDefault();
		$('#main_menu').removeClass('is-open');
		$('.mobile_user_menu').attr('aria-expanded', 'false');
	});

	// Membergroup stars: swap SMF's default coloured squares for emoji.
	// Custom or unknown icon files stay images.
	var groupIcons = {
		'iconadmin.png': '🟥', // red square
		'icongmod.png': '🟦',  // blue square
		'iconmod.png': '🟩'    // green square
	};
	$('.icons img[src*="/membericons/"]').each(function() {
		var file = this.getAttribute('src').split('/').pop();
		if (!groupIcons[file])
			return;
		var span = document.createElement('span');
		span.className = 'group_icon';
		span.textContent = groupIcons[file];
		span.setAttribute('aria-hidden', 'true');
		this.replaceWith(span);
	});

	// Mobile action popups: a tap on the dimmed backdrop closes them too.
	$('#mobile_action, #mobile_moderation').on('click', function(e) {
		if (e.target === this)
			$(this).hide();
	});

	$('.postarea').on('click', '.bbc_img.resized', function() {
		$(this).toggleClass('original_size');
	});

	// Code blocks: collapse anything taller than 5 lines; Expand/Shrink toggles it.
	// SMF renders line breaks as <br>, so we measure by rendered height, not newline count.
	var CODE_MAX_LINES = 5;

	function sidCollapsedHeight(code) {
		var cs = getComputedStyle(code);
		var lineHeight = parseFloat(cs.lineHeight) || 20;
		var padTop = parseFloat(cs.paddingTop) || 0;
		var padBot = parseFloat(cs.paddingBottom) || 0;
		return Math.round(lineHeight * CODE_MAX_LINES + padTop + padBot);
	}

	function sidCollapseCode(code, btn) {
		code.style.maxHeight = sidCollapsedHeight(code) + 'px';
		code.style.overflow = 'auto';
		code.classList.add('sid_code_collapsed');
		if (btn)
			btn.textContent = btn.getAttribute('data-expand-txt') || btn.textContent;
	}

	function sidExpandCode(code, btn) {
		code.style.maxHeight = '';
		code.classList.remove('sid_code_collapsed');
		if (btn)
			btn.textContent = btn.getAttribute('data-shrink-txt') || btn.textContent;
	}

	$('code.bbc_code').each(function() {
		var code = this;
		var header = code.previousElementSibling;
		var btn = header ? header.querySelector('.smf_expand_code') : null;

		if (code.scrollHeight <= sidCollapsedHeight(code) + 4) {
			if (btn)
				btn.classList.add('hidden');
			return;
		}

		if (btn)
			btn.classList.remove('hidden');
		sidCollapseCode(code, btn);
	});

	// Delegated so it covers posts loaded via ajax / quick edit.
	$(document).on('click', '.smf_expand_code', function(e) {
		e.preventDefault();
		var btn = this;
		var header = btn.closest('.codeheader');
		var code = header ? header.nextElementSibling : null;
		if (!code || !code.classList.contains('bbc_code'))
			return;
		if (code.classList.contains('sid_code_collapsed'))
			sidExpandCode(code, btn);
		else
			sidCollapseCode(code, btn);
	});

	var adminContent = document.getElementById('admin_content');
	if (adminContent) {

		var makeCollapsible = function(container, header, body) {
			container.classList.add('is-collapsed');
			body.hidden = true;
			header.addEventListener('click', function(e) {
				if (e.target.closest('a, input, select, button'))
					return;
				container.classList.toggle('is-collapsed');
				body.hidden = container.classList.contains('is-collapsed');
			});
		};

		var titleBar = adminContent.querySelector('.cat_bar');
		if (titleBar) {
			var titleHead = titleBar.querySelector('.catbg');
			var intro = titleBar.nextElementSibling;
			if (titleHead && intro && intro.classList.contains('information')) {
				titleBar.classList.add('admin_intro_bar');
				makeCollapsible(titleBar, titleHead, intro);
			}
		}

		var liveNews = document.getElementById('live_news');
		if (liveNews) {
			var newsHead = liveNews.querySelector('.catbg');
			var newsBody = liveNews.querySelector('.windowbg');
			if (newsHead && newsBody)
				makeCollapsible(liveNews, newsHead, newsBody);
		}

		var supportInfo = document.getElementById('support_info');
		var mainSection = document.getElementById('admin_main_section');
		if (supportInfo)
			adminContent.appendChild(supportInfo);
		if (liveNews)
			adminContent.appendChild(liveNews);
		if (mainSection && !mainSection.children.length)
			mainSection.remove();
	}

	// Move prev/next topic links into the breadcrumb (right-aligned via CSS).
	$('.nextlinks').each(function() {
		var ul = document.querySelector('.navigate_section ul');
		if (!ul)
			return;
		var li = document.createElement('li');
		li.className = 'next_prev';
		this.classList.remove('floatright');
		li.appendChild(this);
		ul.appendChild(li);
	});

	// The editor iframe is its own document and can't see the page's
	// data-theme, so hand it the scheme the page is actually showing.
	var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

	function pageScheme() {
		var theme = document.documentElement.getAttribute('data-theme');
		if (theme === 'light' || theme === 'dark')
			return theme;
		return darkQuery.matches ? 'dark' : 'light';
	}

	function syncEditorScheme(iframe) {
		var doc = iframe.contentDocument;
		if (doc && doc.documentElement)
			doc.documentElement.setAttribute('data-scheme', pageScheme());
	}

	function syncAllEditorSchemes() {
		$('.sceditor-container iframe').each(function() {
			syncEditorScheme(this);
		});
	}

	new MutationObserver(syncAllEditorSchemes)
		.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
	darkQuery.addEventListener('change', syncAllEditorSchemes);

	// Topic footer: moderation buttons first, then breadcrumb and jump-to
	// sharing one row (styled as .topic_tools).
	var jumpTo = document.getElementById('display_jump_to');
	if (jumpTo) {
		var crumbs = document.querySelectorAll('#main_content_section > .navigate_section');
		var modButtons = document.getElementById('moderationbuttons');
		var tools = document.createElement('div');
		tools.className = 'topic_tools';
		jumpTo.before(tools);
		if (modButtons)
			tools.before(modButtons);
		if (crumbs.length)
			tools.appendChild(crumbs[crumbs.length - 1]);
		tools.appendChild(jumpTo);
	}

	function dressEditors() {
		$('textarea').each(function() {
			var editor;
			try {
				editor = $(this).sceditor('instance');
			} catch (e) {
				return;
			}
			if (!editor || typeof editor.getContentAreaContainer !== 'function')
				return;

			var iframe = editor.getContentAreaContainer();
			var container = iframe.closest('.sceditor-container');
			if (!container)
				return;

			if (!container.dataset.sidReady) {
				container.dataset.sidReady = '1';

				// Inject the theme stylesheet into the editor iframe.
				var addEditorCss = function() {
					syncEditorScheme(iframe);
					var doc = iframe.contentDocument;
					if (!doc || doc.getElementById('sid_editor_css'))
						return;
					var link = doc.createElement('link');
					link.id = 'sid_editor_css';
					link.rel = 'stylesheet';
					link.href = smf_theme_url + '/css/jquery.sceditor.default.css';
					doc.head.appendChild(link);
				};
				addEditorCss();
				iframe.addEventListener('load', addEditorCss);

				// Keep typed smiley codes as text in the WYSIWYG view; the posted
				// message renders them as emoji.
				if (typeof editor.emoticons === 'function')
					editor.emoticons(false);
			}

			// The smiley row can be added after the editor itself.
			$(container).find('.sceditor-insertemoticon img').each(function() {
				var emoji = window.sidSmileys && window.sidSmileys[this.alt];
				if (!emoji)
					return;
				var button = document.createElement('span');
				button.className = 'emoji_button';
				button.textContent = emoji;
				button.title = this.alt;
				this.replaceWith(button);
				button.addEventListener('click', function(e) {
					e.stopPropagation();
					editor.insertText(emoji + ' ');
				});
			});
		});
	}

	// SMF builds its editors asynchronously (and again for quick reply / quick
	// edit), so react to DOM changes instead of fixed load events.
	var dressQueued = false;
	new MutationObserver(function() {
		if (dressQueued)
			return;
		dressQueued = true;
		window.requestAnimationFrame(function() {
			dressQueued = false;
			dressEditors();
		});
	}).observe(document.body, { childList: true, subtree: true });

	dressEditors();
});

// Append a button to a button strip (core and mod compatibility hook).
function smf_addButton(stripId, image, options)
{
	$('#' + stripId).append(
		'<a href="' + options.sUrl + '" class="button"' +
			('sId' in options ? ' id="' + options.sId + '_text"' : '') +
			('sCustom' in options ? ' ' + options.sCustom : '') + '>' +
			options.sText +
		'</a>'
	);
}
