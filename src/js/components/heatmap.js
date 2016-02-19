angular.module('yds').directive('ydsHeatmap', ['Data', '$ocLazyLoad', function (Data, $ocLazyLoad) {
	return {
		restrict: 'E',
		scope: {
			projectId: '@',
			initArea: '@',       //enable or disable array sorting, values: true, false
			exporting: '@',
			elementH: '@'
		},
		templateUrl: 'templates/heatmap.html',
		link: function (scope, elem, attrs) {
			var mapLinks = {
				//Custom
				"Africa": "custom/africa.js",
				"Antarctica": "custom/antarctica.js",
				"Asia": "custom/asia.js",
				"Benelux": "custom/benelux.js",
				"British Isles": "custom/british-isles.js",
				"British Isles, admin1": "custom/british-isles-all.js",
				"Canada and United States of America": "custom/usa-and-canada.js",
				"Central America": "custom/central-america.js",
				"Europe": "custom/europe.js",
				"European Union": "custom/european-union.js",
				"Middle East": "custom/middle-east.js",
				"Nordic Countries without Greenland, Svalbard, and Jan Mayen": "custom/nordic-countries-core.js",
				"Nordic Countries": "custom/nordic-countries.js",
				"North America without central": "custom/north-america-no-central.js",
				"North America": "custom/north-america.js",
				"North Atlantic Treaty Organization": "custom/nato.js",
				"Oceania": "custom/oceania.js",
				"Scandinavia": "custom/scandinavia.js",
				"South America": "custom/south-america.js",
				"World continents": "custom/world-continents.js",
				"World with Palestine areas, high resolution": "custom/world-palestine-highres.js",
				"World with Palestine areas, low resolution": "custom/world-palestine-lowres.js",
				"World with Palestine areas, medium resolution": "custom/world-palestine.js",
				"World, Eckert III projection, high resolution": "custom/world-eckert3-highres.js",
				"World, Eckert III projection, low resolution": "custom/world-eckert3-lowres.js",
				"World, Eckert III projection, medium resolution": "custom/world-eckert3.js",
				"World, Miller projection, high resolution": "custom/world-highres.js",
				"World, Miller projection, low resolution": "custom/world-lowres.js",
				"World, Miller projection, medium resolution": "custom/world.js",
				"World, Miller projection, ultra high resolution": "custom/world-highres3.js",
				"World, Miller projection, very high resolution": "custom/world-highres2.js",
				"World, Robinson projection, high resolution": "custom/world-robinson-highres.js",
				"World, Robinson projection, low resolution": "custom/world-robinson-lowres.js",
				"World, Robinson projection, medium resolution": "custom/world-robinson.js",

				//Countries
				"Afghanistan": "countries/af/af-all.js",
				"Albania": "countries/al/al-all.js",
				"Algeria": "countries/dz/dz-all.js",
				"American Samoa": "countries/as/as-all.js",
				"Andorra": "countries/ad/ad-all.js",
				"Angola": "countries/ao/ao-all.js",
				"Antigua and Barbuda": "countries/ag/ag-all.js",
				"Argentina": "countries/ar/ar-all.js",
				"Armenia": "countries/am/am-all.js",
				"Australia": "countries/au/au-all.js",
				"Austria": "countries/at/at-all.js",
				"Azerbaijan": "countries/az/az-all.js",
				"Bahrain": "countries/bh/bh-all.js",
				"Bangladesh": "countries/bd/bd-all.js",
				"Barbados": "countries/bb/bb-all.js",
				"Belarus": "countries/by/by-all.js",
				"Belgium": "countries/be/be-all.js",
				"Belize": "countries/bz/bz-all.js",
				"Benin": "countries/bj/bj-all.js",
				"Bhutan": "countries/bt/bt-all.js",
				"Bolivia": "countries/bo/bo-all.js",
				"Bosnia and Herzegovina": "countries/ba/ba-all.js",
				"Botswana": "countries/bw/bw-all.js",
				"Brazil": "countries/br/br-all.js",
				"Brunei": "countries/bn/bn-all.js",
				"Bulgaria": "countries/bg/bg-all.js",
				"Burkina Faso": "countries/bf/bf-all.js",
				"Burundi": "countries/bi/bi-all.js",
				"Cambodia": "countries/kh/kh-all.js",
				"Cameroon": "countries/cm/cm-all.js",
				"Canada": "countries/ca/ca-all.js",
				"Canada, admin2": "countries/ca/ca-all-all.js",
				"Cape Verde": "countries/cv/cv-all.js",
				"Central African Republic": "countries/cf/cf-all.js",
				"Chad": "countries/td/td-all.js",
				"Chile": "countries/cl/cl-all.js",
				"China with Hong Kong and Macau": "countries/cn/custom/cn-all-sar.js",
				"China with Hong Kong, Macau, and Taiwan": "countries/cn/custom/cn-all-sar-taiwan.js",
				"China": "countries/cn/cn-all.js",
				"Colombia": "countries/co/co-all.js",
				"Comoros": "countries/km/km-all.js",
				"Cook Islands": "countries/ck/ck-all.js",
				"Costa Rica": "countries/cr/cr-all.js",
				"Croatia": "countries/hr/hr-all.js",
				"Cuba": "countries/cu/cu-all.js",
				"Cyprus": "countries/cy/cy-all.js",
				"Czech Republic": "countries/cz/cz-all.js",
				"Democratic Republic of the Congo": "countries/cd/cd-all.js",
				"Denmark": "countries/dk/dk-all.js",
				"Djibouti": "countries/dj/dj-all.js",
				"Dominica": "countries/dm/dm-all.js",
				"Dominican Republic": "countries/do/do-all.js",
				"East Timor": "countries/tl/tl-all.js",
				"Ecuador": "countries/ec/ec-all.js",
				"Egypt": "countries/eg/eg-all.js",
				"El Salvador": "countries/sv/sv-all.js",
				"Equatorial Guinea": "countries/gq/gq-all.js",
				"Eritrea": "countries/er/er-all.js",
				"Estonia": "countries/ee/ee-all.js",
				"Ethiopia": "countries/et/et-all.js",
				"Faroe Islands": "countries/fo/fo-all.js",
				"Fiji": "countries/fj/fj-all.js",
				"Finland": "countries/fi/fi-all.js",
				"France": "countries/fr/fr-all.js",
				"France, admin2": "countries/fr/fr-all-all.js",
				"France, mainland admin2": "countries/fr/custom/fr-all-all-mainland.js",
				"France, mainland": "countries/fr/custom/fr-all-mainland.js",
				"French Southern and Antarctic Lands": "countries/tf/tf-all.js",
				"Gabon": "countries/ga/ga-all.js",
				"Gambia": "countries/gm/gm-all.js",
				"Georgia": "countries/ge/ge-all.js",
				"Germany": "countries/de/de-all.js",
				"Germany, admin2": "countries/de/de-all-all.js",
				"Ghana": "countries/gh/gh-all.js",
				"Greece": "countries/gr/gr-all.js",
				"Greenland": "countries/gl/gl-all.js",
				"Grenada": "countries/gd/gd-all.js",
				"Guam": "countries/gu/gu-all.js",
				"Guatemala": "countries/gt/gt-all.js",
				"Guinea Bissau": "countries/gw/gw-all.js",
				"Guinea": "countries/gn/gn-all.js",
				"Guyana": "countries/gy/gy-all.js",
				"Haiti": "countries/ht/ht-all.js",
				"Honduras": "countries/hn/hn-all.js",
				"Hungary": "countries/hu/hu-all.js",
				"Iceland": "countries/is/is-all.js",
				"India with Andaman and Nicobar": "countries/in/custom/in-all-andaman-and-nicobar.js",
				"India with disputed territories": "countries/in/custom/in-all-disputed.js",
				"India": "countries/in/in-all.js",
				"Indonesia": "countries/id/id-all.js",
				"Iran": "countries/ir/ir-all.js",
				"Iraq": "countries/iq/iq-all.js",
				"Ireland": "countries/ie/ie-all.js",
				"Israel": "countries/il/il-all.js",
				"Italy": "countries/it/it-all.js",
				"Ivory Coast": "countries/ci/ci-all.js",
				"Jamaica": "countries/jm/jm-all.js",
				"Japan": "countries/jp/jp-all.js",
				"Jordan": "countries/jo/jo-all.js",
				"Kazakhstan": "countries/kz/kz-all.js",
				"Kenya": "countries/ke/ke-all.js",
				"Kosovo": "countries/kv/kv-all.js",
				"Kuwait": "countries/kw/kw-all.js",
				"Kyrgyzstan": "countries/kg/kg-all.js",
				"Laos": "countries/la/la-all.js",
				"Latvia": "countries/lv/lv-all.js",
				"Lebanon": "countries/lb/lb-all.js",
				"Lesotho": "countries/ls/ls-all.js",
				"Liberia": "countries/lr/lr-all.js",
				"Libya": "countries/ly/ly-all.js",
				"Liechtenstein": "countries/li/li-all.js",
				"Lithuania": "countries/lt/lt-all.js",
				"Luxembourg": "countries/lu/lu-all.js",
				"Macedonia": "countries/mk/mk-all.js",
				"Madagascar": "countries/mg/mg-all.js",
				"Malawi": "countries/mw/mw-all.js",
				"Malaysia": "countries/my/my-all.js",
				"Mali": "countries/ml/ml-all.js",
				"Malta": "countries/mt/mt-all.js",
				"Mauritania": "countries/mr/mr-all.js",
				"Mauritius": "countries/mu/mu-all.js",
				"Mexico": "countries/mx/mx-all.js",
				"Moldova": "countries/md/md-all.js",
				"Monaco": "countries/mc/mc-all.js",
				"Mongolia": "countries/mn/mn-all.js",
				"Montenegro": "countries/me/me-all.js",
				"Morocco": "countries/ma/ma-all.js",
				"Mozambique": "countries/mz/mz-all.js",
				"Myanmar": "countries/mm/mm-all.js",
				"Namibia": "countries/na/na-all.js",
				"Nauru": "countries/nr/nr-all.js",
				"Nepal": "countries/np/np-all.js",
				"New Caledonia": "countries/nc/nc-all.js",
				"New Zealand": "countries/nz/nz-all.js",
				"Nicaragua": "countries/ni/ni-all.js",
				"Niger": "countries/ne/ne-all.js",
				"Nigeria": "countries/ng/ng-all.js",
				"North Korea": "countries/kp/kp-all.js",
				"Northern Mariana Islands": "countries/mp/mp-all.js",
				"Norway with Svalbard and Jan Mayen": "countries/no/custom/no-all-svalbard-and-jan-mayen.js",
				"Norway": "countries/no/no-all.js",
				"Norway, admin2": "countries/no/no-all-all.js",
				"Paraguay": "countries/py/py-all.js",
				"Peru": "countries/pe/pe-all.js",
				"Philippines": "countries/ph/ph-all.js",
				"Poland": "countries/pl/pl-all.js",
				"Portugal": "countries/pt/pt-all.js",
				"Puerto Rico": "countries/pr/pr-all.js",
				"Qatar": "countries/qa/qa-all.js",
				"Republic of Serbia": "countries/rs/rs-all.js",
				"Republic of the Congo": "countries/cg/cg-all.js",
				"Romania": "countries/ro/ro-all.js",
				"Russia with disputed territories": "countries/ru/custom/ru-all-disputed.js",
				"Russia": "countries/ru/ru-all.js",
				"Rwanda": "countries/rw/rw-all.js",
				"Saint Kitts and Nevis": "countries/kn/kn-all.js",
				"Saint Lucia": "countries/lc/lc-all.js",
				"Saint Vincent and the Grenadines": "countries/vc/vc-all.js",
				"Samoa": "countries/ws/ws-all.js",
				"San Marino": "countries/sm/sm-all.js",
				"Sao Tome and Principe": "countries/st/st-all.js",
				"Saudi Arabia": "countries/sa/sa-all.js",
				"Senegal": "countries/sn/sn-all.js",
				"Seychelles": "countries/sc/sc-all.js",
				"Sierra Leone": "countries/sl/sl-all.js",
				"Singapore": "countries/sg/sg-all.js",
				"Slovakia": "countries/sk/sk-all.js",
				"Slovenia": "countries/si/si-all.js",
				"Solomon Islands": "countries/sb/sb-all.js",
				"Somalia": "countries/so/so-all.js",
				"Somaliland": "countries/sx/sx-all.js",
				"South Africa": "countries/za/za-all.js",
				"South Korea": "countries/kr/kr-all.js",
				"South Sudan": "countries/ss/ss-all.js",
				"Spain": "countries/es/es-all.js",
				"Sri Lanka": "countries/lk/lk-all.js",
				"Sudan": "countries/sd/sd-all.js",
				"Suriname": "countries/sr/sr-all.js",
				"Swaziland": "countries/sz/sz-all.js",
				"Sweden": "countries/se/se-all.js",
				"Switzerland": "countries/ch/ch-all.js",
				"Syria": "countries/sy/sy-all.js",
				"Taiwan": "countries/tw/tw-all.js",
				"Tajikistan": "countries/tj/tj-all.js",
				"Thailand": "countries/th/th-all.js",
				"The Bahamas": "countries/bs/bs-all.js",
				"The Netherlands": "countries/nl/nl-all.js",
				"The Netherlands, admin2": "countries/nl/nl-all-all.js",
				"Togo": "countries/tg/tg-all.js",
				"Trinidad and Tobago": "countries/tt/tt-all.js",
				"Tunisia": "countries/tn/tn-all.js",
				"Turkey": "countries/tr/tr-all.js",
				"Turkmenistan": "countries/tm/tm-all.js",
				"Uganda": "countries/ug/ug-all.js",
				"Ukraine": "countries/ua/ua-all.js",
				"United Arab Emirates": "countries/ae/ae-all.js",
				"United Kingdom countries": "countries/gb/custom/gb-countries.js",
				"United Kingdom": "countries/gb/gb-all.js",
				"United Republic of Tanzania": "countries/tz/tz-all.js",
				"United States Virgin Islands": "countries/vi/vi-all.js",
				"United States of America with Territories": "countries/us/custom/us-all-territories.js",
				"United States of America": "countries/us/us-all.js",
				"United States of America, admin2": "countries/us/us-all-all.js",
				"United States of America, admin2, highres": "countries/us/us-all-all-highres.js",
				"United States of America, congressional districts (113th)": "countries/us/custom/us-113-congress.js",
				"United States of America, mainland": "countries/us/custom/us-all-mainland.js",
				"United States of America, small": "countries/us/custom/us-small.js",
				"Uruguay": "countries/uy/uy-all.js",
				"Uzbekistan": "countries/uz/uz-all.js",
				"Vanuatu": "countries/vu/vu-all.js",
				"Venezuela": "countries/ve/ve-all.js",
				"Vietnam": "countries/vn/vn-all.js",
				"Wallis and Futuna": "countries/wf/wf-all.js",
				"Western Sahara": "countries/eh/eh-all.js",
				"Yemen": "countries/ye/ye-all.js",
				"Zambia": "countries/zm/zm-all.js",
				"Zimbabwe": "countries/zw/zw-all.js"
			};


			var heatmapBackButton = elem[0].querySelector('.heatmap-back');
			var baseMapPath = "https://code.highcharts.com/mapdata/";
			var mapName = scope.initArea;		//scope var, check if null to add the default option
			var heatmapContainer = angular.element(elem[0].querySelector('.heatmap-container'));
			var elementH = scope.elementH;
			var exporting = scope.exporting;

			//create a random id for the element that will render the chart
			var elementId = "heatmap" + Data.createRandomId();
			heatmapContainer[0].id = elementId;

			if(angular.isUndefined(scope.initArea) || mapLinks[scope.initArea]===undefined || scope.initArea==="") {
				mapName = "World, Miller projection, medium resolution";
				console.log("The init area you selected doesn't exist. Look on the components documentation for more information.")
			}

			//check if the exporting attr is defined, else assign default value
			if(angular.isUndefined(exporting) || (exporting!="true" && exporting!="false"))
				exporting = "true";

			//check if the component's height attr is defined, else assign default value
			if(angular.isUndefined(elementH) || isNaN(elementH))
				elementH = 500;

			//set the height of the chart
			heatmapContainer[0].style.height = elementH + 'px';

			var showDataLabels = false;
			var mapIdentifier = _.propertyOf(mapLinks)(mapName);	// js file with the preferred map data fetched dynamically
			var prevMapKey = mapKey = mapIdentifier.split(".")[0];					// extract the key of the map from the file name
			var mapGeoJSON = Highcharts.maps[mapKey];
			var data = [];
			var heatmapTitle=mapName;

			var updateHeatmap = function (mapKey) {
				this.mapKey = mapKey;		//assign the new value to the global mapKey variable
				heatmapTitle=(_.invert(mapLinks))[mapIdentifier];

				//show button if user navigate to a specific country
				if(mapName !== heatmapTitle && heatmapBackButton.style.display === 'none')
					heatmapBackButton.style.display = 'block';

				//hide button if a user navigate to the area that the map was initialised
				if(mapName === heatmapTitle && heatmapBackButton.style.display !== 'none')
					heatmapBackButton.style.display = 'none';

				if (Highcharts.maps[mapKey]) {
					mapGeoJSON = Highcharts.maps[mapKey];
					visualiseHeatmap();
				} else {
					var javascriptPath = baseMapPath + mapIdentifier;		// full link to the js file
					$ocLazyLoad.load(javascriptPath)
					.then(function () {
						mapGeoJSON = Highcharts.maps[mapKey];
						visualiseHeatmap();
					}, function (err) {
						console.log("an error occured", err);
					});
				}
			};


			var visualiseHeatmap = function() {
				angular.forEach(mapGeoJSON.features, function (feature, index) {
					data.push({
						key: feature.properties['hc-key'],
						value: index
					});
				});

				var heatmapOptions = {
					title: { text: heatmapTitle },
					mapNavigation: {
						enabled: true,
						buttons: {
							zoomIn: {
								y: 40
							},
							zoomOut: {
								y: 68
							}
						}
					},
					chart: {
						renderTo: elementId
					},
					exporting: {
						enabled: (exporting === "true")
					},
					colorAxis: {
						min: 0,
						stops: [
							[0, '#EFEFFF'],
							[0.5, Highcharts.getOptions().colors[0]],
							[1, Highcharts.Color(Highcharts.getOptions().colors[0]).brighten(-0.5).get()]
						]
					},

					legend: {
						layout: 'vertical',
						align: 'left',
						verticalAlign: 'bottom'
					},

					series: [{
						data: data,
						mapData: mapGeoJSON,
						joinBy: ['hc-key', 'key'],
						name: 'Random data',
						states: {
							hover: {
								color: Highcharts.getOptions().colors[2]
							}
						},
						dataLabels: {
							enabled: showDataLabels,
							formatter: function () {
								return mapKey === 'custom/world' || mapKey === 'countries/us/us-all' ?
										(this.point.properties && this.point.properties['hc-a2']) :
										this.point.name;
							}
						},
						point: {
							events: {
								click: function () { 	// On click, look for a detailed map
									var key = this.key;

									//prevent user to navigate to the inner state of a specific country area
									if (mapIdentifier.indexOf("-all.js") > -1)
										return false;

									prevMapKey = mapKey;
									var newKey = 'countries/' + key.substr(0, 2) + '/' + key + '-all';
									mapIdentifier = newKey + '.js';

									updateHeatmap(newKey);
								}
							}
						}
					}, {
						type: 'mapline',
						name: "Separators",
						data: Highcharts.geojson(mapGeoJSON, 'mapline'),
						nullColor: 'gray',
						showInLegend: false,
						enableMouseTracking: false
					}]
				};

				var chart = new Highcharts.Map(heatmapOptions);
			};

			scope.goBack = function() {
				if(prevMapKey!==undefined && prevMapKey!==""){
					mapIdentifier = prevMapKey + '.js';
					updateHeatmap(prevMapKey);
				} else
					console.error("prevMapKey is undefined");
			};

			updateHeatmap(mapKey); //initialize the map for the first time
		}
	}
}]);