angular.module("yds").factory("Translations", [function () {
    var translations = {
        en: {
            saveResult: "Save",
            saveResultSet: "Save Results",
            saveDataset: "Save to basket",
            savedDataset: "Saved to basket",
            resultFound: "result found",
            resultsFound: "results found",
            noResultsFound: "No results found...",
            noResultsFoundDisclaimer: "Unfortunately we could not find results relative to your search query.",

            paginationFirstText: "First",
            paginationLastText: "Last",
            paginationNextText: "Next",
            paginationPreviousText: "Previous",

            viewResult: "View",
            showMore: "[Show More]",
            showLess: "[Show Less]",
            showMoreTxt: "Show More",
            showLessTxt: "Show Less",

            alternativeNamesTitle: "Alternative Names",
            noAlternativeNamesMsg: "No alternative names were found!",

            swapCountriesBtnLabel: "Swap Countries"
        },
        el: {
            saveResult: "Αποθήκευση",
            saveResultSet: "Αποθήκευση Αποτελεσμάτων",
            saveDataset: "Αποθήκευση",
            savedDataset: "Αποθήκευτηκε",
            resultFound: "αποτέλεσμα βρέθηκε",
            resultsFound: "αποτελέσματα βρέθηκαν",
            noResultsFound: "Δεν βρέθηκαν αποτελέσματα...",
            noResultsFoundDisclaimer: "Δυστυχώς δεν μπορέσαμε να βρούμε αποτελέσματα που να ικανοποιούν τα κριτήρια της αναζήτησής σας.",

            paginationFirstText: "Πρώτη",
            paginationLastText: "Τελευταία",
            paginationNextText: "Επόμενη",
            paginationPreviousText: "Προηγούμενη",

            viewResult: "Επισκόπηση",
            showMore: "[Περισσότερα]",
            showLess: "[Λιγότερα]",
            showMoreTxt: "Περισσότερα",
            showLessTxt: "Λιγότερα",

            alternativeNamesTitle: "Εναλλακτικά Ονόματα",
            noAlternativeNamesMsg: "Δεν βρέθηκε κανένα εναλλακτικό όνομα!",

            swapCountriesBtnLabel: "Εναλλαγή Χωρών"
        }
    };

    return {
        get: function (lang, attr) {
            return translations[lang][attr];
        },
        getAll: function (lang) {
            return translations[lang];
        }
    }
}]);
