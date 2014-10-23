#zen_dashboard_enhancer

Greasemonkey script to enhance ZenPortal dashboard

##Install :
You can download the file and open-it on greasemonkey or copy-paste it on greasemonkey's new script interface

Firefox plugin :
https://addons.mozilla.org/fr/firefox/addon/greasemonkey/

Chrome plugin (not tested) :
http://www.chromeextensions.org/appearance-functioning/tampermonkey/

If you get some trouble with chrome (see @Allen1980s Post)
https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo/related?hl=de )

###Script install note :
1. Install Greasemonkey or tamperData addons.
1. use this url : https://raw.githubusercontent.com/Yoldark34/zen_dashboard_enhancer/master/js/zen_dashboard_enhancer_Yoldark.user.js (or go to my github project and click on zen_dashboard_enhancer_Yoldark.user.js from the js folder, choose RAW to get the install popup dialog).
1. A popup should appear which will ask you for the installation. (if not the plug in is badly installed).
1. And done. (if you got trouble on the website by now the problem comes from my script.
1. You may got a new config panel in the profil page, you should tick some useful features.
1. On chrome you may have to enable “TamperFire” in the “TamperMonkey” settings

###FEATURES :
+ Display coinbase btc rate used, maintenance fee and total amount (allowing copy/paste of the value)
+ Display chart to see income, debits and credits progress
+ Config panel to configure all the functionalities
+ Config checker to detect compatibility problems
+ ROI tracker

======================

##Changelog :
+ 1.0.0 : creation, add BTC valu1e in zencloud dashboard
+ 1.1.0 : Add informations message if user has no fund on his account.
+ 2.0.0 : change Jquery version, add highcharts, add financial chart, add date.js library
+ 2.1.0 : invert credit and debits on financial chart
+ 2.2.0 : don't display fund in financial chart
+ 2.3.0 : add outcome line in financial chart, change colors
+ 2.3.1 : remove a trailing comma :)
+ 2.3.2 : properly truncate outcome values
+ 2.3.3 : Change yAxis to "BTC" instead of "BTC Value"
+ 2.4.0 : Export to CSV.
+ 2.4.1 : Add Calculated rates fee
+ 2.4.2 : Dont display multiple financial highcharts
+ 2.4.3 : Better identification of which page is active, use function to clean code
+ 2.4.4 : Correct incompatibility with chrome ?
+ 2.4.5 : Add config panel
+ 2.5.0 : Add configuration panel for financial and shit mode, logs messages
+ 2.5.1 : Remove "Withdrawal" and "Sale" from the financial chart
+ 2.6.0 : Add configuration checker, modal dialogs, callbacks
+ 2.6.1 : Use only "Payout" and "Maintenance fee" for the graphe, change outcome by income
+ 2.6.2 : Test only for minor version, add Rerun test on config panel, reload after saving
+ 2.6.3 : Add Top bar configuration element in the dashboard
+ 2.6.4 : Total amount checkbox was named calculated fee
+ 2.6.5 : Correct days displayed in case of range cut
+ 2.6.6 : Fix for positive maintenance fee
+ 2.6.7 : Update link, chrome compatibility improvment.
+ 2.6.8 : Add user autorisation for doing test or not
+ 2.6.9 : host all the used libraries
+ 2.6.10 : add external css style, add clock
+ 2.6.11 : externalise highcharts libs because of encoding problems
+ 2.6.12 : externalize top dashboard correct BTC and $ value when over than $ 999.99 or BTC 999.99
+ 2.7.0 : add roi chart
+ 2.7.1 : improve modal dialog
+ 2.7.2 : correct withdrawals problem on roi chart
+ 2.7.3 : allow to set the number of displayed days on ROI chart
+ 2.7.4 : Add sold event in roi graph, correct double purchase and auto purchase count
+ 2.7.5 : Reset unused purchases stored in memory
+ 2.7.6 : Allow to revert debits in fiancial chart
+ 2.7.7 : Correct income when debits are reverted
+ 2.7.8 : Add account credit in roi fund calc