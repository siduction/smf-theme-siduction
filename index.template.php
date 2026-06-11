<?php
/**
 * Siduction theme for SMF 2.1
 *
 * Main template: header, footer, menu and link tree. Built to run without any
 * inline scripts, inline styles or inline event handlers, so a strict CSP
 * (script-src 'self'; style-src 'self') does not need 'unsafe-inline'.
 *
 * @version 0.0.0-dev
 */

/**
 * Theme setup. Runs before $context is fully populated.
 */
function template_init()
{
	global $settings, $txt;

	// SMF version this theme targets.
	$settings['theme_version'] = '2.1';

	// We ship our own ThemeStrings (color scheme labels).
	$settings['require_theme_strings'] = true;

	// We ship no raster images, so serve SMF's <img> icons from the default theme.
	if (!empty($settings['default_images_url']))
		$settings['images_url'] = $settings['default_images_url'];

	// Login/register stay in the top bar, not in the main menu.
	$settings['login_main_menu'] = false;

	// Page index formatting. The "expand" control carries its data in
	// attributes; scripts/theme.js wires up the click handler.
	$settings['page_index'] = array(
		'extra_before' => '<span class="pages">' . $txt['pages'] . '</span>',
		'previous_page' => '<span class="main_icons previous_page"></span>',
		'current_page' => '<span class="current_page">%1$d</span> ',
		'page' => '<a class="nav_page" href="{URL}">%2$s</a> ',
		'expand_pages' => '<span class="expand_pages" data-baseurl="{LINK}" data-firstpage="{FIRST_PAGE}" data-lastpage="{LAST_PAGE}" data-perpage="{PER_PAGE}"> ... </span>',
		'next_page' => '<span class="main_icons next_page"></span>',
		'extra_after' => '',
	);

	if (!isset($settings['disable_files']))
		$settings['disable_files'] = array();
}

/**
 * The <head> section and the opening <body> tag.
 */
function template_html_above()
{
	global $context, $settings, $scripturl, $txt, $modSettings;

	echo '<!DOCTYPE html>
<html', $context['right_to_left'] ? ' dir="rtl"' : '', !empty($txt['lang_locale']) ? ' lang="' . str_replace("_", "-", substr($txt['lang_locale'], 0, strcspn($txt['lang_locale'], "."))) . '"' : '', '>
<head>
	<meta charset="', $context['character_set'], '">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="color-scheme" content="light dark">';

	// Set the color scheme before first paint to avoid a flash. External file,
	// so no inline script and no CSP exception needed.
	echo '
	<script src="', $settings['theme_url'], '/scripts/color-mode.js"></script>
	<script src="', $settings['theme_url'], '/scripts/smileys.js"></script>';

	// CSS and JS from the theme and any mods.
	template_css();
	template_javascript();

	echo '
	<title>', $context['page_title_html_safe'], '</title>';

	// Content related meta tags (description, Open Graph, etc.).
	foreach ($context['meta_tags'] as $meta_tag)
	{
		echo '
	<meta';

		foreach ($meta_tag as $meta_key => $meta_value)
			echo ' ', $meta_key, '="', $meta_value, '"';

		echo '>';
	}

	// Browser UI color, per scheme.
	echo '
	<meta name="theme-color" content="#162d50" media="(prefers-color-scheme: light)">
	<meta name="theme-color" content="#0d1626" media="(prefers-color-scheme: dark)">
	<link rel="icon" href="', $settings['theme_url'], '/images/favicon.svg" type="image/svg+xml">';

	if (!empty($context['robot_no_index']))
		echo '
	<meta name="robots" content="noindex">';

	if (!empty($context['canonical_url']))
		echo '
	<link rel="canonical" href="', $context['canonical_url'], '">';

	echo '
	<link rel="help" href="', $scripturl, '?action=help">
	<link rel="contents" href="', $scripturl, '">', ($context['allow_search'] ? '
	<link rel="search" href="' . $scripturl . '?action=search">' : '');

	if (!empty($modSettings['xmlnews_enable']) && (!empty($modSettings['allow_guestAccess']) || $context['user']['is_logged']))
		echo '
	<link rel="alternate" type="application/rss+xml" title="', $context['forum_name_html_safe'], ' - ', $txt['rss'], '" href="', $scripturl, '?action=.xml;type=rss2', !empty($context['current_board']) ? ';board=' . $context['current_board'] : '', '">
	<link rel="alternate" type="application/atom+xml" title="', $context['forum_name_html_safe'], ' - ', $txt['atom'], '" href="', $scripturl, '?action=.xml;type=atom', !empty($context['current_board']) ? ';board=' . $context['current_board'] : '', '">';

	if (!empty($context['links']['next']))
		echo '
	<link rel="next" href="', $context['links']['next'], '">';

	if (!empty($context['links']['prev']))
		echo '
	<link rel="prev" href="', $context['links']['prev'], '">';

	if (!empty($context['current_board']))
		echo '
	<link rel="index" href="', $scripturl, '?board=', $context['current_board'], '.0">';

	// Headers from mods.
	echo $context['html_headers'];

	echo '
</head>
<body id="', $context['browser_body_id'], '" class="action_', !empty($context['current_action']) ? $context['current_action'] : (!empty($context['current_board']) ?
		'messageindex' : (!empty($context['current_topic']) ? 'display' : 'home')), !empty($context['current_board']) ? ' board_' . $context['current_board'] : '', '">
<div id="footerfix">';
}

/**
 * Everything above the main content: top bar, header, menu and link tree.
 */
function template_body_above()
{
	global $context, $settings, $scripturl, $txt, $modSettings, $maintenance;

	echo '
	<div id="top_section">
		<div class="inner_wrap">';

	// Logged in: the user's own menu (profile, messages, alerts).
	if ($context['user']['is_logged'])
	{
		echo '
			<ul class="floatleft" id="top_info">
				<li>
					<a href="', $scripturl, '?action=profile"', !empty($context['self_profile']) ? ' class="active"' : '', ' id="profile_menu_top">';

		if (!empty($context['user']['avatar']))
			echo $context['user']['avatar']['image'];

		echo '<span class="textmenu">', $context['user']['name'], '</span></a>
					<div id="profile_menu" class="top_menu"></div>
				</li>';

		if ($context['allow_pm'])
			echo '
				<li>
					<a href="', $scripturl, '?action=pm"', !empty($context['self_pm']) ? ' class="active"' : '', ' id="pm_menu_top">
						<span class="main_icons inbox"></span>
						<span class="textmenu">', $txt['pm_short'], '</span>', !empty($context['user']['unread_messages']) ? '
						<span class="amt">' . $context['user']['unread_messages'] . '</span>' : '', '
					</a>
					<div id="pm_menu" class="top_menu scrollable"></div>
				</li>';

		echo '
				<li>
					<a href="', $scripturl, '?action=profile;area=showalerts;u=', $context['user']['id'], '"', !empty($context['self_alerts']) ? ' class="active"' : '', ' id="alerts_menu_top">
						<span class="main_icons alerts"></span>
						<span class="textmenu">', $txt['alerts'], '</span>', !empty($context['user']['alerts']) ? '
						<span class="amt">' . $context['user']['alerts'] . '</span>' : '', '
					</a>
					<div id="alerts_menu" class="top_menu scrollable"></div>
				</li>';

		// Logout link for visitors without JavaScript. theme.js removes it.
		if (empty($settings['login_main_menu']))
			echo '
				<li id="nojs_logout">
					<a href="', $scripturl, '?action=logout;', $context['session_var'], '=', $context['session_id'], '">', $txt['logout'], '</a>
				</li>';

		echo '
			</ul>';
	}
	// Guests: invite them to log in or register.
	elseif (empty($maintenance))
	{
		if (!empty($settings['login_main_menu']))
		{
			echo '
			<ul class="floatleft">
				<li class="welcome">', sprintf($txt[$context['can_register'] ? 'welcome_guest_register' : 'welcome_guest'], $context['forum_name_html_safe'], $scripturl . '?action=login', 'return reqOverlayDiv(this.href, ' . JavaScriptEscape($txt['login']) . ', \'login\');', $scripturl . '?action=signup'), '</li>
			</ul>';
		}
		else
		{
			echo '
			<ul class="floatleft" id="top_info">
				<li class="welcome">
					', sprintf($txt['welcome_to_forum'], $context['forum_name_html_safe']), '
				</li>
				<li class="button_login">
					<a href="', $scripturl, '?action=login" class="', $context['current_action'] == 'login' ? 'active' : 'open', '" data-overlay="login" data-overlay-title="', $txt['login'], '">
						<span class="main_icons login"></span>
						<span class="textmenu">', $txt['login'], '</span>
					</a>
				</li>';

			if ($context['can_register'])
				echo '
				<li class="button_signup">
					<a href="', $scripturl, '?action=signup" class="', $context['current_action'] == 'signup' ? 'active' : 'open', '">
						<span class="main_icons regcenter"></span>
						<span class="textmenu">', $txt['register'], '</span>
					</a>
				</li>';

			echo '
			</ul>';
		}
	}
	else
		echo '
			<ul class="floatleft welcome">
				<li>', sprintf($txt['welcome_guest'], $context['forum_name_html_safe'], $scripturl . '?action=login', 'return true;'), '</li>
			</ul>';

	echo '
			<div class="floatright header_tools">';

	// Color scheme switch. theme.js / color-mode.js handle the click.
	echo '
				<button type="button" id="color-mode-toggle" class="color_mode_toggle" aria-label="', $txt['color_mode_toggle'], '" title="', $txt['color_mode_toggle'], '"></button>';

	if (!empty($modSettings['userLanguage']) && !empty($context['languages']) && count($context['languages']) > 1)
	{
		echo '
				<form id="languages_form" method="get">
					<select id="language_select" name="language">';

		foreach ($context['languages'] as $language)
			echo '
						<option value="', $language['filename'], '"', isset($context['user']['language']) && $context['user']['language'] == $language['filename'] ? ' selected' : '', '>', str_replace('-utf8', '', $language['name']), '</option>';

		echo '
					</select>
					<noscript>
						<input type="submit" value="', $txt['quick_mod_go'], '">
					</noscript>
				</form>';
	}

	if ($context['allow_search'])
	{
		echo '
				<form id="search_form" action="', $scripturl, '?action=search2" method="post" accept-charset="', $context['character_set'], '">
					<input type="search" name="search" value="" placeholder="', $txt['search'], '">';

		$selected = !empty($context['current_topic']) ? 'current_topic' : (!empty($context['current_board']) ? 'current_board' : 'all');

		echo '
					<select name="search_selection">
						<option value="all"', ($selected == 'all' ? ' selected' : ''), '>', $txt['search_entireforum'], ' </option>';

		if (!empty($context['current_topic']))
			echo '
						<option value="topic"', ($selected == 'current_topic' ? ' selected' : ''), '>', $txt['search_thistopic'], '</option>';

		if (!empty($context['current_board']))
			echo '
						<option value="board"', ($selected == 'current_board' ? ' selected' : ''), '>', $txt['search_thisboard'], '</option>';

		if (!empty($context['allow_memberlist']))
			echo '
						<option value="members"', ($selected == 'members' ? ' selected' : ''), '>', $txt['search_members'], ' </option>';

		echo '
					</select>';

		if (!empty($context['current_topic']))
			echo '
					<input type="hidden" name="sd_topic" value="', $context['current_topic'], '">';
		elseif (!empty($context['current_board']))
			echo '
					<input type="hidden" name="sd_brd" value="', $context['current_board'], '">';

		echo '
					<input type="submit" name="search2" value="', $txt['search'], '" class="button">
					<input type="hidden" name="advanced" value="0">
				</form>';
	}

	echo '
			</div><!-- .header_tools -->
		</div><!-- .inner_wrap -->
	</div><!-- #top_section -->';

	// Header with the Siduction logo. The logo image lives in css/index.css
	// (background-image) so it can swap per color scheme without inline styles.
	echo '
	<header id="header">
		<h1 class="forumtitle">
			<a id="top" href="', $scripturl, '" class="forum_logo', empty($context['header_logo_url_html_safe']) ? ' forum_logo--default' : '', '">';

	if (!empty($context['header_logo_url_html_safe']))
		echo '<img src="', $context['header_logo_url_html_safe'], '" alt="', $context['forum_name_html_safe'], '">';
	else
		echo '<span class="visually_hidden">', $context['forum_name_html_safe'], '</span>';

	echo '</a>
		</h1>';

	if (!empty($settings['site_slogan']))
		echo '
		<div id="siteslogan">', $settings['site_slogan'], '</div>';

	echo '
	</header>
	<div id="wrapper">
		<div id="upper_section">
			<div id="inner_section">
				<div id="inner_wrap"', !$context['user']['is_logged'] ? ' class="hide_720"' : '', '>
					<div class="user">
						<time datetime="', smf_gmstrftime('%FT%TZ'), '">', $context['current_time'], '</time>';

	if ($context['user']['is_logged'])
		echo '
						<ul class="unread_links">
							<li>
								<a href="', $scripturl, '?action=unread" title="', $txt['unread_since_visit'], '">', $txt['view_unread_category'], '</a>
							</li>
							<li>
								<a href="', $scripturl, '?action=unreadreplies" title="', $txt['show_unread_replies'], '">', $txt['unread_replies'], '</a>
							</li>
						</ul>';

	echo '
					</div>';

	if (!empty($settings['enable_news']) && !empty($context['random_news_line']))
		echo '
					<div class="news">
						<h2>', $txt['news'], ': </h2>
						<p>', $context['random_news_line'], '</p>
					</div>';

	echo '
				</div>';

	// Main menu, plus its mobile popup variant.
	echo '
				<a class="mobile_user_menu">
					<span class="menu_icon"></span>
					<span class="text_menu">', $txt['mobile_user_menu'], '</span>
				</a>
				<nav id="main_menu">
					<div id="mobile_user_menu" class="popup_container">
						<div class="popup_window description">
							<div class="popup_heading">', $txt['mobile_user_menu'], '
								<a href="', $scripturl, '" class="main_icons hide_popup"></a>
							</div>
							', template_menu(), '
						</div>
					</div>
				</nav>';

	theme_linktree();

	echo '
			</div><!-- #inner_section -->
		</div><!-- #upper_section -->';

	echo '
		<div id="content_section">
			<div id="main_content_section">';
}

/**
 * Everything below the main content, including the footer.
 */
function template_body_below()
{
	global $context, $txt, $scripturl, $modSettings;

	echo '
			</div><!-- #main_content_section -->
		</div><!-- #content_section -->
	</div><!-- #wrapper -->
</div><!-- #footerfix -->';

	echo '
	<footer id="footer">
		<div class="inner_wrap">
			<ul>
				<li class="floatright"><a href="', $scripturl, '?action=help">', $txt['help'], '</a> ', (!empty($modSettings['requireAgreement'])) ? '| <a href="' . $scripturl . '?action=agreement">' . $txt['terms_and_rules'] . '</a>' : '', ' | <a href="#top_section">', $txt['go_up'], ' &#9650;</a></li>
				<li class="copyright">&copy; ', date('Y'), ' <a href="https://siduction.org/">Siduction Team</a> - <a href="https://www.simplemachines.org/">powered by SMF</a></li>
			</ul>';

	if ($context['show_load_time'])
		echo '
			<p>', sprintf($txt['page_created_full'], $context['load_time'], $context['load_queries']), '</p>';

	echo '
		</div>
	</footer>';
}

/**
 * Deferred JavaScript, then close the document.
 */
function template_html_below()
{
	template_javascript(true);

	echo '
</body>
</html>';
}

/**
 * The link tree (breadcrumb).
 *
 * @param bool $force_show Whether to show it even when settings say otherwise.
 */
function theme_linktree($force_show = false)
{
	global $context, $shown_linktree, $txt;

	if (empty($context['linktree']) || (!empty($context['dont_default_linktree']) && !$force_show))
		return;

	echo '
				<div class="navigate_section">
					<ul>';

	foreach ($context['linktree'] as $link_num => $tree)
	{
		echo '
						<li', ($link_num == count($context['linktree']) - 1) ? ' class="last"' : '', '>';

		if ($link_num != 0)
			echo '
							<span class="dividers">', $context['right_to_left'] ? ' &#9668; ' : ' &#9658; ', '</span>';

		if (isset($tree['extra_before']))
			echo $tree['extra_before'], ' ';

		if (isset($tree['url']))
			echo '
							<a href="' . $tree['url'] . '"><span>' . $tree['name'] . '</span></a>';
		else
			echo '
							<span>' . $tree['name'] . '</span>';

		if (isset($tree['extra_after']))
			echo ' ', $tree['extra_after'];

		echo '
						</li>';
	}

	echo '
					</ul>
				</div><!-- .navigate_section -->';

	$shown_linktree = true;
}

/**
 * The main forum menu.
 */
function template_menu()
{
	global $context;

	echo '
					<ul class="dropmenu menu_nav">';

	foreach ($context['menu_buttons'] as $act => $button)
	{
		echo '
						<li class="button_', $act, '', !empty($button['sub_buttons']) ? ' subsections"' : '"', '>
							<a', $button['active_button'] ? ' class="active"' : '', ' href="', $button['href'], '"', isset($button['target']) ? ' target="' . $button['target'] . '"' : '', '>
								', $button['icon'], '<span class="textmenu">', $button['title'], !empty($button['amt']) ? ' <span class="amt">' . $button['amt'] . '</span>' : '', '</span>
							</a>';

		// Second level.
		if (!empty($button['sub_buttons']))
		{
			echo '
							<ul>';

			foreach ($button['sub_buttons'] as $childbutton)
			{
				echo '
								<li', !empty($childbutton['sub_buttons']) ? ' class="subsections"' : '', '>
									<a href="', $childbutton['href'], '"', isset($childbutton['target']) ? ' target="' . $childbutton['target'] . '"' : '', '>
										', $childbutton['title'], !empty($childbutton['amt']) ? ' <span class="amt">' . $childbutton['amt'] . '</span>' : '', '
									</a>';

				// Third level.
				if (!empty($childbutton['sub_buttons']))
				{
					echo '
									<ul>';

					foreach ($childbutton['sub_buttons'] as $grandchildbutton)
						echo '
										<li>
											<a href="', $grandchildbutton['href'], '"', isset($grandchildbutton['target']) ? ' target="' . $grandchildbutton['target'] . '"' : '', '>
												', $grandchildbutton['title'], !empty($grandchildbutton['amt']) ? ' <span class="amt">' . $grandchildbutton['amt'] . '</span>' : '', '
											</a>
										</li>';

					echo '
									</ul>';
				}

				echo '
								</li>';
			}
			echo '
							</ul>';
		}
		echo '
						</li>';
	}

	echo '
					</ul><!-- .menu_nav -->';
}

/**
 * Generate a strip of buttons.
 *
 * @param array $button_strip Info for displaying the strip.
 * @param string $direction The float direction.
 * @param array $strip_options Options for the button strip.
 */
function template_button_strip($button_strip, $direction = '', $strip_options = array())
{
	global $context, $txt;

	if (!is_array($strip_options))
		$strip_options = array();

	$buttons = array();
	foreach ($button_strip as $key => $value)
	{
		// As of 2.1 the 'test' happens while the array is built; this check is kept for old mods.
		if (!isset($value['test']) || !empty($context[$value['test']]))
		{
			if (!isset($value['id']))
				$value['id'] = $key;

			$button = '
				<a class="button button_strip_' . $key . (!empty($value['active']) ? ' active' : '') . (isset($value['class']) ? ' ' . $value['class'] : '') . '" ' . (!empty($value['url']) ? 'href="' . $value['url'] . '"' : '') . ' ' . (isset($value['custom']) ? ' ' . $value['custom'] : '') . '>' . (!empty($value['icon']) ? '<span class="main_icons ' . $value['icon'] . '"></span>' : '') . '' . $txt[$value['text']] . '</a>';

			if (!empty($value['sub_buttons']))
			{
				$button .= '
					<div class="top_menu dropmenu ' . $key . '_dropdown">
						<div class="viewport">
							<div class="overview">';
				foreach ($value['sub_buttons'] as $element)
				{
					if (isset($element['test']) && empty($context[$element['test']]))
						continue;

					$button .= '
								<a href="' . $element['url'] . '"><strong>' . $txt[$element['text']] . '</strong>';
					if (isset($txt[$element['text'] . '_desc']))
						$button .= '<br><span>' . $txt[$element['text'] . '_desc'] . '</span>';
					$button .= '</a>';
				}
				$button .= '
							</div><!-- .overview -->
						</div><!-- .viewport -->
					</div><!-- .top_menu -->';
			}

			$buttons[] = $button;
		}
	}

	if (empty($buttons))
		return;

	echo '
		<div class="buttonlist', !empty($direction) ? ' float' . $direction : '', '"', (!empty($strip_options['id']) ? ' id="' . $strip_options['id'] . '"' : ''), '>
			', implode('', $buttons), '
		</div>';
}

/**
 * Generate a list of quick buttons.
 *
 * @param array $list_items Info for the buttons.
 * @param string $list_class Used for integration hooks and as a class name.
 * @param string $output_method 'echo' to print, anything else to return the HTML.
 * @return void|string
 */
function template_quickbuttons($list_items, $list_class = null, $output_method = 'echo')
{
	global $txt;

	if (!empty($list_class))
		call_integration_hook('integrate_' . $list_class . '_quickbuttons', array(&$list_items));

	// Drop hidden items.
	foreach ($list_items as $key => $li)
	{
		if ($key == 'more')
		{
			foreach ($li as $subkey => $subli)
				if (isset($subli['show']) && !$subli['show'])
					unset($list_items[$key][$subkey]);

			if (empty($list_items[$key]))
				unset($list_items[$key]);
		}
		elseif (isset($li['show']) && !$li['show'])
			unset($list_items[$key]);
	}

	if (empty($list_items))
		return;

	$output = '
		<ul class="quickbuttons' . (!empty($list_class) ? ' quickbuttons_' . $list_class : '') . '">';

	$list_item_format = function($li)
	{
		$html = '
			<li' . (!empty($li['class']) ? ' class="' . $li['class'] . '"' : '') . (!empty($li['id']) ? ' id="' . $li['id'] . '"' : '') . (!empty($li['custom']) ? ' ' . $li['custom'] : '') . '>';

		if (isset($li['content']))
			$html .= $li['content'];
		// A link, or a focusable span when there is no target URL.
		elseif (!empty($li['href']))
			$html .= '
				<a href="' . $li['href'] . '"' . (!empty($li['javascript']) ? ' ' . $li['javascript'] : '') . '>
					' . (!empty($li['icon']) ? '<span class="main_icons ' . $li['icon'] . '"></span>' : '') . (!empty($li['label']) ? $li['label'] : '') . '
				</a>';
		else
			$html .= '
				<a role="button" tabindex="0"' . (!empty($li['javascript']) ? ' ' . $li['javascript'] : '') . '>
					' . (!empty($li['icon']) ? '<span class="main_icons ' . $li['icon'] . '"></span>' : '') . (!empty($li['label']) ? $li['label'] : '') . '
				</a>';

		$html .= '
			</li>';

		return $html;
	};

	foreach ($list_items as $key => $li)
	{
		if ($key == 'more')
		{
			$output .= '
			<li class="post_options">
				<a role="button" tabindex="0" aria-haspopup="true">' . $txt['post_options'] . '</a>
				<ul>';

			foreach ($li as $subli)
				$output .= $list_item_format($subli);

			$output .= '
				</ul>
			</li>';
		}
		else
			$output .= $list_item_format($li);
	}

	$output .= '
		</ul><!-- .quickbuttons -->';

	if ($output_method == 'echo')
		echo $output;
	else
		return $output;
}

/**
 * The upper part of the maintenance warning box.
 */
function template_maint_warning_above()
{
	global $txt, $context, $scripturl;

	echo '
	<div class="errorbox" id="errors">
		<dl>
			<dt>
				<strong id="error_serious">', $txt['forum_in_maintenance'], '</strong>
			</dt>
			<dd class="error" id="error_list">
				', sprintf($txt['maintenance_page'], $scripturl . '?action=admin;area=serversettings;' . $context['session_var'] . '=' . $context['session_id']), '
			</dd>
		</dl>
	</div>';
}

/**
 * The lower part of the maintenance warning box.
 */
function template_maint_warning_below()
{
}

?>
