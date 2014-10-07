﻿// ==UserScript==
// @author      Yoldark
// @name        zen dashboard enhancer
// @namespace   zenminer
// @include     https://cloud.zenminer.com/*
// @version     2.6.10
// @updateUrl   https://rawgit.com/Yoldark34/zen_dashboard_enhancer/raw/master/js/zen_dashboard_enhancer_Yoldark.user.js
// @grant       GM_log
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_listValues
// @grant       GM_getResourceText
// @grant       GM_addStyle
// @require     https://rawgit.com/Yoldark34/zen_dashboard_enhancer/raw/master/js/libraries/jquery-1.11.1.min.js
// @require     https://rawgit.com/Yoldark34//zen_dashboard_enhancer/raw/master/js/libraries/highcharts.js
// @require     https://rawgit.com/Yoldark34/Yoldark34/zen_dashboard_enhancer/raw/master/js/libraries/exporting.js
// @require     https://rawgit.com/Yoldark34/zen_dashboard_enhancer/raw/master/js/libraries/export-csv.js
// @require     https://raw.githubusercontent.com/Yoldark34/zen_dashboard_enhancer/raw/master/js/libraries/date.js
// @require     https://raw.githubusercontent.com/mcmastermind/jClocksGMT/master/js/jquery.rotate.js
// @require     https://raw.githubusercontent.com/mcmastermind/jClocksGMT/master/js/jClocksGMT.js
// @resource    zenDashboardCss https://raw.githubusercontent.com/Yoldark34/zen_dashboard_enhancer/raw/master/css/zen_dashboard_enhancer_Yoldark.css
// ==/UserScript==
// changelog
// 1.0.0 : creation, add BTC value in zencloud dashboard
// 1.1.0 : Add informations message if user has no fund on his account.
// 2.0.0 : change Jquery version, add highcharts, add financial chart, add date.js library
// 2.1.0 : invert credit and debits on financial chart
// 2.2.0 : don't display fund in financial chart
// 2.3.0 : add outcome line in financial chart, change colors
// 2.3.1 : remove a trailing comma :)
// 2.3.2 : properly truncate outcome values
// 2.3.3 : Change yAxis to "BTC" instead of "BTC Value"
// 2.4.0 : Export to CSV.
// 2.4.1 : Add Calculated rates fee
// 2.4.2 : Dont display multiple financial highcharts
// 2.4.3 : Better identification of which page is active, use function to clean code
// 2.4.4 : Correct incompatibility with chrome ?
// 2.4.5 : Add config panel
// 2.5.0 : Add configuration panel for financial and shit mode, logs messages
// 2.5.1 : Remove "Withdrawal" and "Sale" from the financial chart
// 2.6.0 : Add configuration checker, modal dialogs, callbacks
// 2.6.1 : Use only "Payout" and "Maintenance fee" for the graphe, change outcome by income
// 2.6.2 : Test only for minor version, add Rerun test on config panel, reload after saving
// 2.6.3 : Add Top bar configuration element in the dashboard
// 2.6.4 : Total amount checkbox was named calculated fee
// 2.6.5 : Correct days displayed in case of range cut
// 2.6.6 : Fix for positive maintenance fee
// 2.6.7 : Update link, chrome compatibility improvment.
// 2.6.8 : Add user autorisation for doing test or not
// 2.6.9 : host all the used libraries
// 2.6.10 : add external css style, add clock
var VERSION = '2.6.10';
var cutVersion = VERSION.split('.');
var SHORT_VERSION = cutVersion[0] + "." + cutVersion[1];
var FINANCIAL_DISPLAYED_DAYS_QUANTITY = 50;
var CLOCK_DIFF = '-5';
var GENESIS_FEE_RATE = 0.01;
var SCRIPT_FEE_RATE = 0.08;
var MESSAGE_TYPE_SUCCESS = 'success';
var MESSAGE_TYPE_ERROR = 'error';
var MESSAGE_TYPE_WARNING = 'error';
var AJAX_RETRIEVE_FINANCIAL_DATA = 'https://cloud.zenminer.com/api/dt/financials';

var zenDashboardCss = GM_getResourceText ("zenDashboardCss");
GM_addStyle (zenDashboardCss);

//activate financial by default
if (GM_getValue('ACTIVATE_FINANCIAL', null) === null) {
    GM_setValue('ACTIVATE_FINANCIAL', true);
}

if (GM_getValue('FINANCIAL_DISPLAYED_DAYS_QUANTITY', null) === null) {
    GM_setValue('FINANCIAL_DISPLAYED_DAYS_QUANTITY', FINANCIAL_DISPLAYED_DAYS_QUANTITY);
}

if (GM_getValue('SHIT_MODE', null) === null) {
    GM_setValue('SHIT_MODE', false);
}
GM_setValue('SHIT_MODE_ENABLED', false);

if (GM_getValue('CONFIG_CHECKER', null) === null) {
    GM_setValue('CONFIG_CHECKER', false);
}
if (GM_getValue('CLOCK_DIFF', null) === null) {
    GM_setValue('CLOCK_DIFF', CLOCK_DIFF);
}
this.$ = this.jQuery = jQuery.noConflict(true);
var financialTrackingChart;

function requestFinancialData(callback) {
    $.ajax({
        url: AJAX_RETRIEVE_FINANCIAL_DATA,
        data: {
            iDisplayLength: 0
        },
        beforeSend: function() {
            addConfigurationElement('Populate financial chart', 'financial-chart-population');
        },
        success: function (response) {
            var aaData = response.aaData;
            var dayIndex = 0;
            var debitIndex = 3;
            var creditIndex = 2;
            var aData = null;
            var debits = [];
            var credits = [];
            var income = [];
            var debitsGrouped = [];
            var creditsGrouped = [];
            var days = [];
            var currentDate = null;
            var daysRange = 0;
            var debitAmount;
            var creditAmount;
            var currentIncome;
            var dayStart = 0;
            var i;

            //Remove the previous series
            for (i = financialTrackingChart.series.length; i > 0; i--) {
                financialTrackingChart.series[(i - 1)].remove();
            }
            // avoid series changing color
            financialTrackingChart.colorCounter = 0;

            //Initialize dates to groups debits and credits by days
            for (i = 0; i < aaData.length; i++) {
                daysRange++;
                aData = aaData[i];
                //Parse to yyyy/MM/dd to properly sort
                currentDate = Date.parse(aData[dayIndex]).toString('yyyy/MM/dd');
                if ($.inArray(currentDate, days) === -1) {
                    days.push(currentDate);
                }
                debitsGrouped[currentDate] = 0;
                creditsGrouped[currentDate] = 0;
            }

            //Sort all the days
            days.sort();

            //Fill the debits and credits grouped by days
            for (i = 0; i < aaData.length; i++) {
                aData = aaData[i];
                currentDate = Date.parse(aData[dayIndex]).toString('yyyy/MM/dd');
                type = aData[1].split('>') [1].split('<') [0];
                if (type === 'Payout' || type === 'Maintenance Fee') {
                    if (aData[debitIndex].length) {
                        debitAmount = aData[debitIndex]
                            .split('>') [1]
                            .split('<') [0]
                            .split(' ') [0];
                        debitsGrouped[currentDate] -= parseFloat(debitAmount);
                    } else if (aData[creditIndex].length) {
                        creditAmount = aData[creditIndex]
                            .split('>') [1]
                            .split('<') [0]
                            .split(' ') [0];
                        creditsGrouped[currentDate] += parseFloat(creditAmount);
                    }
                }
            }

            if (days.length > GM_getValue('FINANCIAL_DISPLAYED_DAYS_QUANTITY')) {
                dayStart = days.length - GM_getValue('FINANCIAL_DISPLAYED_DAYS_QUANTITY');
            }

            //Display only the last xxx days
            for (i = dayStart; i < days.length; i++) {
                //Need to convert big float value due to error calculation into correct
                //8 digit length after comma value.
                debits.push(parseFloat(-debitsGrouped[days[i]].toFixed(8)));
                credits.push(parseFloat(creditsGrouped[days[i]].toFixed(8)));
                currentIncome = creditsGrouped[days[i]] - debitsGrouped[days[i]];
                income.push(parseFloat(currentIncome.toFixed(8)));
            }

            //Remove unused days
            days.splice(0, dayStart);

            //Add the series to the chart
            financialTrackingChart.colorCounter = 10;
            financialTrackingChart.addSeries({
                data: income,
                name: 'Income'
            });
            financialTrackingChart.colorCounter = 5;
            financialTrackingChart.addSeries({
                data: debits,
                name: 'Debits'
            });
            financialTrackingChart.colorCounter = 2;
            financialTrackingChart.addSeries({
                data: credits,
                name: 'Credits'
            });

            //Update the xAxis according to the days
            financialTrackingChart.xAxis[0].setCategories(days);
            validateConfigurationElement('financial-chart-population');
            if (callback) {
                callback();
            }
        }
    });
}
function displayTopDashboard(container) {
    addConfigurationElement('Display top dashboard data', 'top-dashboard-data');
    var bitcoin = parseFloat($('.balance-value').html());
    var dollars = parseFloat($('.balanceUSD-value').html().split('<') [0]);

    if (bitcoin === 0.0) {
        $(container)
            .prepend($('<li>')
            .append($('<a>')
            .append('You need to have some fund to get the BTC rate calculation.')));
    } else {
        var btcValue = (dollars / bitcoin).toString();
        btcValue = btcValue.substring(0, 6);
        var scriptFee = SCRIPT_FEE_RATE / btcValue;
        var genesysFee = GENESIS_FEE_RATE / btcValue;
        if (GM_getValue('ENABLE_TOP_BTC_RATE')) {
            $(container)
                .prepend($('<li>')
                .append($('<a>')
                .append('Coinbase Btc Rate Used : ' + btcValue + ' $')));
        }
        if (GM_getValue('ENABLE_TOP_TOTAL_AMOUNT')) {
            $(container)
                .prepend($('<li>')
                .append($('<a>')
                .append('TOTAL : ' + $('.balance-value').html() + ' BTC')));
        }
        if (GM_getValue('ENABLE_TOP_FEE')) {
            $(container)
                .prepend($('<li>')
                .append($('<a>')
                .append('0.01$ => ' + parseFloat(genesysFee.toFixed(8)) + ' BTC')));
            $(container)
                .prepend($('<li>')
                .append($('<a>')
                .append('Calculated Fees : 0.08$ => ' +
                    parseFloat(scriptFee.toFixed(8)) + ' BTC')));
        }
        if (GM_getValue('ACTIVATE_CLOCK')) {
            $('.navbar-bottom-row')
                .prepend('<li><div id="clock_dc" class="clock_container">' +
                '<div class="lbl">Server time</div>' +
                    '<div class="digital">' +
                        '<span class="hr"></span><span class="minute"></span> <span class="period"></span>' +
                    '</div>' +
                '</div></li>'
                );
            $("#clock_dc").jClocksGMT({offset: GM_getValue('CLOCK_DIFF'), analog: false, digital: true, hour24: false});
        }
    }
    validateConfigurationElement('top-dashboard-data');
}

function initializeFinancialChart(container, callback) {
    addConfigurationElement('Create financial chart', 'financial-chart-creation');
    if ($(container).length) {
        $(container).prepend('<div id="financialTrackingContainer" style="min-width: 310px; height: 400px; margin: 0 auto"></div>');
        financialTrackingChart = new Highcharts.Chart({
            chart: {
                renderTo: 'financialTrackingContainer',
                defaultSeriesType: 'spline',
                events: {
                    load: requestFinancialData(callback)
                }
            },
            title: {
                text: 'Payouts tracking',
                x: -20 //center
            },
            xAxis: {
                title: {
                    text: ' Day'
                },
                type: 'category',
                labels: {
                    rotation: -75
                }
            },
            yAxis: {
                title: {
                    text: 'BTC'
                }
            },
            tooltip: {
                valueSuffix: ' BTC'
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle',
                borderWidth: 0
            },
            exporting: {
                csv: {
                    dateFormat: '%Y-%m-%d'
                }
            }
        });
        validateConfigurationElement('financial-chart-creation');
    }
}

function checkShitMode(callback) {
    if (GM_getValue('SHIT_MODE')) {
        addConfigurationElement('Shit mode activation', 'cheat-mode-activation');
    } else {
        addConfigurationElement('Shit mode deactivation', 'cheat-mode-deactivation');
    }
    if (GM_getValue('SHIT_MODE') && !GM_getValue('SHIT_MODE_ENABLED')) {
        GM_setValue('SHIT_MODE_ENABLED', true);
        $('i').not(".br-shit")
            .hide()
            .after($('<i>', {class : 'br-shit'}));
    } else {
        GM_setValue('SHIT_MODE_ENABLED', false);
        $('.br-shit').remove();
        $('i').show();
    }
    if (GM_getValue('SHIT_MODE')) {
        validateConfigurationElement('cheat-mode-activation');
    } else {
        validateConfigurationElement('cheat-mode-deactivation');
    }

    if (callback) {
        callback();
    }
}

function enableLogMessage() {
    if ($('#alertify-logs-yoldark').length === 0) {
        $('body').append($('<section>',{
            id: 'alertify-logs-yoldark',
            class: 'alertify-logs alertify-logs-hidden'}));
    }
}

function displayLogMessage(message, type) {
    if (type === MESSAGE_TYPE_SUCCESS) {
        addConfigurationElement('Test success message logger', 'logger-success');
    } else if (type === MESSAGE_TYPE_ERROR) {
        addConfigurationElement('Test error message logger', 'logger-error');
    }
    enableLogMessage();
    var classContent;
    switch (type) {
        case MESSAGE_TYPE_SUCCESS :
            classContent = 'alertify-log-success';
            break;
        case MESSAGE_TYPE_ERROR :
            classContent = 'alertify-log-error';
            break;
        default :
            classContent = "";
            break;
    }
    $('#alertify-logs-yoldark').removeClass('alertify-logs-hidden');
    $('#alertify-logs-yoldark').addClass('alertify-log-show');
    $('#alertify-logs-yoldark').append($('<article>',
        {
            class : 'alertify-log alertify-log-show ' + classContent
        })
        .append(message));

    $('article',  $('#alertify-logs-yoldark')).fadeOut( 4000, function() {
        $(this).remove();
        if ($('article',  $('#alertify-logs-yoldark')).length === 0) {
            $('#alertify-logs-yoldark').addClass('alertify-logs-hidden').removeClass('alertify-log-show').empty();
        }
    });

    if (type === MESSAGE_TYPE_SUCCESS) {
        validateConfigurationElement('logger-success');
    } else if (type === MESSAGE_TYPE_ERROR) {
        validateConfigurationElement('logger-error');
    }
}

function initializeConfigPanel(container) {
    addConfigurationElement('Add config panel', 'config-panel');
    var activateFinancial = '';

    if (GM_getValue('ACTIVATE_FINANCIAL')) {
        activateFinancial = 'checked="checked"';
    }
    var activateShitMode = '';
    if (GM_getValue('SHIT_MODE')) {
        activateShitMode = 'checked="checked"';
    }
    var activateCalculatedFee = '';
    if (GM_getValue('ENABLE_TOP_FEE')) {
        activateCalculatedFee = 'checked="checked"';
    }
    var activateTotalAmount = '';
    if (GM_getValue('ENABLE_TOP_TOTAL_AMOUNT')) {
        activateTotalAmount = 'checked="checked"';
    }
    var activateBtcRate = '';
    if (GM_getValue('ENABLE_TOP_BTC_RATE')) {
        activateBtcRate = 'checked="checked"';
    }
    var activateClock = '';
    if (GM_getValue('ACTIVATE_CLOCK')) {
        activateClock = 'checked="checked"';
    }

    var panelAdminCode =
       '<div class="panel panel-default plain panel-config">' +
            '<div class="panel-heading white-bg">' +
                '<h4 class="panel-title"><i class="br-compass"></i>' +
                    'Greasemonkey script config (made by Yoldark)' +
                '</h4>' +
                '<h4 class="panel-title">Version : ' + VERSION + '</h4>' +
            '</div>' +
            '<div class="panel-body">' +
                '<h4 class="panel-title">Top bar :</h4><br/>' +
                '<div class="form-group">' +
                    'Enabling too much features on the top can mess with the design<br/>' +
                    '<label>'+
                        '<input class="checkbox-calculated-fee" type="checkbox" ' +
                        activateCalculatedFee + '/> ' +
                    'Enable calculated fee</label>&nbsp;' +
                     '<label>'+
                        '<input class="checkbox-btc-total-amount" type="checkbox" ' +
                        activateTotalAmount + '/> ' +
                    'Enable total amont</label>&nbsp;' +
                    '<label>'+
                        '<input class="checkbox-calculated-btc-rate" type="checkbox" ' +
                         activateBtcRate + '/> ' +
                     'Enable calculated btc-rate</label>' +

                '</div><br/>' +
                '<h4 class="panel-title">Server clock :</h4><br/>' +
                '<div class="form-group">' +
                    '<label>'+
                        '<input class="checkbox-clock" type="checkbox" ' +
                         activateClock + '/> ' +
                        'Enable server clock time</label>' +
                '</div>' +
                '<label class="control-label">Diff time&nbsp;' +
                    '<input class="input-clock" '+
                        'value="' + GM_getValue('CLOCK_DIFF') + '" />'+
                        '&nbsp;hours&nbsp;' +
                    '<input class="btn btn-primary reset-clock" type="button" ' +
                        'value="Reset to default" />' +
                '</label><br/><br/><br/>' +
                 '<h4 class="panel-title">Financial chart :</h4><br/>' +
                 '<div class="form-group">' +
                    '<label>' +
                        '<input class="checkbox-financial-activation" type="checkbox"' +
                        'value="activate" ' + activateFinancial + '/>&nbsp;' +
                        'Enable Financial panel on Balance page' +
                    '</label>' +
                '</div>' +
                '<label class="control-label">Numbers of displayed days&nbsp;' +
                    '<input class="input-financial-days" '+
                        'value="' + GM_getValue('FINANCIAL_DISPLAYED_DAYS_QUANTITY') + '" />'+
                        '&nbsp;' +
                    '<input class="btn btn-primary reset-financial" type="button" ' +
                        'value="Reset to default" />' +
                '</label><br/>' +
                '<br/><br/>' +
                '<h4 class="panel-title">Misc :</h4><br/>' +
                '<div class="form-group">' +
                    '<label>'+
                       '<input class="checkbox-shit-mode-activation" type="checkbox" ' +
                        'value="activate" ' + activateShitMode + '/> ' +
                    'Enable shit mode</label>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>' +
                        '<input class="checkbox-config-checker" type="checkbox" /> ' +
                   'ReRun config check</label>' +
                '</div>' +
                '<input class="btn btn-primary save-config" type="button" ' +
                    'value="Save configuration" />' +
            '</div>' +
        '</div>';
        $(document).on("click", ".reset-financial", function () {
            $('.input-financial-days').val(FINANCIAL_DISPLAYED_DAYS_QUANTITY);
        });
        $(document).on("click", ".reset-clock", function () {
            $('.input-clock').val(CLOCK_DIFF);
        });
        $(document).on("click", ".save-config", function () {
            setTimeout(function() {
                GM_setValue('ACTIVATE_FINANCIAL', $('.checkbox-financial-activation').is(':checked'));
                GM_setValue('FINANCIAL_DISPLAYED_DAYS_QUANTITY', $('.input-financial-days').val());
                GM_setValue('SHIT_MODE', $('.checkbox-shit-mode-activation').is(':checked'));

                GM_setValue('ENABLE_TOP_FEE', $('.checkbox-calculated-fee').is(':checked'));
                GM_setValue('ENABLE_TOP_TOTAL_AMOUNT',
                    $('.checkbox-btc-total-amount').is(':checked'));
                GM_setValue('ENABLE_TOP_BTC_RATE', $('.checkbox-calculated-btc-rate').is(':checked'));
                GM_setValue('ACTIVATE_CLOCK', $('.checkbox-clock').is(':checked'));
                GM_setValue('CLOCK_DIFF', $('.input-clock').val());
                if ($('.checkbox-config-checker').is(':checked')) {
                    GM_setValue('CONFIG_CHECKER', null);
                }

                checkShitMode();
                displayLogMessage('Greasemonkey dashboard configuration successfully saved',
                    MESSAGE_TYPE_SUCCESS);
                location.reload();
            }, 0);
        });

        //Implant the admin panel
        $(container).after(panelAdminCode);
       validateConfigurationElement('config-panel');
}

function initializeModalDialog(title, body, okText, cancelText, successCallback, cancelCallback) {
    if (typeof okText === 'undefined') {
        okText = 'Ok';
    }
    if (typeof cancelText === 'undefined') {
        cancelText = 'Cancel';
    }
    $('#add').after(
        '<div id="yoldark-modal" class="modal">' +
            '<div class="modal-dialog">' +
                '<div class="modal-content">' +
                    '<div class="modal-header">' +
                        '<button type="button" class="close">x</button>' +
                        '<h4 class="modal-title">' + title + '</h4>' +
                    '</div>' +
                    '<div class="modal-body">' +
                       body +
                    '</div>' +
                    '<div class="modal-footer">' +
                        '<button type="button" class="btn btn-danger btn-alt">' +
                            cancelText +
                        '</button>' +
                        '<button type="button" class="btn btn-primary btn-alt btn-yoldark-modal">' +
                            okText +
                        '</button>' +
                    '</div>' +
               '</div>' +
        '</div>' +
    '</div>');
    $('#yoldark-modal').show();
    $(document).on("click", '#yoldark-modal .close', function () {
        $('#yoldark-modal').remove();
        if (typeof cancelCallback !== 'undefined') {
            cancelCallback();
        }
    });
    $(document).on("click", '#yoldark-modal .btn-danger', function () {
        $('#yoldark-modal').remove();
        if (typeof cancelCallback !== 'undefined') {
            cancelCallback();
        }
    });
    $(document).on("click", '#yoldark-modal .btn-yoldark-modal', function () {
        $('#yoldark-modal').remove();
        if (typeof successCallback !== 'undefined') {
            successCallback();
        }
    });
}

function addConfigurationElement(name, id) {
    if (GM_getValue('TESTING_MODE') && $('#yoldark-modal .modal-body').length) {
        $('#yoldark-modal .modal-body')
            .append(
                '<div id="' + id + '">' + name + ' ' +
                    '<span class="spin-holder-yoldark">' +
                        '<i class="im-spinner2"></i>' +
                    '</span>' +
                '</div>');
    }
}

function validateConfigurationElement(id) {
    if (GM_getValue('TESTING_MODE') && $('#' + id).length) {
        $('#' + id + ' .spin-holder-yoldark').remove();
        $('#' + id).append('<span class="label label-success">Done</span>');
    }
}

function configurationChecker() {
    var shitModeBeforeTest = GM_getValue('SHIT_MODE');
    GM_setValue('TESTING_MODE', true);
    initializeModalDialog('Yoldark dashboard enhancer config checking',
        '<div>Display config checker : <span class="label label-success">Done</span></div>');
    var mockDiv = $('<div>', {id : "mockDiv", class : "hidden"});
    $('body').prepend(mockDiv);
    displayLogMessage('Greasemonkey config checking', MESSAGE_TYPE_SUCCESS);
    displayLogMessage('Greasemonkey config checking error', MESSAGE_TYPE_ERROR);

    var callback = function() {
        financialTrackingChart = null;
        mockDiv.empty();
        displayTopDashboard(mockDiv);
        mockDiv.empty();
        mockDiv.append("<div></div>");
        initializeConfigPanel('#mockDiv div');

        GM_setValue('SHIT_MODE', true);
        GM_setValue('SHIT_MODE_ENABLED', false);
        checkShitMode(function () {
            GM_setValue('SHIT_MODE', false);
            checkShitMode(function () {
                GM_setValue('TESTING_MODE', false);

                //test are ok
                if ($(".spin-holder-yoldark").length === 0) {
                    GM_setValue('CONFIG_CHECKER', SHORT_VERSION);
                    GM_setValue("MODAL_MESSAGE_SUCCESS_QUEUE",
                        'All the tests where successfuly passed');
                    location.reload();
                } else {
                    $(".spin-holder-yoldark")
                        .replaceWith('<span class="label label-danger">Error</span>');
                    displayLogMessage('Test error, please report the problem on ' +
                        'hashtalk thread from Yoldark', MESSAGE_TYPE_ERROR);
                }
                GM_setValue('SHIT_MODE', shitModeBeforeTest);
                checkShitMode();
            });
        });
    };
    initializeFinancialChart(mockDiv, callback);
}

function main() {
    if (GM_getValue("MODAL_MESSAGE_SUCCESS_QUEUE", false)) {
        initializeModalDialog('Yoldark dashboard enhancer config checking result',
        '<span class="label label-success">' +
            GM_getValue("MODAL_MESSAGE_SUCCESS_QUEUE") +
        '</span>');
        GM_setValue("MODAL_MESSAGE_SUCCESS_QUEUE", null);
    }
    GM_setValue('TESTING_MODE', false);
    var pageName = $('.page-header').html().split('>');
    var page = pageName[2].trim();

    //In case of shit mode there is the standard img and the shitty one :) .
    if (pageName.length > 3) {
        page = pageName[4].trim();
    }

    if (GM_getValue('CONFIG_CHECKER') !== SHORT_VERSION) {
        if (page !== 'Profile') {
            var redirect = function() {
                window.location.replace('/account/profile');
            };
            var cancelTest = function() {
                GM_setValue('CONFIG_CHECKER', SHORT_VERSION);
            };
            initializeModalDialog(
                'Moving for testing',
                'Moving to the profile page for testing the configuration',
                'Ok',
                'Cancel tests',
                redirect, cancelTest);

        } else {
            configurationChecker();
        }
    } else {
        if ($('.balance-value') && $('.balanceUSD-value')) {
            displayTopDashboard($('.navbar-bottom-row'));
        }

        if (page === 'Balance') {
            if (GM_getValue('ACTIVATE_FINANCIAL')) {
                initializeFinancialChart($('.mb10 .panel-body'));
            }
        } else if (page === 'Profile') {
            initializeConfigPanel($('div.col-lg-6.col-md-6.col-sm-6.col-xs-12 .panel:first'));
        }
        checkShitMode();
    }
}

$(document).ready(function() {
	main();
});