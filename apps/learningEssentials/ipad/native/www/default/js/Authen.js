
/* JavaScript content from js/Authen.js in folder common */
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
 * Base on Worklight Custom Authenticate Concept, this is defined for handler the authenticate process of the app
 * AuthRealmChallengeHandler object
 */
var AuthRealmChallengeHandler = WL.Client.createChallengeHandler(BonD.WL_AUTHEN_REALM);
AuthRealmChallengeHandler.isCustomResponse = function(response) {
	WL.Logger.debug('isCustomResponse', response);
    if (!response || !response.responseJSON) {
        return false;
    }
    return (response.responseJSON.authStatus) ? true: false;
};
/**
 * Handle authentication response from server.
 */
AuthRealmChallengeHandler.handleChallenge = function(response){
	console.log('handleChallenge');
	var authStatus = response.responseJSON.authStatus;
	if (authStatus == "required"){
        if (response.responseJSON.errorMessage){
        	window.alert(response.responseJSON.errorMessage, null, Messages.application_title);
        	//$('#loginMsg').text(response.responseJSON.errorMessage);
        }
        changePageTo("#login");
        console.log('required authen');
        if (BonD.isAuthenticated()) {
        	BonD.setSessionEnded();
        	//WL.Client.reloadApp();
        	setTimeout(function(){window.alert(Messages.sessionExpired, null, Messages.application_title);}, 500);
        	return;
        }
        if (Authen.WLAndroidAuthenCallback) {
        	Authen.WLAndroidAuthenCallback();
        }
	} else if (authStatus == "complete"){
		console.log('passed authen');
		
		localStorage.setItem("username" ,$("#j_username").val() );
		//Authen.saveUser();
		//changePageTo('#dashboard');
		//alert('authentication done');
	
		drList();
		BonD.setSessionStarted();
		$('#loginMsg').text('');
		AuthRealmChallengeHandler.submitSuccess();
	}
};
/**
 * Callback function of login information after submit.
 */
AuthRealmChallengeHandler.submitLoginFormCallback = function(response) {
	console.log('submitLoginFormCallback');
	//BonD.busierHide('login');
	
    var isLoginFormResponse = AuthRealmChallengeHandler.isCustomResponse(response);
    if (isLoginFormResponse){
    	//BonD.busierHide('login');
    	console.log('submitLoginFormCallback: challenge again');
    	AuthRealmChallengeHandler.handleChallenge(response);
    } else {
    	console.log('submitLoginFormCallback: no response from server');
    	//BonD.busierHide('login');
    	alert(Messages.serverNotResponding, null, Messages.application_title);
    }
};

/**
 * Authenticator object, that contains some common authenticate method like login, logout with normal network and IMC as well
 */
var Authen = {
		/**
		 * Logout, ask for logout.
		 */
	logout : function() {
		console.log('logout');
		var _doLogout = $.proxy(Authen.performLogout, Authen);
		window.openDialog('Confirm', Messages.logoutConfirm, _doLogout);
	},
	/**
	 * Actually perform logout.
	 */
	performLogout : function() {
		console.log('performLogout');
		changePageTo("#login");
		BonD.busierShow('login');
		var _doLogoutCb = $.proxy(Authen.logoutCallback, Authen);
		WL.Client.logout(BonD.WL_AUTHEN_REALM, {
			onSuccess : _doLogoutCb
		});
		WL.Client.reloadApp();
	},
	/**
	 * On success in logout, make a callback. 
	 */
	logoutCallback : function() {
		console.log('logoutCallback');
		BonD.busierHide('login');
		//WL.Client.reloadApp();
	},
	/**
	 * Perform IMC logout.
	 * @param loadingText busy text when logout
	 * @param logoutIMCCallback the logout callback
	 */
	performIMCLogout: function(loadingText, logoutIMCCallback) {
		console.log('performIMCLogout');
		var server = BonD.appServer, connectURL =  server.host + server.logoutContext;
		console.log('connectURL', connectURL);
		var _succ = function(data, status, xhr) {
			console.log('success, status: ' + status );
			if (logoutIMCCallback) {
				logoutIMCCallback();
			}
		}, _fail = function(xhr, status, error) {
			console.log('error: ' + JSON.stringify(error) + ', status: ' + status );
			if (logoutIMCCallback) {
				logoutIMCCallback();
			}
		};
		this.openConnection({type:'GET', url:connectURL}, null, null, _succ, _fail, loadingText);
	},
	/**
	 * Request to do the login.
	 * @param username the username
	 * @param password the password
	 */
	doLogin : function(username, password) {
		console.log('doLogin');
//		if (BonD.enableIMC && isIOSEnv()) {
//			this.performIMCNativeAuthen(username, password);
//		} else {
			this.performAuthen(username, password);
//		}
	},
	/**
	 * Callback of IMC native authentication.
	 * @param username the username
	 * @param password the password
	 * @param xhr returned XHR
	 */
	imcAuthenCb : function(username, password, xhr) {
		console.log('imcAuthenCb: ' + JSON.stringify(xhr));
		var sta = parseInt(xhr.status);
		if (sta < 100) {//fail
			this.authenErrHandler(xhr);
		} else if (sta < 300) {//success
			this.performAuthen(username, password);
		} else {//fail
			this.authenErrHandler(xhr);
		}
	},
	/**
	 * Perform IMC authentication by native code.
	 * @param username the username
	 * @param password the password
	 */
	performIMCNativeAuthen: function(username, password) {
		console.log('performIMCNativeAuthen');
		var server = BonD.enableIMC?  BonD.appServer : BonD.webServer;
		var connectURL =  server.host + server.context + server.path;
		console.log('connectURL', connectURL);
		var _imcAuthenCb = $.proxy(Authen.imcAuthenCb, Authen, username, password);
		BonD.busierShow('login', Messages.authenticating_indicator_title);
		window.plugins.lcmAuthentication.authenticate(_imcAuthenCb, _imcAuthenCb, username, password, connectURL);
	},
	/**
	 * Perform authenticate, but we need to query to the Worklight authorized resource first, that will returns 401 code and available the authenticate URI
	 * @param username
	 * @param password
	 */
	performAuthen: function(username, password) {
		console.log('performAuthen');
		var server = BonD.enableIMC?  BonD.appServer : BonD.webServer;
		var connectURL =  server.host + server.context + server.path;
		console.log('connectURL: '+ connectURL);
		var _loginCb = $.proxy(Authen.performWLAuthen, Authen, username, password);
		var _loginErrCb = $.proxy(Authen.authenErrHandler, Authen);
		this.openConnection({type:'GET', url:connectURL}, username, password, _loginCb, _loginErrCb, Messages.authenticating_indicator_title);
	},
	/**
	 * Perform Worklight authenticate with custom security check URI
	 * @param username
	 * @param password
	 */
	performWLAuthen : function(username, password) {
		console.log('performWLAuthen');
		BonD.busierShow('login', Messages.authenticating_indicator_title);
		var reqURL = '/custom_security_check';
		var options = {
			parameters : {
				j_username : username,
				j_password : password
			},
			headers : {}
		};
		if (window.j_serial) {
			options.parameters = $.extend(options.parameters, {
				j_serial: window.j_serial,
				j_os    : window.j_os
			});
		}
		//console.log('Authen options: ' + JSON.stringify(options));
		if (isAndroidEnv()) {
			//set basic authen for background thread use later, fix the web-browser android issue
			var base64uid = Base64.encode(username + ":" + password);
			WL.Client.addGlobalHeader("Authorization", "Basic " + base64uid);
			//setTimeout($.proxy(Authen.performWLAndroidAuthen, Authen, reqURL, options), 3000);
			this.performWLAndroidAuthen(reqURL, options);
			return;
		}
		AuthRealmChallengeHandler.submitLoginForm(reqURL, options, AuthRealmChallengeHandler.submitLoginFormCallback);
		
	},
	/**
	 * Worklight authentication on Android. 
	 * @param reqURL authentication URL
	 * @param options options for WL authentication
	 */
	performWLAndroidAuthen: function(reqURL, options) {
		var _loadCb = $.proxy(Authen.performWLAndroidAuthenCb, Authen, reqURL, options);
		LoginAdapter.checkSession('', [], _loadCb, _loadCb);
		this.WLAndroidAuthenCallback = _loadCb;
	},
	/**
	 * Callback for performWLAndroidAuthen function.
	 */
	performWLAndroidAuthenCb: function(reqURL, options) {
		if (this.WLAndroidAuthenCallback) {
			AuthRealmChallengeHandler.submitLoginForm(reqURL, options, AuthRealmChallengeHandler.submitLoginFormCallback);
        }
		this.WLAndroidAuthenCallback = null;
	},
	/**
	 * AJAX request to open a connection to server
	 * @param opt AJAX options
	 * @param username the username
	 * @param password the password
	 * @param successCb success callback
	 * @param failureCb failure callback
	 * @param loadingText loading text
	 */
	openConnection : function(opt, username, password, successCb, failureCb, loadingText) {
		console.log('openConnection');
		var __succ = $.proxy(function(successCb, data, status, xhr) {
			console.log('success');
			//console.log("Success in openConnection", data, status, xhr);
			if (data) {
				data = data.replace(/(\/\*\-secure\-)|(\/n)/g, '').replace(/\}\*\//g, '}');
				try {
					var json = JSON.parse(data), err = json['errors'];
					if (json.isSuccessful == false && err) {
						console.log('Error: ', err);
						BonD.busierHide('login');
						alert(err[0], null, 'Error');
					} else {
						successCb();
					}
				} catch(e) {
					console.log('JSON parse error: ', e);
					successCb();
				}
			} else {
				successCb();
			}
		}, window, successCb);
		
		var __fail = $.proxy(function(failureCb, xhr, status, error) {
			setTimeout($.proxy(BonD.busierHide, BonD, 'login'), 100);
			failureCb(xhr);
			console.log('error: ' + JSON.stringify(error) + ', status: ' + status );
		}, window, failureCb);
		
		var options = {
				type : 'GET',
				url : '',
				cache : false,
				dataType: 'text',
				timeout : 20000, // ms
				error : __fail,
				success : __succ
			},
		isExternal = opt.url.match(/(lmc)/i),
		isLogout = opt.url.match(/(CM_logout)/i),
		textLoader = (loadingText||Messages.loading_indicator_title);
		if (isExternal && !isLogout) {
			options.beforeSend = function(xhr) {
				var base64uid = Base64.encode(username + ":" + password);
				xhr.setRequestHeader("Authorization", "Basic " + base64uid);
			};
		}
		BonD.busierShow('login', textLoader);
		options = $.extend(options, opt);
		console.log('Connection options: ' + JSON.stringify(options));
		$.ajax(options);
	},
	/**
	 * Authentication error handler.
	 * @param xhr XHR object
	 */
	authenErrHandler : function(xhr) {
		console.log('authenErrHandler');
		BonD.busierHide('login');
		var isSignin = true, status = xhr.status, statusText = xhr.statusText, msg = BonD.errorHandler(isSignin, status, statusText);
		window.alert(msg, null, Messages.application_title);
	},
	/**
	 * Clean the session.
	 */
	cleanSession : function() {
		console.log('cleanSession');
		if (BonD.enableIMC && window.device) {
			console.log('clean IMC session');
			var server = BonD.appServer, connectURL =  server.host + server.logoutContext;
			console.log('connectURL: ' + connectURL);
			$.ajax({
				type : 'GET',
				url : connectURL,
				cache : false,
				dataType: 'text',
				timeout : 12000, // ms
				error : $.proxy(function(xhr, status, error) {
					console.log('error: ' + JSON.stringify(error) + ', status: ' + status );
				}, window),
				success : $.proxy(function(data, status, xhr) {
					console.log('success, status: ' + status );
				}, window)
			});
		}
		if (this.enableJSONStore) {
			//clear switch jsonstore mode if any
			BonD.switchJStore(false);
		}
	},
	/**
	 * Save username to local cache.
	 */
	saveUser: function() {
		var _saveUser = $.proxy(CStore.writeCache, CStore, CStore.KEY_USERNAME, $('#j_username').val(), null, null);
		CStore.removeCache(CStore.KEY_USERNAME, _saveUser, _saveUser);
	},
	/**
	 * Load username from local cache.
	 */
	getUser: function() {
		var _readCb = $.proxy(CStore.readCache, CStore, CStore.KEY_USERNAME, window.readCacheCallback);
		 setTimeout($.proxy(CStore.openCache, CStore, _readCb), 200);
	}
};
/**
 * Login by tab Login button.
 */
window._signIn = function(e) {
	console.log('_signIn');
	e.stopImmediatePropagation();
	e.preventDefault();
	var userid = $('#j_username').val();
	var passwd = $('#j_password').val();
	if(!userid || !passwd) {
		window.alert(Messages.allFieldRequired, null, Messages.application_title);
    	
		
		_moveOn('#j_username', e);
        return;
	} else if (!isValidEmail(userid)) {
		window.alert(Messages.invalidUsername, null, Messages.application_title);
		
		_moveOn('#j_username', e);
		return;
	}
	Authen.doLogin(userid, passwd);
	$('#j_password').blur();
};
/**
 * Login by tap Enter key.
 */
window._signInByEnter = function(e) {
	if (e.keyCode == 13 ) {
		_signIn(e);
	}
};
/**
 * move to others input fields
 */
window._moveOn = function(jid, e) {
	if (e.keyCode == 13) {
		console.log('_moveOn');
		$(this).blur();
		$(jid).focus();
		if (isAndroidEnv()) {
			window.plugins.SoftKeyboardPlugin.show();
		}
	}
};
/**
 * Check valid email.
 */
window.isValidEmail = function (email) {
	var emailReg = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
	var f = emailReg.test(email);
	return f;
};
/**
 * Set username when get it from local cache.
 */
window.readCacheCallback = function(d) {
	console.log('readCacheCallback: ' + JSON.stringify(d));
	$("#j_username").val(d);
};
//UI session
$( "#login" ).on("pagecreate", function( event, ui ) {
	console.log("page login created");
	$("#j_username").on("keydown", $.proxy(window._moveOn, window, '#j_password'));
	$("#j_password").on("keydown", _signInByEnter);
	$("#loginBtn").on("tap", _signIn);
	//set app version
	 $("#appVersion").html(BonD.version);
});
$( "#login" ).on("pageshow", function( event, ui ) {
	console.log('page login show');
	$('#j_password').val('');
	//$('#j_username').val('vietn@vn.ibm.com');
	//$('#j_password').val('');
	setTimeout($.proxy(Authen.cleanSession, Authen), 100);
});
