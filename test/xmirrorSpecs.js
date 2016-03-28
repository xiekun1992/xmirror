var xmirror=null;
describe('when set workplace, ',function(){
	"use strict";
	
	beforeAll(function(){
		xmirror=new Xmirror();
		jasmine.spyOn(xmirror,'setWorkplace');
	});
	it('setWorkplace method should be called with a string',function(){
		xmirror.setWorkplace('D:\\');
		expect(xmirror.setWorkplace).toHaveBeenCalledWith('D:\\');
	});
	it('the path should be set up if not existed',function(){
		xmirror.setWorkplace('D:\\xmirror_workspace');
	});
	afterAll(function(){
		xmirror=null;
	});
});