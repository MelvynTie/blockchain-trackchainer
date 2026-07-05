/*####################
# LEDGERIT
# AUTHOR:MELVYN TIE
###################*/


// Apply Internationalization Polyfill
if (!window.Intl) {
	require('intl');
}

// Integrate Digital Data Layer on the website
window.digitalData = {
	"page": {
		"category": {
		"primaryCategory": "Blockchain"
		},
	"pageInfo": {
      	"language": "en-US",
      	"publishDate": "2017-08-03",
      	"publisher": "LedgerIT Corporation",
      	"version": "v1",
      	"pageID": "None",
      	"ledgerit": {
        "contentDelivery": "HTML"
      }
    }
  }
};

// Change the url address regarding to the region
jQuery(() => {
  let regionSelector = jQuery('#region-selector');
  regionSelector.select2()
    .on('select2:select', () => {
      if(regionSelector.val()) {
        window.location.replace(window.location.pathname + '?applang=' + regionSelector.val());
      }
    });
});
