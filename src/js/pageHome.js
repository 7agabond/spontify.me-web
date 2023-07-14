import { bluetooth } from './bluetooth';
import { communication } from './communication';
import { ContentAdmin } from './customElements/ContentAdmin';
import { geoData } from './geoData';
import { global } from './global';
import { initialisation } from './init';
import { Contact, ContactNews, Location, model } from './model';
import { pageChat } from './pageChat';
import { pageEvent } from './pageEvent';
import { formFunc, ui } from './ui';
import { user } from './user';

export { pageHome };

class pageHome {
	static badge = -1;
	static club = false;
	static events;
	static news;
	static teaserMeta;
	static template = v =>
		global.template`<homeHeader${v.logoSmall}>
	<buttonIcon class="statistics${v.statsButton}" onclick="pageHome.openStatistics()">
		<img source="statistics"/>
	</buttonIcon>
	<img onclick="${v.actionLogo}" source="logo"/>
	<text onclick="ui.navigation.goTo(&quot;settings&quot;)" ${v.dispProfile}>
		${v.imgProfile}<br/>
		<name>${v.name}</name>
	</text>
	<buttonIcon class="language${v.langButton}" onclick="pageHome.openLanguage(event)">
		<span>${v.lang}</span>
	</buttonIcon>
</homeHeader>
<homeBody>
<teaser class="events">
	<title onclick="pageHome.filterOpen()" class="highlightColor" style="cursor:pointer;">${ui.l('events.title')}</title>
	<div></div>
</teaser>
<teaser class="contacts">
	<title>${ui.l('contacts.title')}</title>
	<div></div>
</teaser>
</homeBody>`;
	static templateNews = v =>
		global.template`<news>
<buttonIcon onclick="pageHome.edit()"${v.hideEdit}>+</buttonIcon>
<tabHeader>
<tab onclick="pageHome.selectTab('news')" i="news" class="tabActive">
${ui.l('home.news')}
</tab>
<tab onclick="pageHome.selectTab('events')" i="events">
${ui.l('events.title')}
</tab>
</tabHeader>
<tabBody>
<div class="news">${v.news}</div>
<div class="events">${v.events}</div>
</tabBody></news>`;
	static templateNewsEdit = v =>
		global.template`
<input type="hidden" name="id" value="${v.id}"/>
<field>
	<label style="padding-top:0;">${ui.l('home.news')}</label>
	<value>
		<textarea name="description">${v.description}</textarea>
	</value>
</field>
<field>
	<label>${ui.l('picture')}</label>
	<value>
		<input-image src="${v.image}"></input-image>
	</value>
</field>
<field>
	<label>${ui.l('home.url')}</label>
	<value>
		<input name="url" value="${v.url}"/>
	</value>
</field>
<field>
	<label>${ui.l('home.publish')}</label>
	<value>
		<input name="publish" type="datetime-local" placeholder="TT.MM.JJJJ HH:MM" value="${v.publish}" step="900" min="${v.today}" />
	</value>
</field>
<dialogButtons style="margin-bottom:0;">
	<button-text onclick="pageHome.saveNews()" label="save"></button-text>
	<button-text onclick="pageHome.deleteNews(${v.id})" class="deleteButton${v.hideDelete}" label="delete"></button-text>
</dialogButtons>
<popupHint></popupHint>`;
	static clickNotification(id, action) {
		communication.ajax({
			url: global.serverApi + 'db/one',
			webCall: 'pageHome.clickNotification(id,action)',
			method: 'PUT',
			body: {
				classname: 'ContactNotification',
				id: id,
				values: { seen: true }
			},
			success() {
				ui.navigation.autoOpen(action);
				communication.notification.close();
				communication.ping();
			}
		});
	}
	static closeList() {
		var e = ui.q('notificationList');
		if (ui.cssValue(e, 'display') != 'none')
			ui.toggleHeight(e);
	}
	static deleteNews(id) {
		if (ui.q('dialog-popup button-text.deleteButton').innerText != ui.l('confirmDelete'))
			ui.q('dialog-popup button-text.deleteButton').innerText = ui.l('confirmDelete');
		else
			communication.ajax({
				url: global.serverApi + 'db/one',
				body: {
					classname: 'ContactNews',
					id: id
				},
				webCall: 'pageHome.deleteNews(id)',
				method: 'DELETE',
				success(r) {
					ui.navigation.closePopup();
					pageHome.news = null;
				}
			});
	}
	static edit() {
		if (ui.q('dialog-hint tab.tabActive[i="news"]'))
			pageHome.editNews();
		else
			pageEvent.edit();
	}
	static editNews(id) {
		var render = function (v) {
			if (!v.id)
				v.hideDelete = ' hidden';
			var d = global.date.getDateFields(new Date());
			v.today = d.year + '-' + d.month + '-' + d.day + 'T' + d.hour + ':' + d.minute + ':00';
			if (v.publish) {
				d = global.date.getDateFields(global.date.server2local(v.publish));
				v.publish = d.year + '-' + d.month + '-' + d.day + 'T' + d.hour + ':' + d.minute;
			} else
				v.publish = v.today;
			v.publish = v.publish.substring(0, 16);
			if (v.image)
				v.image = global.serverImg + v.image;
			ui.navigation.openPopup(ui.l('home.news'), pageHome.templateNewsEdit(v));
		};
		if (id)
			communication.ajax({
				url: global.serverApi + 'db/one?query=contact_listNews&search=' + encodeURIComponent('contactNews.id=' + id),
				webCall: 'pageHome.editNews(id)',
				responseType: 'json',
				success(l) {
					render(model.convert(new ContactNews(), l));
				}
			});
		else
			render({});
	}
	static filterClose() {
		if (ui.q('dialog-hint input-checkbox[checked="true"]')) {
			ui.attr('dialog-hint input-checkbox', 'checked', 'false');
			pageHome.teaserEvents();
		}
		ui.navigation.closeHint();
	}
	static filterEvents() {
		var search = '', e = ui.qa('dialog-hint eventFilter:first-child input-checkbox[checked="true"]');
		for (var i = 0; i < e.length; i++)
			search += ' or location.town=\'' + e[i].getAttribute('value') + '\'';
		pageHome.teaserEvents(search ? search.substring(4) : null);
	}
	static filterOpen() {
		var render = function () {
			var towns = '', dates = '';
			for (var i = 0; i < pageHome.teaserMeta.length; i++) {
				if (towns.indexOf('"' + pageHome.teaserMeta[i].town + '"') < 0)
					towns += '<input-checkbox onclick="pageHome.filterEvents()" value="' + pageHome.teaserMeta[i].town + '" label="' + pageHome.teaserMeta[i].town + '"></input-checkbox>';
				if (dates.indexOf('"' + pageHome.teaserMeta[i].date + '"') < 0)
					dates += '<input-checkbox onclick="pageHome.filterEvents()" value="' + global.date.local2server(pageHome.teaserMeta[i].date).substring(0, 10) + '" label="' + global.date.formatDate(pageHome.teaserMeta[i].date).split(' ')[1] + '"></input-checkbox>';
			}
			ui.navigation.openHint({
				desc: '<eventFilter>' + towns + '</eventFilter><eventFilter>' + dates + '</eventFilter>',
				pos: '2%,-65%', size: '96%,auto', hinkyClass: 'bottom', hinky: 'right:50%;margin-right:-1.5em;',
				onclose: 'pageHome.filterClose()',
				noLogin: true
			});
		}
		if (pageHome.teaserMeta)
			render();
		else
			communication.ajax({
				url: global.serverApi + 'action/teaser/meta',
				webCall: 'pageHome.filterOpen()',
				responseType: 'json',
				error() { },
				success(l) {
					pageHome.teaserMeta = [];
					l = pageEvent.getCalendarList(l);
					for (var i = 0; i < l.length; i++)
						pageHome.teaserMeta.push({ town: l[i].town, date: l[i].event.startDate });
					render();
				}
			});
	}
	static init(force) {
		var e = ui.q('home');
		if (force || !ui.q('home teaser.events>div card')) {
			var v = {
				actionLogo: 'pageHome.openHint()'
			};
			v.statsButton = ' hidden';
			if (user.contact) {
				if (user.contact.imageList)
					v.imgProfile = '<img src="' + global.serverImg + user.contact.imageList + '"/>';
				else
					v.imgProfile = '<img src="images/contacts.svg" style="box-shadow:none;"/>';
				v.logoSmall = ' class="logoSmall"';
				v.name = user.contact.pseudonym;
				v.infoButton = ' hidden';
				v.langButton = ' hidden';
				if (pageHome.club)
					v.actionLogo = 'pageHome.openNews()';
				else
					v.actionLogo = 'ui.navigation.goTo(&quot;settings&quot;)';
				if (user.contact.type == 'adminContent')
					v.statsButton = '';
			} else {
				v.dispProfile = 'class="hidden"';
				v.lang = global.language;
			}
			e.innerHTML = pageHome.template(v);
			initialisation.reposition();
			pageHome.teaserContacts();
			pageHome.teaserEvents();
		}
		pageHome.initNotificationButton();
		if (user.contact)
			ui.html('home item.bluetooth text', ui.l(bluetooth.state == 'on' && user.contact.bluetooth ? 'bluetooth.activated' : 'bluetooth.deactivated'));
		formFunc.svg.replaceAll();
		if (user.contact) {
			ui.q('home homeHeader svg image').setAttribute('x', 770);
			ui.q('home homeHeader svg image').setAttribute('width', 230);
			ui.q('home homeHeader svg text').setAttribute('x', 1000);
			ui.q('home homeHeader svg text').setAttribute('y', 350);
			ui.q('home homeHeader svg text').setAttribute('text-anchor', 'end');
		}
		pageHome.updateLocalisation();
		ui.css('dialog-navigation item.search', 'display', user.contact ? '' : 'none');
		ui.css('dialog-navigation item.info', 'display', user.contact ? 'none' : '');
	}
	static initNotification(d) {
		var f = function () {
			var e = ui.q('notificationList');
			if (e.getAttribute("toggle"))
				setTimeout(f, 500);
			else {
				var s = '';
				for (var i = 1; i < d.length; i++) {
					var v = model.convert(new Contact(), d, i);
					if (i == 1 && ui.q('notificationList div[i="' + v.contactNotification.id + '"]')) {
						pageHome.badge = 0;
						pageHome.initNotificationButton();
						return;
					}
					if (v.imageList)
						v.image = global.serverImg + v.imageList;
					else
						v.image = 'images/contacts.svg';
					s += '<div onclick="pageHome.clickNotification(' + v.contactNotification.id + ',&quot;' + v.contactNotification.action + '&quot;)" ' + (v.contactNotification.seen == 0 ? ' class="highlightBackground"' : '') + '><img src="' + v.image + '"' + (v.imageList ? '' : ' class="bgColor" style="padding:0.6em;"') + '/><span>' + global.date.formatDate(v.contactNotification.createdAt) + ': ' + v.contactNotification.text + '</span></div>';
				}

				e.innerHTML = s;
				if (ui.cssValue(e, 'display') == 'none')
					e.removeAttribute('h');
				pageHome.badge = ui.qa('notificationList .highlightBackground').length;
				pageHome.initNotificationButton();
			}
		};
		f.call();
	}
	static initNotificationButton() {
		if (pageHome.badge > 0)
			ui.classAdd('dialog-navigation buttonIcon.notifications', 'pulse highlight');
		else
			ui.classRemove('dialog-navigation buttonIcon.notifications', 'pulse highlight');
		if (ui.q('dialog-navigation badgeNotifications'))
			ui.q('dialog-navigation badgeNotifications').innerText = Math.max(pageHome.badge, 0);
	}
	static openHint() {
		ui.navigation.openHint({
			desc: ui.l('intro.description').replace(/\{0}/g, global.appTitle.substring(0, global.appTitle.indexOf(global.separator))),
			pos: '5%,10.5em', size: '90%,auto', hinkyClass: 'top', hinky: 'left:50%;'
		});
	}
	static openLanguage(event) {
		event.stopPropagation();
		ui.navigation.openPopup(ui.l('langSelect'),
			'<div style="padding:1em 0;"><button-text' + (global.language == 'DE' ? ' class="favorite"' : '') + ' onclick="initialisation.setLanguage(&quot;DE&quot;)" l="DE" label="Deutsch"></button-text>' +
			'<button-text' + (global.language == 'EN' ? ' class="favorite"' : '') + ' onclick="initialisation.setLanguage(&quot;EN&quot;)" l="EN" label="English"></button-text></div>');
	}
	static openNews() {
		var render = function () {
			if (!pageHome.news || !pageHome.events)
				return;
			var v = {}, s = '';
			for (var i = 1; i < pageHome.news.length; i++) {
				var e = model.convert(new ContactNews(), pageHome.news, i);
				var oc = user.contact.type == 'adminContent' ?
					'onclick="pageHome.editNews(' + e.id + ')"' :
					e.url ? 'onclick="ui.navigation.openHTML(&quot;' + e.url + '&quot;)"' : '';
				s += oc ? '<card ' + oc + ' style="cursor:pointer;">' : '<card>';
				if (global.date.server2local(e.publish) > new Date())
					s += '<p><date style="color:red;">' + global.date.formatDate(e.publish) + global.separator + ui.l('home.notYetPublished') + '</date>';
				else
					s += '<p><date>' + global.date.formatDate(e.publish) + '</date>';
				if (e.image)
					s += '<img src="' + global.serverImg + e.image + '"/>';
				s += e.description;
				s += '</p></card>'
			}
			v.news = s ? s : '<card style="text-align:center;padding:0.5em;"><p>' + ui.l('home.noNews').replace('{0}', ui.l('home.news')) + '</p></card>';
			s = '';
			for (var i = 0; i < pageHome.events.length; i++) {
				var e = pageHome.events[i];
				s += '<card onclick="details.open(&quot;' + pageEvent.getId(e) + '&quot;,' + JSON.stringify({ webCall: 'pageHome.openNews()', query: 'event_list', search: encodeURIComponent('event.id=' + e.event.id) }).replace(/"/g, '&quot;') + ',pageLocation.detailLocationEvent)" style="cursor:pointer;">';
				s += '<p><date>' + global.date.formatDate(e.event.startDate) + '</date>';
				if (e.event.image || e.image)
					s += '<img src="' + global.serverImg + (e.event.image || e.image) + '"/>';
				s += e.event.description;
				s += '</p></card>'
			}
			v.events = s ? s : '<card style="text-align:center;padding:0.5em;"><p>' + ui.l('home.noNews').replace('{0}', ui.l('events.title')) + '</p></card>';
			if (user.contact.type != 'adminContent')
				v.hideEdit = ' class="hidden"';
			ui.navigation.openHint({ desc: pageHome.templateNews(v), pos: '1em,1em', size: '-1em,auto', onclick: 'return false' });
		}
		if (!pageHome.news)
			communication.ajax({
				url: global.serverApi + 'db/list?query=contact_listNews&limit=25' + (user.contact.type == 'adminContent' ? '' : '&search=' + encodeURIComponent('contactNews.publish<\'' + global.date.local2server(new Date()) + '\'')),
				webCall: 'pageHome.openNews()',
				responseType: 'json',
				success(l) {
					pageHome.news = l;
					render();
				}
			});
		if (!pageHome.events) {
			communication.ajax({
				url: global.serverApi + 'db/list?query=event_list&search=' + encodeURIComponent('contact.type=\'adminContent\' and event.endDate>=\'' + global.date.local2server(new Date()).substring(0, 10) + '\''),
				webCall: 'pageHome.openNews()',
				responseType: 'json',
				success(l) {
					var e = pageEvent.getCalendarList(l);
					pageHome.events = [];
					for (var i = 0; i < e.length; i++) {
						if ('outdated' != e[i])
							pageHome.events.push(e[i]);
					}
					render();
				}
			});
		}
		render();
	}
	static openStatistics(openIntro) {
		ContentAdmin.init();
		formFunc.svg.replaceAll();
		initialisation.reposition();
		if (openIntro)
			ui.navigation.openHint({ desc: 'statisticsCharts', pos: '10%,15em', size: '80%,auto', hinky: 'left:50%;', hinkyClass: 'top' })
	}
	static reset() {
		pageHome.badge = -1;
		ui.html('chatList', '');
		ui.html('notificationList', '');
		ui.html('home', '');
		ui.classRemove('dialog-navigation buttonIcon', 'pulse highlight');
		ui.q('dialog-navigation badgeChats').innerHTML = '';
		ui.q('dialog-navigation badgeNotifications').innerHTML = 0;
	}
	static saveNews() {
		formFunc.resetError(ui.q('dialog-popup textarea'));
		var v = formFunc.getForm('popup');
		if (!ui.q('dialog-popup textarea').value)
			formFunc.setError(ui.q('dialog-popup textarea'), 'error.description');
		else
			formFunc.validation.filterWords(ui.q('dialog-popup textarea'));
		if (ui.q('dialog-popup errorHint')) {
			ui.q('dialog-popup popupContent>div').scrollTo({ top: 0, behavior: 'smooth' });;
			return;
		}
		v.classname = 'ContactNews';
		if (ui.q('dialog-popup input[name="id"]').value)
			v.id = ui.q('dialog-popup input[name="id"]').value;
		communication.ajax({
			url: global.serverApi + 'db/one',
			method: v.id ? 'PUT' : 'POST',
			webCall: 'pageHome.saveNews()',
			body: v,
			success(r) {
				ui.navigation.closePopup();
				user.remove('news');
				pageHome.news = null;
			}
		});

	}
	static selectTab(id) {
		ui.q('dialog-hint tabBody').style.marginLeft = (id == 'news' ? 0 : '-100%');
		ui.classRemove('dialog-hint tab', 'tabActive');
		ui.classAdd('dialog-hint tab[i="' + id + '"]', 'tabActive');
	}
	static teaserContacts() {
		communication.ajax({
			url: global.serverApi + 'action/teaser/contacts',
			webCall: 'pageHome.teaserContacts()',
			responseType: 'json',
			error() { },
			success(l) {
				var s = '';
				for (var i = 1; i < l.length; i++) {
					var e = model.convert(new Contact(), l, i);
					s += '<card onclick="details.open(' + e.id + ',' + JSON.stringify({ webCall: 'pageHome.teaserContacts()', query: 'contact_list' + (user.contact ? '' : 'Teaser'), search: encodeURIComponent('contact.id=' + e.id) }).replace(/"/g, '&quot;') + ',pageContact.detail)"><img src="' + global.serverImg + e.imageList + '"/><text>' + e.pseudonym + '</text></card>';
				}
				ui.q('home teaser.contacts>div').innerHTML = s;
				ui.css('home teaser.contacts', 'opacity', 1);
			}
		});
	}
	static teaserEvents(search) {
		communication.ajax({
			url: global.serverApi + 'action/teaser/events' + (search ? '?search=' + encodeURIComponent(search) : ''),
			webCall: 'pageHome.teaserEvents(search)',
			responseType: 'json',
			error(e) {
				ui.q('home teaser.events>div').innerHTML = ui.l('error.noNetworkConnection');
				ui.css('home teaser.events', 'opacity', 1);
			},
			success(l) {
				var e, s = '';
				if (user.contact)
					s = '<card onclick="pageEvent.edit()" class="mainBG"><img source="events"/><text>' + ui.l('events.new').replace(' ', '<br/>') + '</text></card>';
				e = pageEvent.getCalendarList(l);
				var dates = ui.qa('dialog-hint eventFilter:last-child input-checkbox[checked="true"]');
				var dateFiltered = function (e2) {
					if ('outdated' == e2)
						return true;
					if (!dates.length)
						return false;
					for (var i = 0; i < dates.length; i++) {
						if (e2.event.startDate.toISOString().indexOf(dates[i].getAttribute('value')) == 0)
							return false;
					}
					return true;
				}
				for (var i = 0; i < e.length; i++) {
					if (!dateFiltered(e[i]))
						s += '<card onclick="details.open(&quot;' + pageEvent.getId(e[i]) + '&quot;,' + JSON.stringify({
							webCall: 'pageHome.teaserEvents(search)', query: 'event_list' + (user.contact ? '' : 'Teaser'), search: encodeURIComponent('event.id=' + e[i].event.id)
						}).replace(/"/g, '&quot;') + ',pageLocation.detailLocationEvent)"><img src="' + global.serverImg + (e[i].event.imageList ? e[i].event.imageList : e[i].imageList ? e[i].imageList : e[i].contact.imageList) + '"/><text>' + global.date.formatDate(e[i].event.startDate, 'noWeekday') + '<br/>' + e[i].event.description + '</text></card>';
				}
				ui.q('home teaser.events>div').innerHTML = s;
				ui.css('home teaser.events', 'opacity', 1);
				formFunc.svg.replaceAll();
			}
		});
	}
	static toggleNotification() {
		if (!user.contact)
			ui.navigation.openHint({ desc: 'notification', pos: '-0.5em,-7.5em', size: '80%,auto', hinkyClass: 'bottom', hinky: 'right:0;' });
		else if (!ui.q('notificationList>div'))
			ui.navigation.openHint({ desc: 'notificationEmpty', pos: '-0.5em,-7.5em', size: '80%,auto', hinkyClass: 'bottom', hinky: 'right:0;' });
		else {
			if (ui.q('notificationList').style.display == 'none')
				pageChat.closeList();
			ui.toggleHeight('notificationList');
		}
	}
	static updateLocalisation() {
		if (user.contact && user.clientId == 1)
			ui.html('home svg text', geoData.current.town);
	}
}