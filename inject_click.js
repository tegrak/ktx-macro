console.log('inject_click.js');

var obj = document.getElementById('ktx-macro-click');
//if (obj.href.includes('inqSchedule'))
//	obj.click();
if (obj) {
	obj.click();
	obj.removeAttribute('id');
}