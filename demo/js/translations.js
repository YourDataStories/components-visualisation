angular.module('yds').factory('Translations', [ function() {
	var translations = {
		en: {
			title: "Title",
			name: "Name",
			description: "Description",
			beneficiary: "Beneficiary",
			completion: "Completion",
			sector: "Sector",
			date: "Date",
			startDate: "Start Date",
			endDate: "End Date",
			hasRelatedBudgetItem: "Budget",
			spending: "Spending",
			relatedProjects: "Related Projects",
			projectId: "Project Id",
			issued: "Issued",
			subject: "Subject",
			ada: "ΑΔΑ",
			seller: "Seller",
			buyer: "Buyer",
			financialYear: "Financial Year",
			price: "Price",
			hasThematicCategory: "Category",
			hasBudgetCategory: "Budget Category",
			decisionType: "Type",
			decisionTypeId: "Type Id",
			documentType: "Document Type",
			documentUrl: "Document URL",
			status: "Status",
			protocolNumber: "Protocol Number",
			kind: "Kind",
			agreedPrice: "Agreed Price",
			estimatedPrice: "Estimated Price",
			VAT: "VAT (%)",
			CPV: "CPV",
			signer: "Signer",
			publisher: "Publisher",
			businessEntity: "Business Entity",
			amount: "Amount",

			resultFound: "result found",
			resultsFound: "results found",
			noResultsFound: "No results found...",
			noResultsFoundDisclaimer: "Unfortunately we could not find results relative to your search query. Why don't you search about 'Road'?;",

			viewResult: "View",
			showMore: "[Show More]",
			showLess: "[Show Less]",
			showMoreTxt: "Show More",
			showLessTxt: "Show Less"
		},
		el: {
			title: "Τίτλος",
			name: "Όνομα",
			description: "Περιγραφή",
			beneficiary: "Δικαιούχος",
			completion: "Ολοκλήρωση",
			sector: "Τομέας",
			date: "Ημερομηνία",
			startDate: "Ημερομηνία Έναρξης",
			endDate: "Ημερομηνία Λήξης",
			budget: "Προϋπολογισμός",
			spending: "Δαπάνες",
			relatedProjects: "Σχετικά Έργα",
			projectId: "Κωδικός Έργου",
			issued: "Εκδόθηκε",
			subject: "Θέμα",
			ada: "ΑΔΑ",
			seller: "Πωλητής",
			buyer: "Αγοραστής",
			financialYear: "Οικονομικό Έτος",
			price: "Τιμή",
			hasThematicCategory: "Κατηγορία",
			hasBudgetCategory: "Κατηγορία Προϋπολογισμού",
			decisionType: "Τύπος",
			decisionTypeId: "Κωδικός Τύπου",
			documentType: "Τύπος Εγγράφου",
			documentUrl: "URL Εγγράφου",
			status: "Κατάσταση",
			protocolNumber: "Αριθ. Πρωτοκόλλου",
			kind: "Kind",
			agreedPrice: "Agreed Price",
			estimatedPrice: "Estimated Price",
			VAT: "VAT (%)",
			CPV: "CPV",
			signer: "Signer",
			publisher: "Publisher",
			businessEntity: "Business Entity",
			amount: "Amount",

			resultFound: "αποτέλεσμα βρέθηκε",
			resultsFound: "αποτελέσματα βρέθηκαν",
			noResultsFound: "Δεν βρέθηκαν αποτελέσματα...",
			noResultsFoundDisclaimer: "Δυστυχώς δεν μπορέσαμε να βρούμε αποτελέσματα που να ικανοποιούν τα κριτήρια της αναζήτησής σας. Γιατί δεν κάνετε μια αναζήτηση με τον όρο 'Δρόμος';",

			viewResult: "Επισκόπηση",
			showMore: "[Περισσότερα]",
			showLess: "[Λιγότερα]",
			showMoreTxt: "Περισσότερα",
			showLessTxt: "Λιγότερα"
		}
	};

	return {
		get: function(lang, attr) {
			return translations[lang][attr];
		},
		getAll: function(lang) {
			return translations[lang];
		}
	}
}]);



