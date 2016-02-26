/* ***************************************************************** */
/*                                                                   */
/* IBM Confidential                                                  */
/*                                                                   */
/* OCO Source Materials                                              */
/*                                                                   */
/* Copyright IBM Corp. 2014                                          */
/*                                                                   */
/* The source code for this program is not published or otherwise    */
/* divested of its trade secrets, irrespective of what has been      */
/* deposited with the U.S. Copyright Office.                         */
/*                                                                   */
/* ***************************************************************** */
/**
 * The Application specific configurations and some commons functionality like the request error handler, show/hide the indicator
 */
var BonD = {
		/**
		 * Application version
		 */
		version: '1.1408.10',
		/**
		 * JSONStore enable or not (default is not enable with the "false" value)
		 */
		enableJSONStore : false,
		/**
		 * Enable IMC port
		 */
		enableIMC: true,
		/**
		 * is offline mode
		 */
		isOffline: false,
		/**
		 * Application mode (values: prod, dev. If dev the server location will be used to locServer )
		 */
		appMode : 'dev',
		/**
		 * Worklight authentication realm
		 */
		WL_AUTHEN_REALM : 'WL_IIPAuthenticatorRealm',
		/**
		 * Application production server location, which contents host, context, path for easier change the configuration at development, building and deployment times
		 */
		appServer: {
			host: "https://lmc2.watson.ibm.com:15013",
			context: "/essentials/",
//			context: "/app/bond/",
			logoutContext: "/CM_logout",
			path: "invoke?adapter=bluePageLoginAdapter&procedure=checkSession&parameters=[]"
		},
		/**
		 * Web application server location, like appServer above
		 */
		webServer: {
			host: "https://lmc2.watson.ibm.com:15013",
			context: "/essentials/",
			path: "invoke?adapter=bluePageLoginAdapter&procedure=checkSession&parameters=[]"
		},
		/**
		 * Local application server location, 
		 * For easy switch to development environment
		 * Developer can change the host as his server configuration, this integrates with appMode='dev'
		 */
		locServer: {
			host: "https://lmc2.watson.ibm.com:15013",
			context: "/essentials/",
			path: "invoke?adapter=bluePageLoginAdapter&procedure=checkSession&parameters=[]"
		},
		/**
		 * Switch to use the JSONStore.
		 */
		switchJStore : function(enable) {
			console.log('switchJStore', enable);
		},
		/**
		 * Checking for the network connection and enable or disable the offline mode searching.
		 */
		checkNetwork: function() {
			console.log('checkNetwork');
			WL.Device.getNetworkInfo($.proxy(BonD.checkNetworkCallback, BonD));
		},
		/**
		 * Checking network callback.
		 * @param networkInfo the network information
		 */
		checkNetworkCallback :function(netInfo) {
			console.log('checkNetworkCallback', JSON.stringify(netInfo));
			var isNetworkConnected = (netInfo.isNetworkConnected === 'true');
			console.log('isNetworkConnected: ' + isNetworkConnected);
			if (this.enableJSONStore) {
				if (isNetworkConnected) {
					this.isOffline = false;
					this.switchJStore(false);
				} else {
					this.isOffline = true;
					this.switchJStore(true);
				}
			}
		},
		/**
		 * The device on resume.
		 */
		deviceOnResume : function() {
			console.log('Device onResume');
			if (this.isAuthenticated()) {
				console.log('authenticated');
				if (this.isExpireDate()) {
					this.setSessionEnded();
					alert(Messages.sessionExpired, Authen.performLogout, Messages.application_title);
					console.log('Session expired');
				} else {
					console.log('Session available');
					this.checkNetwork();
				}
			} else {
				console.log('Required authorizing');
			}
		},
		/**
		 * The device online mode.
		 */
		deviceOnline : function() {
			console.log('deviceOnline');
			if (this.isAuthenticated()) {
				console.log('authenticated');
				this.checkNetworkCallback({'isNetworkConnected': 'true'});
			}
		},
		/**
		 * The device offline mode.
		 */
		deviceOffline : function() {
			console.log('deviceOffline');
			if (this.isAuthenticated()) {
				console.log('authenticated');
				this.checkNetworkCallback({'isNetworkConnected': 'false'});
			}
		},
		/**
		 * Device backbutton handler.
		 */
		deviceBackbutton : function() {
			console.log('deviceBackbutton');
			var activePage = getActivePage().attr("id");
			console.log('activePage: ' + activePage);
			if (activePage == 'login') {
	            navigator.app.exitApp();
	        } else {
	            //navigator.app.backHistory();
	        	var backup = null, backPage = null;
	        	if (this.pageIdHistory.length > 0) {
	        		if (this.pageIdHistory.length > 1) {
	        			//remove the current
	        			backup = this.pageIdHistory.pop();
	        		}
	        		//get the previous
	        		backPage = this.pageIdHistory.pop();
	        	}
	        	console.log('backPage: ' + backPage);
	        	if (!backPage || backPage == 'login') {
	        		Authen.logout();
	        		if (backup) this.pageIdHistory.push(backup);
	        		if (backPage) this.pageIdHistory.push(backPage);
	        	} else {
		        	changePageTo('#'+backPage, {'reverse': true});
	        	}
	        }
		},
		/**
		 * page id history
		 */
		pageIdHistory: [],
		/**
		 * Busier object, which contents the sets of loading indicators 
		 */
		busier: {
			//pageId, busy
		},
		/**
		 * Show the specific busier for the page/screen
		 * @param pageId
		 * @param text
		 */
		busierShow : function(pageId, text) {
			text = text || Messages.loading_indicator_title;
			if (device) {
				var busy = this.busier[pageId];
				if (pageId && pageId.length > 0 && !busy) {
					busy = new WL.BusyIndicator(pageId, {text: text});
					this.busier[pageId] = busy;
				}
				if (busy) {
					// reset loading text
					busy.__options['text'] = text;
					busy.show();
				}
			} else {
				if (pageId && pageId.length > 0) {
					jLoading('show');
				}
			}
		},
		/**
		 * Hide the specific busier for the page/screen
		 * @parameter pageId
		 */
		busierHide : function(pageId) {
			setTimeout(function(){
				if (device) {
					var busy = BonD.busier[pageId];
					if (busy) {
						busy.hide();
						delete BonD.busier[pageId];
					}
				} else {
					jLoading('hide');
				}
			}, 200);
		},
		/**
		 * Expire period time
		 */
		EXPIRE_PERIOD: (30*60*1000),
		/**
		 * Start of the session time
		 */
		startTime: 0,
		/**
		 * End of the session time
		 */
		endTime: 0,
		/**
		 * Authenticated property
		 */
		authenticated: false,
		
		/**
		 * Set the session state as started
		 */
		setSessionStarted: function() {
			console.log('setSessionStarted');
			this.startTime = (new Date()).getTime();
			this.endTime = 0;
			this.authenticated = true;
		},
		/**
		 * Set the session state as ended
		 */
		setSessionEnded: function() {
			console.log('setSessionEnded');
			this.endTime = (new Date()).getTime();
			this.authenticated = false;
		},
		/**
		 * Check if session was authenticated.
		 */
		isAuthenticated : function() {
			console.log('isAuthenticated');
			return this.authenticated;
		},
		/**
		 * Is meet the expired time.
		 */
		isExpireDate: function() {
			console.log('isExpireDate');
			var st = this.startTime, ep = this.EXPIRE_PERIOD,
			nt = (new Date()).getTime(), duration = (nt-st);
			return (duration > ep);
		},
		/**
		 * Error handler.
		 */
		errorHandler : function(isSignin, status, statusText) {
			console.log('errorHandler');
			var sta = parseInt(status), txt = statusText, msg = Messages.unknown_error_code + status;
			if (sta < 100) { //return code is Unknown
				if ("timeout" == txt) {
					msg = Messages.request_gets_timeout;
				} else if (txt == 'error') {
					msg = Messages.please_check_connection;
				} else {
					msg = txt;
				}
			} else if (sta < 200) { //Informational 1xx
				msg = Messages.error_message_less200;
			} else if (sta < 300) { //Successful 2xx
				msg = Messages.error_message_less300;
			} else if (sta < 400) { //Redirection 3xx
				msg = Messages.error_message_less400;
			} else if (sta < 500) { //Client Error 4xx
				switch (sta) {
				case 400:
					msg = Messages.error_message_400;
					break;
				case 401:
					if (isSignin) {
						msg = Messages.error_message_401_can_not_authenticate;
					} else {
						msg = Messages.error_message_401_unauthorized;
					}
					break;
				case 403:
					msg = Messages.error_message_403;
					break;
				case 404:
					msg = Messages.error_message_404;
					break;
				case 408:
					msg = Messages.error_message_408;
					break;
				case 417:
					msg = Messages.error_message_417;
					break;
				}
			} else { //Server Error 5xx
				switch (sta) {
				case 500:
					msg = Messages.error_message_500;
					break;
				case 501:
					msg = Messages.error_message_501;
					break;
				case 502:
					msg = Messages.error_message_502;
					break;
				case 503:
					msg = Messages.error_message_503;
					break;
				case 504:
					msg = Messages.error_message_504;
					break;
				case 505:
					msg = Messages.error_message_505;
					break;
				}
			}
			return msg;
		}
};