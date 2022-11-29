import { global } from './global';
import { DragObject } from './initialisation';
import { Contact, Location, model } from './model';
import { pageContact } from './pageContact';
import { pageLocation } from './pageLocation';
import { ui, formFunc } from './ui';

export { lists };

class lists {
	static data = [];

	static templateList = v =>
		global.template`<listHeader>${v.img}<filters style="transform:scale(0);"><hinky class="top" style="left:1.5em;"></hinky><div></div></filters><listTitle></listTitle>${v.map}</listHeader>
<listScroll><a class="bgColor"></a></listScroll><listBody>${v.groups}<listResults></listResults></listBody>`;

	static execFilter() {
		var activeID = ui.navigation.getActiveID();
		var l = ui.qa(activeID + ' [filtered="false"][style*="height"]');
		var rep = function () {
			setTimeout(function () {
				lists.repositionThumb(activeID);
			}, 400);
		};
		lists.setListHint(activeID);
		if (l.length > 0) {
			ui.css(l, 'height', '');
			setTimeout(function () {
				ui.css(activeID + ' [filtered="true"]', 'height', 0);
				rep.call();
			}, 400);
		} else {
			ui.css(activeID + ' [filtered="true"]', 'height', 0);
			rep.call();
		}
	}
	static getListNoResults(activeID, errorID) {
		var s = ui.l('noResults.' + errorID), p;
		while ((p = s.indexOf('${')) > -1) {
			var p2 = s.indexOf('}', p);
			s = s.substring(0, p) + ui.l(s.substring(p + 2, p2)) + s.substring(p2 + 1);
		}
		if (errorID == 'favorites')
			s = s.replace('{1}', '<br/><br/><br/><br/><buttonIcon style="left:50%;margin:-3em 0 0 -1.5em;"><img src="images/favorite.svg"/></buttonIcon><br/>');
		else if (errorID == 'matches' || errorID == 'whatToDo')
			s = s.replace('{1}', '<br/><br/><buttontext onclick="ui.navigation.goTo(&quot;settings2&quot;)" class="bgColor">' + ui.l('Yes') + '</buttontext>');
		else if (errorID == 'friends')
			s = s.replace('{1}', '<br/><br/><buttontext class="bgColor">' + ui.l('contacts.requestFriendshipButton') + '</buttontext><br/><br/>');
		else if (errorID.toLowerCase().indexOf('groups') > -1)
			s = s.replace('{1}', '<br/><br/><buttontext class="bgColor">' + ui.l('group.action') + '</buttontext><br/><br/>');
		else if (errorID == 'profile')
			s = s.replace('{1}', '<br/><br/><buttontext onclick="ui.navigation.goTo(&quot;settings&quot;)" class="bgColor">' + ui.l('settings.edit') + '</buttontext>');
		else if (errorID == 'list')
			s = s.replace('{1}', '<br/><br/><buttontext onclick="pageInfo.socialShare()" class="bgColor">' + ui.l('sendSocialShareLocation') + '</buttontext><buttontext onclick="pageLocation.edit()" class="bgColor">' + ui.l('locations.new') + '</buttontext>');
		else if (errorID == 'eventsMy')
			s = s.replace('{1}', '<br/><br/><buttontext class="bgColor">' + ui.l('events.participante') + '</buttontext><br/><br/>');
		else if (errorID == 'search' && ui.val('[name="searchKeywords"]'))
			s += '<br/><br/>' + ui.l('noResults.searchWithoutKeywords') + '<br/><br/><buttontext onclick="lists.repeatSearch()" class="bgColor">' + ui.l('noResults.repeat') + '</buttontext>';
		return '<noResult>' + s.replace(/\{0\}/g, ui.l(activeID + '.title')).replace('{1}', '') + '</noResult>';
	}
	static removeListEntry(id, activeID) {
		ui.attr(activeID + ' [i="' + id + '"]', 'remove', '1');
		if (ui.q('detail card:last-child [i="' + id + '"]'))
			ui.q('detail card:last-child [i="' + id + '"]').outerHTML = '';
		var l = lists.data[activeID];
		if (l) {
			for (var i = l.length - 1; i > 0; i--) {
				if (id == model.convert(activeID == 'locations' ? new Location() : new Contact(), l, i).id)
					l.splice(i, 1);
			}
		}
		var e = ui.q(activeID + ' row[i="' + id + '"]');
		if (e) {
			ui.navigation.animation(e, 'homeSlideOut', function () {
				if (e.nextSibling) {
					var e2 = e.nextSibling;
					e2.style.transition = 'none';
					e2.style.marginTop = e.offsetHeight + 'px';
					setTimeout(function () {
						e2.style.transition = '';
						e2.style.marginTop = 0;
					}, 100);
				}
				e.outerHTML = '';
				lists.setListHint(activeID);
				if (!ui.q(activeID + ' row'))
					ui.navigation.toggleMenu();
			});
		}
	}
	static repeatSearch() {
		ui.q('[name="searchKeywords"]').value = '';
		if (ui.navigation.getActiveID() == 'locations')
			pageLocation.search();
		else
			pageContact.search();
	}
	static repositionThumb(activeID) {
		if (typeof (activeID) != 'string')
			activeID = ui.navigation.getActiveID();
		var list = ui.q(activeID);
		var thumb = ui.q(activeID + ' listScroll');
		if (ui.cssValue(list, 'display') == 'none' || !thumb)
			return;
		list = ui.q(activeID + ' listBody');
		var h = list.clientHeight, l = 0, e = ui.qa(activeID + ' listBody>*');
		for (var i = 0; i < e.length; i++)
			l += e[i].clientHeight;
		if (l <= h)
			ui.css(thumb, 'display', 'none');
		else {
			ui.css(thumb, 'display', 'block');
			ui.css(thumb, 'top',
				Math.min(list.scrollTop / (l - h), 1) // Percentage of scroll: 0 - 1
				* (h - ui.q(activeID + ' listScroll a').clientHeight - ui.q(activeID + ' listHeader').clientHeight) / h * 100 // Total percentage of scrollable area, e.g. 0 - 86
				+ '%');
		}
	}
	static resetLists() {
		lists.data = [];
		ui.html('locations', '');
		ui.html('contacts', '');
		ui.html('settings', '');
		ui.html('settings2', '');
		ui.html('settings3', '');
		ui.html('chat', '');
		ui.html('whatToDo', '');
		ui.html('detail', '');
		ui.html('info', '');
	}
	static setListDivs(id) {
		var e = ui.q(id);
		if (!e.innerHTML) {
			var v = {};
			if (id == 'contacts')
				v.groups = '<groups style="display:none;"></groups>';
			else if (id == 'locations')
				v.map = '<map style="display:none;"></map><buttontext class="bgColor map" onclick="pageLocation.searchFromMap()">' + ui.l('search.map') + '</buttontext>';
			e.innerHTML = lists.templateList(v);
			if (id == 'contacts')
				ui.swipe('contacts>listBody', function (dir) {
					if (dir == 'left')
						ui.navigation.goTo('home', 'foreward');
					else if (dir == 'right')
						ui.navigation.goTo('locations', 'backward');
				});
			else if (id == 'locations')
				ui.swipe('locations>listBody', function (dir) {
					if (dir == 'left')
						ui.navigation.goTo('contacts');
					else if (dir == 'right')
						ui.navigation.goTo('whatToDo', 'backward');
				});
			new DragObject(ui.q(id + ' listScroll')).ondrag = function (event, top) {
				var activeID = ui.navigation.getActiveID();
				if (ui.q(activeID + ' listScroll').offsetTop == top.y)
					return;
				var e2 = event ? event : window.event;
				var y;
				if (e2.touches && e2.touches[0])
					y = e2.touches[0].pageY ? e2.touches[0].pageY : e2.touches[0].clientY + window.document.body.scrollTop;
				else
					y = e2.pageY ? e2.pageY : e2.clientY + window.document.body.scrollTop;
				e2 = ui.q(activeID + ' listBody');
				var h = e2.clientHeight, h2 = ui.q(activeID + ' listBody listResults').clientHeight;
				y = y / (h - ui.q(activeID + ' listScroll a').clientHeight) * (h2 - h);
				if (e2.scrollTop != y)
					e2.scrollTop = y;
			};
			ui.on(id + ' listBody', 'scroll', lists.repositionThumb);
		}
		ui.css(id + ' listScroll', 'display', '');
	}
	static setListHint(id) {
		var e = ui.q(id + ' listHeader listTitle');
		if (e) {
			ui.classRemove('menu a', 'highlightMenu');
			ui.classAdd(ui.qa('menu a')[parseInt(ui.q(ui.navigation.getActiveID()).getAttribute('menuIndex'))], 'highlightMenu');
			var rows = ui.qa(id + ' row'), x = 0;
			var s = ui.q('menu .highlightMenu');
			if (s)
				s = s.innerHTML;
			if (s) {
				var s2 = s.substring(0, s.indexOf('>') + 1);
				s = s.substring(s.indexOf('>') + 1) + s2;
			} else if (id == 'search')
				s = ui.q('[name="searchType"]:checked').getAttribute('label');
			else
				s = '';
			for (var i = 0; i < rows.length; i++) {
				if (rows[i].getAttribute('filtered') != 'true')
					x++;
			}
			if (!rows.length)
				x = ui.l('noResults.title');
			else if (rows.length > x)
				x = x + '/' + rows.length;
			e.innerHTML = ui.l('search.results').replace('{0}', x) + ' ' + s;
		}
		ui.css(id + ' listScroll', 'display', '');
		lists.repositionThumb(id);
	}
	static hideFilter() {
		var activeID = ui.navigation.getActiveID();
		var e = ui.q(activeID + ' filters');
		if (ui.cssValue(e, 'transform').indexOf('1') > 0)
			ui.css(e, 'transform', 'scale(0)');
	}
	static toggleFilter(event, html) {
		setTimeout(function () {
			var activeID = ui.navigation.getActiveID();
			var e = ui.q(activeID + ' filters>div');
			if (!e.innerHTML && html) {
				e.innerHTML = html.call();
				formFunc.initFields(activeID + ' filters');
			}
			e = ui.q(activeID + ' filters');
			if (ui.cssValue(e, 'transform').indexOf('1') < 0) {
				if (ui.q('menu').style.transform.indexOf('1') > 0)
					ui.navigation.toggleMenu();
				ui.css(e, 'transform', 'scale(1)');
			} else
				ui.css(e, 'transform', 'scale(0)');
		}, 50);
	}
}