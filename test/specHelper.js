var fs=require('fs');

beforeEach(function(){
	jasmine.addMatcher({
		toBeExistedPath:function(path,expected){
			var result={};
			try{
				fs.accessSync(path,fs.R_OK|fs.W_OK);
			}catch(e){
				result.pass=false;
				return result;
			}
			result.pass=true;
			return result;
		}
	});
});