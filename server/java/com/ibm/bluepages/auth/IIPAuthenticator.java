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

import java.util.Vector;

import com.ibm.bluepages.BPResults;
import com.ibm.bluepages.BluePages;
import com.ibm.swat.password.ReturnCode;
import com.ibm.swat.password.cwa2;

/**
 * This class is used to process the authentication through IIP.
 * @author nghiemvanviet
 * @version 1.0 May 20, 2014
 * IIP authenticator
 */
public class IIPAuthenticator {
	
	public static String BLUEGROUPDS_USER = "bond-users";
	
	public static String BLUEPAGES_LDAP = "bluepages.ibm.com";
	public static String BLUEGROUPS_LDAP = "bluegroups.ibm.com";
	
	/**
	 * IIPAuthenticator constructor.
	 */
	private IIPAuthenticator(){
		//protected constructor
	}
	
	/**
	 * Check authentication.
	 * 
	 * @return true/false
	 * @throws Exception
	 */
	public static boolean performAuth(String username, String password) {
		boolean isAuth = false;
		cwa2 cwa = new cwa2(BLUEPAGES_LDAP, BLUEGROUPS_LDAP);
		ReturnCode rc = cwa.authenticate(username, password);

		isAuth = (rc.getCode() == 0);

		return isAuth;
	}

	/**
	 * Check if user is a member of specified group.
	 * 
	 * @param userName
	 *            the String
	 * @return
	 */
	public static boolean isUserInGroup(String userName, String group) {
		cwa2 cwa = new cwa2(BLUEPAGES_LDAP, BLUEGROUPS_LDAP);
		ReturnCode rc = null;
		String msg = null;
		rc = cwa.inAGroup(userName, group);
		msg = rc.getMessage();
		return (msg.equals("Success"));
	}
	
	/**
	 * Get user's full name with intranetID.
	 * 
	 * @param intranetId
	 *            
	 * @return
	 */
	public static String getUsername(String intranetId) {
		String name = "";
		BPResults results = BluePages.getPersonsByInternet(intranetId);
		@SuppressWarnings("unchecked")
		Vector<String> nameCols = results.getColumn("NAME");

		if (nameCols == null || nameCols.size() == 0)
			return "Unknown";

		name = (String) nameCols.elementAt(0);
		if (name == null) {
			return "Unknown";
		}

		int endIdx = name.indexOf("*");
		if (endIdx != -1) {
			name = name.substring(0, endIdx);
		}

		String[] names = name.split("\\,");
		if (names.length >= 2) {
			name = names[1].substring(1, names[1].length()) + " " + names[0];
		} else {
			name = name.replaceAll("\\,", "");
		}// if-else			
		return name;
	}

	/**
	 * Get email by name.
	 * @param nameFragment
	 * @return
	 */
	public static String getEmailByName(String nameFragment) {
		String email = "";
		BPResults results = BluePages.getPersonsByNameLite(nameFragment);
		@SuppressWarnings("unchecked")
		Vector<String> internet = results.getColumn("INTERNET");
		if ( internet != null && internet.size() > 0) {
			email = internet.get(0);
		}
		
		if (email == null || email.length() == 0) {
			email = "";
		}
		return email;
	}
	
	/**
	 * Get email by Note ID.
	 * @param idFragment the Note ID
	 * @return
	 */
	public static String getEmailByNotesID(String idFragment) {
		StringBuffer buf = new StringBuffer();
		return getEmailByNotesID(idFragment, buf);
	}
	
	/**
	 * Get email by Note ID.
	 * @param idFragment
	 * @param buf
	 * @return
	 */
	public static String getEmailByNotesID(String idFragment, StringBuffer buf) {
		String email = "";
		buf.delete(0, buf.length());
		String [] list = idFragment.split("/");
		for (int i = 0; i < list.length; i++) {
			if (i == 0) {
				buf.append("CN=");
				buf.append(list[i]);
			} else if (i == (list.length-1)) {
				buf.append("/O=");
				buf.append(list[i]);
			} else {
				buf.append("/OU=");
				buf.append(list[i]);
			}
		}
		
		BPResults results = BluePages.getPersonsByNotesIDLite(buf.toString(), "UTF-8");
		@SuppressWarnings("unchecked")
		Vector<String> internet = results.getColumn("INTERNET");
		if ( internet != null && internet.size() > 0) {
			email = internet.get(0);
		}
		
		if (email == null || email.trim().length() == 0) {
			email = "";
		}
		return email.trim();
	}
	
	/**
	 * Get email by CNUM.
	 * @param cnum
	 * @return
	 */
	public static String getEmailByCnum(String cnum) {
		String email = "";
		BPResults results = BluePages.getPersonByCnum(cnum);
		@SuppressWarnings("unchecked")
		Vector<String> internet = results.getColumn("INTERNET");
		if ( internet != null && internet.size() > 0) {
			email = internet.get(0);
		}
		
		if (email == null || email.trim().length() == 0) {
			email = "";
		}
			
		return email.trim();
	}
	
	/**
	 * Get Note ID.
	 * @param intranetId
	 * @return
	 */
	@SuppressWarnings("unchecked")
	public static String getNoteID(String intranetId) {
		String name = "";
		BPResults results = BluePages.getPersonsByInternet(intranetId);
		Vector<String> nameCols = results.getColumn("NOTESID");

		if (nameCols == null || nameCols.size() == 0) {
			nameCols = (Vector<String>)results.getColumn("EMAILADDRESS");
		}
		
		if (nameCols != null && nameCols.size() > 0) {
			name = (String) nameCols.elementAt(0);
			if (name == null) {
				return "";
			}
			name = name.trim();
			name = name.replaceAll("CN=", "");
			name = name.replaceAll("/OU=", "/");
			name = name.replaceAll("/O=", "/");
			int s = name.lastIndexOf('@');
			if (s != -1) {
				name = name.substring(0, s);
			}
		}

		return name;
	}
	
}
