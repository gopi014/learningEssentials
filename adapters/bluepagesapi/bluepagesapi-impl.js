
var givenname='';
function ismanager(email) {

	var path = "/BpHttpApisv3/slaphapi?ibmperson/mail="+email+".list,printable/byjson?ismanager&manager&givenname&notesemail";
	var input = {
	    method : 'get',
	    returnedContentType : 'JSON',
	    path : path
	};


	return WL.Server.invokeHttp(input);
}

function getmanager(email){
	var managerapi=ismanager(email);
	var result='';
	var value='';
	if(managerapi.isSuccessful){

		result=managerapi.search.entry[0].attribute;
		for(var i=0;i<result.length;i++){
			if(result[i].name=='ismanager'){
				value=result[i].value[0];

			}
			else if(result[i].name=='manager'){
				var manageru=result[i].value[0].toString();
				var managerud=manageru.split(',');
				var managerid=managerud[0].split('=');
				manageruid=managerid[1];
			}
			else if(result[i].name=='givenname'){
				givenname=result[i].value[1];
			}
		}
		if(value=="Y"){
			
			var finalval={
					ismanager:"Y",
					managerapi:managerapi,
					givenname:givenname
			};
			return finalval;
		}
		else{
			
			var managerapi=getmanagerdetails(manageruid);
			
			
			var finalval={
					
					managerapi:managerapi,
					ismanager:"N",
					givenname:givenname
			};
			return finalval;

			
		}

	}

} 
function getmanagerdetails(uid){
	var path = "/BpHttpApisv3/slaphapi?ibmperson/uid="+uid+".list,printable/byjson?ismanager&manager&givenname&notesemail";
	var input = {
	    method : 'get',
	    returnedContentType : 'JSON',
	    path : path
	};
	return WL.Server.invokeHttp(input);
}