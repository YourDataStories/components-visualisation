angular.module('yds').directive('xdm', function(){
	return {
		restrict: 'A',
		link: function (scope, element, attrs) {
			angular.element(document).ready(function () {
				new easyXDM.Socket({
					remote: "http://ydsdev.iit.demokritos.gr/YDSComponents/#/embed/56702de89b45e742f7f5ed34",
					container: document.getElementById("xdm-container"),
					onMessage: function(message, origin){ debugger;
						this.container.getElementsByTagName("iframe")[0].style.height = message + "px";
					}
				});
			});
		}
	};
});