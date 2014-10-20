// ==UserScript==
// @author      Yoldark
// @name        zen dashboard enhancer
// @namespace   zenminer
// @include     https://cloud.zenminer.com/*
// @version     2.7.6
// @updateUrl   https://raw.githubusercontent.com/Yoldark34/zen_dashboard_enhancer/master/js/zen_dashboard_enhancer_Yoldark.user.js
// @grant       GM_log
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_listValues
// @grant       GM_getResourceText
// @grant       GM_addStyle
// @require     https://raw.githubusercontent.com/Yoldark34/zen_dashboard_enhancer/master/js/libraries/jquery-1.11.1.min.js
// @require     http://code.highcharts.com/highcharts.js
// @require     https://raw.githubusercontent.com/Yoldark34/zen_dashboard_enhancer/master/js/libraries/exporting.js
// @require     https://raw.githubusercontent.com/Yoldark34/zen_dashboard_enhancer/master/js/libraries/export-csv.js
// @require     https://raw.githubusercontent.com/Yoldark34/zen_dashboard_enhancer/master/js/libraries/date.js
// @require     https://raw.githubusercontent.com/mcmastermind/jClocksGMT/master/js/jquery.rotate.js
// @require     https://raw.githubusercontent.com/mcmastermind/jClocksGMT/master/js/jClocksGMT.js
// @require     https://raw.githubusercontent.com/Yoldark34/zen_dashboard_enhancer/master/js/financial.js
// @require     https://raw.githubusercontent.com/Yoldark34/zen_dashboard_enhancer/master/js/top_dashboard.js
// @require     https://raw.githubusercontent.com/Yoldark34/zen_dashboard_enhancer/master/js/roi_calc.js
// @resource    zenDashboardCss https://raw.githubusercontent.com/Yoldark34/zen_dashboard_enhancer/master/css/zen_dashboard_enhancer_Yoldark.css
// ==/UserScript==
        var VERSION = '2.7.6';
var cutVersion = VERSION.split('.');
var SHORT_VERSION = cutVersion[0] + "." + cutVersion[1];
var FINANCIAL_DISPLAYED_DAYS_QUANTITY = 50;
var ROI_DISPLAYED_DAYS_QUANTITY = 30;
var CLOCK_DIFF = '-5';
var GENESIS_FEE_RATE = 0.01;
var SCRIPT_FEE_RATE = 0.08;
var MESSAGE_TYPE_SUCCESS = 'success';
var MESSAGE_TYPE_ERROR = 'error';
var MESSAGE_TYPE_WARNING = 'error';
var AJAX_RETRIEVE_FINANCIAL_DATA = 'https://cloud.zenminer.com/api/dt/financials';
var AJAX_RETRIEVE_LATEST_ACTIVITY = 'https://cloud.zenminer.com/api/activity';

var zenDashboardCss = GM_getResourceText ("zenDashboardCss");
GM_addStyle (zenDashboardCss);

//activate financial by default
if (GM_getValue('ACTIVATE_FINANCIAL', null) === null) {
    GM_setValue('ACTIVATE_FINANCIAL', true);
}

if (GM_getValue('FINANCIAL_DISPLAYED_DAYS_QUANTITY', null) === null) {
    GM_setValue('FINANCIAL_DISPLAYED_DAYS_QUANTITY', FINANCIAL_DISPLAYED_DAYS_QUANTITY);
}

if (GM_getValue('ROI_DISPLAYED_DAYS_QUANTITY', null) === null) {
    GM_setValue('ROI_DISPLAYED_DAYS_QUANTITY', ROI_DISPLAYED_DAYS_QUANTITY);
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
    var activateROI = '';
    if (GM_getValue('ACTIVATE_ROI', false)) {
        activateROI = 'checked="checked"';
    }

    var panelAdminCode =
       '<div class="panel panel-default plain panel-config">' +
            '<div class="panel-heading white-bg">' +
                '<h4 class="panel-title"><i class="br-compass"></i>' +
                    'Yoldark\'s dashboard enhancer (GreaseMonkey script)' +
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
                        'Enable Financial chart on Balance page' +
                    '</label>' +
                '</div>' +
                '<label class="control-label">Numbers of displayed days&nbsp;' +
                    '<input class="input-financial-days" '+
                        'value="' + GM_getValue('FINANCIAL_DISPLAYED_DAYS_QUANTITY') + '" />'+
                        '&nbsp;' +
                    '<input class="btn btn-primary reset-financial" type="button" ' +
                        'value="Reset to default" />' +
                '</label><br/><br/><br/>' +
                '<h4 class="panel-title">ROI chart :</h4><br/>' +
                '<div class="form-group">' +
                    '<label>' +
                        '<input class="checkbox-roi-activation" type="checkbox"' +
                        'value="activate" ' + activateROI + '/>&nbsp;' +
                        'Enable ROI chart on dashboard page' +
                    '</label>' +
                '</div>' +
                '<label class="control-label">Numbers of displayed days&nbsp;' +
                    '<input class="input-roi-days" '+
                        'value="' + GM_getValue('ROI_DISPLAYED_DAYS_QUANTITY') + '" />'+
                        '&nbsp;' +
                    '<input class="btn btn-primary reset-roi" type="button" ' +
                        'value="Reset to default" />' +
                '</label><br/><br/><br/>' +
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
        $(document).on("click", ".reset-financial", function () {
            $('.input-financial-days').val(ROI_DISPLAYED_DAYS_QUANTITY);
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
                GM_setValue('ACTIVATE_ROI', $('.checkbox-roi-activation').is(':checked'));
                GM_setValue('ROI_DISPLAYED_DAYS_QUANTITY', $('.input-roi-days').val());
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

function modalDialogShow(id) {
    $('#' + id).show();
    $("body").addClass("modal-open");
    $("body").append('<div class="modal-backdrop fade in"></div>');
}

function modalDialogHide(id) {
    $('#' + id).hide();
    $("body").removeClass("modal-open");
    $(".modal-backdrop").remove();
}

function initializeModalDialog(id, title, body, okText, cancelText, successCallback, cancelCallback) {
    if (typeof okText === 'undefined') {
        okText = 'Ok';
    }
    if (typeof cancelText === 'undefined') {
        cancelText = 'Cancel';
    }
    $('#add').after(
        '<div id="' + id + '" class="modal yoldark-modal">' +
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
    $(document).on("click", '#' + id + ' .close', function () {
        modalDialogHide(id);
        if (typeof cancelCallback !== 'undefined') {
            cancelCallback();
        }
    });
    $(document).on("click", '#' + id + ' .btn-danger', function () {
        modalDialogHide(id);
        if (typeof cancelCallback !== 'undefined') {
            cancelCallback();
        }
    });
    $(document).on("click", '#' + id + ' .btn-yoldark-modal', function () {
        modalDialogHide(id);
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
    initializeModalDialog('yoldark-modal', 'Yoldark dashboard enhancer config checking',
        '<div>Display config checker : <span class="label label-success">Done</span></div>');
    modalDialogShow('yoldark-modal');
    var mockDiv = $('<div>', {id : "mockDiv", class : "hidden"});
    $('body').prepend(mockDiv);
    displayLogMessage('Greasemonkey config checking', MESSAGE_TYPE_SUCCESS);
    displayLogMessage('Greasemonkey config checking error', MESSAGE_TYPE_ERROR);

    var roiCallback = function() {
        mockDiv.empty();
        new TopDashboard(mockDiv, SCRIPT_FEE_RATE, GENESIS_FEE_RATE);
        mockDiv.empty();
        mockDiv.append("<div></div>");
        initializeConfigPanel('#mockDiv div');
        mockDiv.empty();

        GM_setValue('SHIT_MODE', true);
        GM_setValue('SHIT_MODE_ENABLED', false);
        checkShitMode(function () {
            GM_setValue('SHIT_MODE', false);
            checkShitMode(function () {
                mockDiv.empty();

                //test are ok
                GM_setValue('TESTING_MODE', false);

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

    var financialCallback = function() {
        mockDiv.empty();
        mockDiv.append("<div>");
        new RoiCalc($('div', mockDiv), AJAX_RETRIEVE_LATEST_ACTIVITY, AJAX_RETRIEVE_FINANCIAL_DATA, roiCallback);
    };
    new Financial(mockDiv, AJAX_RETRIEVE_FINANCIAL_DATA, financialCallback);
}

function main() {
    if (GM_getValue("MODAL_MESSAGE_SUCCESS_QUEUE", false)) {
        initializeModalDialog('yoldark-modal', 'Yoldark dashboard enhancer config checking result',
        '<span class="label label-success">' +
            GM_getValue("MODAL_MESSAGE_SUCCESS_QUEUE") +
        '</span>');
        GM_setValue("MODAL_MESSAGE_SUCCESS_QUEUE", null);
        modalDialogShow('yoldark-modal');
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
                'yoldark-modal',
                'Moving for testing',
                'Moving to the profile page for testing the configuration',
                'Ok',
                'Cancel tests',
                redirect, cancelTest);
            modalDialogShow('yoldark-modal');
        } else {
            configurationChecker();
        }
    } else {
        if ($('.balance-value') && $('.balanceUSD-value')) {
            new TopDashboard($('.navbar-bottom-row'), SCRIPT_FEE_RATE, GENESIS_FEE_RATE);
        }

        if (page === 'Balance') {
            if (GM_getValue('ACTIVATE_FINANCIAL')) {
                new Financial($('.mb10 .panel-body'), AJAX_RETRIEVE_FINANCIAL_DATA);
            }
        } else if (page === 'Profile') {
            initializeConfigPanel($('div.col-lg-6.col-md-6.col-sm-6.col-xs-12 .panel:first'));
        } else if (page === 'Dashboard') {
            if (GM_getValue('ACTIVATE_ROI', false)) {
                new RoiCalc($('div.col-lg-3.col-md-6.col-sm-6.col-xs-12'),
                    AJAX_RETRIEVE_LATEST_ACTIVITY,
                    AJAX_RETRIEVE_FINANCIAL_DATA);
            }
        }
        checkShitMode();
    }
}

$(document).ready(function() {
    main();
});