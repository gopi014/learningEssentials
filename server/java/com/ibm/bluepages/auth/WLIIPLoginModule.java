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
package com.ibm.bluepages.auth;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;

import com.worklight.server.auth.api.MissingConfigurationOptionException;
import com.worklight.server.auth.api.UserIdentity;
import com.worklight.server.auth.api.WorkLightAuthLoginModule;

/**
 * This class is used to process the authentication, it implemented follow the instruction of Worklight custom login module
 * @author nghiemvanviet
 * @version 1.0 May 20, 2014
 * Worklight IIP Login Module
 */
public class WLIIPLoginModule implements WorkLightAuthLoginModule {
	private static final Logger logger = Logger.getLogger(WLIIPLoginModule.class.getName());

	/**
	 * Username
	 */
	private String username;
	/**
	 * Password
	 */
	private String password;
	
	/**
	 * Initialize the login module with the given configuration options.
	 */
	public void init(Map<String, String> options) throws MissingConfigurationOptionException {
		logger.fine("WLIIPLoginModule initialized");
	}

	/**
	 * Check the authentication data that is collected by the authenticator. Decide if login should be authorized or rejected.
	 * @param authenticationData the data provided by the authenticator
	 */
	public boolean login(Map<String, Object> authenticationData) {
		logger.fine("WLIIPLoginModule.login");
		boolean isAuth = false;
		username = (String) authenticationData.get("username");
		password = (String) authenticationData.get("password");
		
		if (username != null && username.length() > 0 && password != null && password.length() > 0) {
			try {
				isAuth = IIPAuthenticator.performAuth(username, password);
			} catch (Exception e) {
				throw new RuntimeException("Could not authenticate at this time. Please try again later. Error: " + e.getMessage());
			}
			if (!isAuth) {
				throw new RuntimeException("Could not authenticate due to incorrect Userid or Password. Please try again.");
			}
			//check for bluegroup if need, to comment out this code because we don't support the bluegroup check
/*			try {
				isAuth = IIPAuthenticator.isUserInGroup(username, IIPAuthenticator.BLUEGROUPDS_USER);
			} catch (Exception e) {
				throw new RuntimeException("Could not authenticate at this time. Please try again later. Error: " + e.getMessage());
			}*/
			if (!isAuth) {
				throw new RuntimeException("You have no authority to access the application at this time. Please contact the application administrator for more detail.");
			}
		} else {
			throw new RuntimeException("Username and Password cannot be empty");
		}

		return isAuth;
	}

	/**
	 * This method is used to create an authenticated UserIdentity object after the credentials validation succeeds.
	 */
	public UserIdentity createIdentity(String loginModule) {
		logger.fine("createIdentity");
		HashMap<String, Object> customAttributes = new HashMap<String, Object>();
		customAttributes.put("AuthenticationDate", new Date());
		
		UserIdentity identity = new UserIdentity(loginModule, username, null, null, customAttributes, password);
		return identity;
	}

	/**
	 * This method is used to clean up state of the login module on logout (implicit or explicit).
	 */
	public void logout() {
		logger.fine("logout");
		username = null;
		password = null;
	}

	/**
	 * This method is used to clean up state of the login module and is called when the login process is interrupted.
	 */
	public void abort() {
		logger.fine("abort");
		username = null;
		password = null;
	}

	/**
	 * This method creates a deep copy of class members.
	 */
	@Override
    public WLIIPLoginModule clone() throws CloneNotSupportedException {
		logger.fine("clone");
        return (WLIIPLoginModule) super.clone();
    }
}
