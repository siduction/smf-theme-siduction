/**
 * Siduction theme scripts.
 *
 * Wires up the behaviour that the templates used to carry as inline event
 * handlers, so the theme works under a CSP without 'unsafe-inline'.
 */
$(function() {

	// Tooltips on preview links.
	$('.preview').SMFtooltip();

	// The no-JS logout link is redundant once scripts run.
	$('#nojs_logout').hide();

	// 2FA page: SMF's template doesn't auto-focus the code input. The login
	// and 2FA cards themselves are pinned in the viewport by CSS, no scroll
	// needed.
	var tfaInput = document.querySelector('input[name="tfa_code"]');
	if (tfaInput)
		tfaInput.focus({ preventScroll: true });

	// Language selector submits its form on change.
	$('#language_select').on('change', function() {
		$(this).closest('form').trigger('submit');
	});

	// Login (and similar) links open in an overlay.
	$('a[data-overlay]').on('click', function(e) {
		if (typeof reqOverlayDiv !== 'function')
			return;
		e.preventDefault();
		reqOverlayDiv(this.href, $(this).attr('data-overlay-title') || '', $(this).attr('data-overlay'));
	});

	// Page index "..." expander.
	$('.expand_pages').on('click', function() {
		if (typeof expandPages !== 'function')
			return;
		var url = String($(this).attr('data-baseurl') || '').replace(/^['"]+|['"]+$/g, '');
		expandPages(this, url,
			parseInt($(this).attr('data-firstpage'), 10),
			parseInt($(this).attr('data-lastpage'), 10),
			parseInt($(this).attr('data-perpage'), 10));
	});

	// Mobile main menu.
	$('.mobile_user_menu').on('click', function() {
		$('#main_menu').toggleClass('is-open');
	});
	$('#main_menu .hide_popup').on('click', function(e) {
		e.preventDefault();
		$('#main_menu').removeClass('is-open');
	});

	// Resized images in posts toggle to full size on click.
	$('.postarea').on('click', '.bbc_img.resized', function() {
		$(this).toggleClass('original_size');
	});

	// --- Code blocks: collapse-by-default + working Expand/Shrink ---------
	//
	// SMF renders each code block as <div class="codeheader">…<a
	// class="smf_expand_code">…</a></div><code class="bbc_code">…</code>.
	// Core's own toggle does nothing here because the theme puts no height
	// limit on .bbc_code, so there is never anything to expand. We own the
	// behaviour: anything taller than 5 lines starts collapsed, and the
	// Expand link toggles it.
	var CODE_MAX_LINES = 5;

	function sidCollapseCode(code, btn) {
		var cs = getComputedStyle(code);
		var lineHeight = parseFloat(cs.lineHeight) || 20;
		var padTop = parseFloat(cs.paddingTop) || 0;
		code.style.maxHeight = Math.round(lineHeight * CODE_MAX_LINES + padTop) + 'px';
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

		// Source-line count: "longer than 5 lines" means 5 real lines.
		var lines = code.textContent.replace(/\s+$/, '').split('\n').length;
		if (lines <= CODE_MAX_LINES) {
			// Short enough to show in full; no expander needed.
			if (btn)
				btn.classList.add('hidden');
			return;
		}

		if (btn)
			btn.classList.remove('hidden');
		sidCollapseCode(code, btn);
	});

	// Toggle on click. Delegated so it also covers posts loaded via quick
	// edit / ajax. We drive everything off our own class, independent of
	// whatever core may or may not bind to the same link.
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

	// Admin dashboard tidy-up.
	var adminContent = document.getElementById('admin_content');
	if (adminContent) {

		// Make a section collapsible by its header; it starts collapsed.
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

		// The "Administration Center" intro collapses (collapsed by default).
		var titleBar = adminContent.querySelector('.cat_bar');
		if (titleBar) {
			var titleHead = titleBar.querySelector('.catbg');
			var intro = titleBar.nextElementSibling;
			if (titleHead && intro && intro.classList.contains('information')) {
				titleBar.classList.add('admin_intro_bar');
				makeCollapsible(titleBar, titleHead, intro);
			}
		}

		// The SMF live-news panel collapses (collapsed by default).
		var liveNews = document.getElementById('live_news');
		if (liveNews) {
			var newsHead = liveNews.querySelector('.catbg');
			var newsBody = liveNews.querySelector('.windowbg');
			if (newsHead && newsBody)
				makeCollapsible(liveNews, newsHead, newsBody);
		}

		// Support info, then live news, move to the bottom of the page.
		var supportInfo = document.getElementById('support_info');
		var mainSection = document.getElementById('admin_main_section');
		if (supportInfo)
			adminContent.appendChild(supportInfo);
		if (liveNews)
			adminContent.appendChild(liveNews);
		if (mainSection && !mainSection.children.length)
			mainSection.remove();
	}

	// Topic prev/next floats out of the topic header card; move it into the
	// breadcrumb where it sits right-aligned (CSS in index.css).
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

	// --- Post editor (SCEditor) -----------------------------------------

	// smileys.js (loaded in <head>) defines window.sidSmileys: code -> emoji.
	// It also swaps already-rendered <img class="smiley"> in posts before the
	// browser fetches the GIFs. The editor needs the same map to wire its
	// emoji buttons.

	// Re-skin each editor once SCEditor has built it.
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
			if (!container || container.dataset.sidReady)
				return;
			container.dataset.sidReady = '1';

			// The WYSIWYG iframe is its own document; give it the theme's
			// content stylesheet so the writing area follows dark mode.
			var addEditorCss = function() {
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

			// Replace the smiley images with emoji that insert the
			// character itself instead of a ":)" code.
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

	dressEditors();
	$(window).on('load', dressEditors);
});

// Append a button to a button strip. Kept for core and mod compatibility.
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
