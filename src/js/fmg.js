import { model } from './model';
import { global } from './global';
import { initialisation } from './initialisation';
import { intro } from './intro';
import { pageHome } from './pageHome';
import { pageLocation } from './pageLocation';
import { pageLogin } from './pageLogin';
import { pageContact } from './pageContact';
import { ui, formFunc } from './ui';
import { communication, FB } from './communication';
import { lists } from './lists';
import { details } from './details';
import { pageChat } from './pageChat';
import { pageSettings } from './pageSettings';
import { pageInfo } from './pageInfo';
import { pageWhatToDo } from './pageWhatToDo';
import { ratings } from './ratings';
import { user } from './user';
import { geoData } from './geoData';
import { bluetooth } from './bluetooth';
import { events } from './events';

window.model = model;
window.global = global;
window.initialisation = initialisation;
window.user = user;
window.ui = ui;
window.events = events;
window.pageLogin = pageLogin;
window.pageHome = pageHome;
window.pageContact = pageContact;
window.pageLocation = pageLocation;
window.intro = intro;
window.formFunc = formFunc;
window.lists = lists;
window.details = details;
window.pageChat = pageChat;
window.pageSettings = pageSettings;
window.pageInfo = pageInfo;
window.pageWhatToDo = pageWhatToDo;
window.communication = communication;
window.FB = FB;
window.ratings = ratings;
window.geoData = geoData;
window.bluetooth = bluetooth;