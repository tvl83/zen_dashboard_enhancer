var RoiCalc = function(container, ajaxActivityUrl, ajaxFinancialUrl, callback) {
    var that = this;
    var chart;
    this._saveConfiguration = function() {
        $.each( $('.expense'), function( ) {
            GM_setValue('EXPENSE_' + $('.date', this).html(), $('.input-amount', this).val());
        });
        $.each( $('.transfer'), function( ) {
            GM_setValue('TRANSFER_' + $('.date', this).html(), $('.checkbox-transfer', this).is(':checked'));
        });
        $.each( $('.withdrawal'), function( ) {
            GM_setValue('WITHDRAWAL_' + $('.date', this).html(), $('.checkbox-withdrawal', this).is(':checked'));
        });
        displayLogMessage('Roi chart configuration successfully saved.', MESSAGE_TYPE_SUCCESS);
        location.reload();
    },
    this._cancelConfiguration= function() {
        $.each( $('.expense'), function( ) {
             $('.input-amount', this).val(GM_getValue('EXPENSE_' + $('.date', this).html(), 0));
        });
        $.each( $('.transfer'), function( ) {
            $('.checkbox-transfer', this).prop('checked', GM_getValue('TRANSFER_' + $('.date', this).html(), true));
        });
        displayLogMessage('Roi chart configuration successfully canceled.', MESSAGE_TYPE_SUCCESS);
    },
    this.constructor = function (container, ajaxActivityUrl, ajaxFinancialUrl, callback) {
        addConfigurationElement('Create ROI chart', 'roi-chart-creation');
        $(container).last().after(
            '<div class="col-lg-12">' +
                '<div class="panel panel-default plain toggle" id="hart1">' +
                    '<div class="panel-heading white-bg">' +
                        '<h4 class="panel-title">' +
                            '<i class="im-bars"></i>' +
                            'ROI Tracking' +
                        '</h4>' +
                    '</div>' +
                    '<div class="yoldark-roi-chart-container panel-body white-bg">' +
                    '<div class="form-group">' +
                        '<input type="button" value="Configure" class="btn btn-primary configure-roi">' +
                    '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="clearfix">' +
            '</div>');

        initializeModalDialog(
            'roi-configure-modal',
            'ROI chart configuration',
            '<h4>External Expenses</h4>' +
            '<p>All the expenses will be added into the reach amount (use 0 to not count an expense)</p>' +
            '<div class="expenses">' +
            '</div>' +
            '<h4>Transfers</h4>'+
            '<p>Uncheck a tranfer to not count it into the reach amount (donation for example)</p>' +
            '<div class="transfers">'+
            '</div>' +
            '<h4>Withdrawals</h4>'+
            '<p>Uncheck a withdrawal to not count it into the reach amount (to exclude it for some reason)</p>' +
            '<div class="withdrawals">'+
            '</div>'
            ,
            'Save',
            undefined,
            that._saveConfiguration,
            that._cancelConfiguration
        );

        $(document).on("click", ".configure-roi", function() {
            modalDialogShow('roi-configure-modal');
        });

        $('.yoldark-roi-chart-container').prepend($('<div>', {id : 'yoldark-roi-chart', class : 'row'}));

        that.chart = new Highcharts.Chart({
                chart: {
                    renderTo: 'yoldark-roi-chart',
                    defaultSeriesType: 'spline',
                    events: {
                        load: that.populate(ajaxActivityUrl, ajaxFinancialUrl, callback)
                    }
                },
            title: {
                text: 'ROI tracking',
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
                    text: '$ amount'
                },
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
            },
            tooltip: {
                valueSuffix: ' $'
            },
            legend: {
                layout: 'horizontal',
                align: 'center',
                verticalAlign: 'bottom',
                borderWidth: 0
            }
        });
        validateConfigurationElement('roi-chart-creation');
    };
    this._getPurchases = function (ajaxFinancialUrl, callback) {
        $.getJSON( ajaxFinancialUrl + '?iDisplayLength=0', function( subData ) {
                var aaData = subData.aaData;
                var dayIndex = 0;
                var creditIndex = 2;
                var debitIndex = 3;
                var aData = null;
                var purchases = [];
                var days = [];
                var currentDate = null;
                var amount;
                var i;
                var type;
                var result = {
                    purchases : [],
                    sales : []
                };

                //Initialize dates to groups debits and credits by days
                for (i = 0; i < aaData.length; i++) {
                    aData = aaData[i];
                    //Parse to yyyy/MM/dd to properly sort
                    currentDate = Date.parse(aData[dayIndex]).toString('yyyy/MM/dd');
                    if ($.inArray(currentDate, days) === -1) {
                        days.push(currentDate);
                    }
                    result.purchases[currentDate] = 0;
                    result.sales[currentDate] = 0;
                }

                //Sort all the days
                days.sort();

                //Fill the debits and credits grouped by days
                for (i = 0; i < aaData.length; i++) {
                    aData = aaData[i];
                    currentDate = Date.parse(aData[dayIndex]).toString('yyyy/MM/dd');
                    type = aData[1].split('>') [1].split('<') [0];
                    if (type === 'Purchase' || type === 'Sale') {
                        if (aData[debitIndex].length) {
                            amount = aData[debitIndex]
                                .split('>') [1]
                                .split('<') [0]
                                .split(' ') [0];
                            result.purchases[currentDate] += parseFloat(amount);
                        } else if (aData[creditIndex].length) {
                            amount = aData[creditIndex]
                                .split('>') [1]
                                .split('<') [0]
                                .split(' ') [0];
                            result.sales[currentDate] += parseFloat(amount);
                        }
                    }
                }

                if (callback) {
                    callback(result);
                }
        });
    },
    this.populate = function(ajaxActivityUrl, ajaxFinancialUrl, callback) {
        $.ajax({
            url: ajaxActivityUrl,
            data: {
                iDisplayLength: 0
            },
            beforeSend: function() {
                addConfigurationElement('Populate roi chart', 'roi-chart-population');
            },
            success: function (response) {
                var aaData = response.aaData;
                that._getPurchases(ajaxFinancialUrl, function(financials) {
                    var aData = null;
                    var days = [];
                    var currentDate = null;
                    var daysRange = 0;
                    var i;
                    var data = {
                        amount:[],
                        purchases: [],
                        autoPurchasesPresent:[],
                        purchasesPresent:[],
                        tranferIsPresent:[],
                        transfers:[],
                        withdrawalPresent: [],
                        withdrawals: []
                    };
                    var type;
                    var funds = [];
                    var reach = [];
                    var cumulFund = 0;
                    var cumulReach = 0;
                    var amount;
                    var bitcoin = parseFloat($('.balance-value').html().replace(',', ""));
                    var dollars = parseFloat($('.balanceUSD-value').html().split('<') [0].replace(',', ""));
                    var btcValue = (dollars / bitcoin).toString();
                    btcValue = btcValue.substring(0, 6);
                    var alreadyDonePurchaseDate = [];
                    var alreadyDoneSalesDate = [];
                    var checked;
                    var dayStart = 0;

                    //Remove the previous series
                    for (i = that.chart.series.length; i > 0; i--) {
                        that.chart.series[(i - 1)].remove();
                    }
                    // avoid series changing color
                    that.chart.colorCounter = 0;

                    //Initialize dates to groups debits and credits by days
                    for (i = 0; i < aaData.length; i++) {
                        daysRange++;
                        aData = aaData[i];
                        //Parse to yyyy/MM/dd to properly sort
                        currentDate = Date.parse(aData.createdAt.split('T')[0]).toString('yyyy/MM/dd');
                        if ($.inArray(currentDate, days) === -1) {
                            days.push(currentDate);
                        }
                        data.amount[currentDate] = 0;
                        data.transfers[currentDate] = 0;
                        data.autoPurchasesPresent[currentDate] = 0;
                        data.purchasesPresent[currentDate] = false;
                        data.tranferIsPresent[currentDate] = false;
                        data.withdrawalPresent[currentDate] = false;
                        data.withdrawals[currentDate] = 0;
                    }

                    //Sort all the days
                    days.sort();

                    //Fill the debits and credits grouped by days
                    for (i = 0; i < aaData.length; i++) {
                        aData = aaData[i];
                        currentDate = Date.parse(aData.createdAt.split('T')[0]).toString('yyyy/MM/dd');

                        if (aData.action === 'payout') {
                            type = aData.details.split(' ')[4];
                            if (type === 'BTC') {
                                data.amount[currentDate] += parseFloat(aData.details.split(' ')[3]);
                            }
                        } else if (aData.action === 'auto purchased miner') {
                            if ($.inArray(currentDate, alreadyDonePurchaseDate) === -1) {
                                alreadyDonePurchaseDate.push(currentDate);
                                data.amount[currentDate] += parseFloat(financials.purchases[currentDate]);
                            }
                            data.autoPurchasesPresent[currentDate]++;
                            GM_setValue('EXPENSE_' + currentDate, 0);
                        } else if (aData.action === 'transfer completed') {
                            data.amount[currentDate] += parseFloat(aData.details.split(' ')[5]);
                            data.tranferIsPresent[currentDate] = true;
                            data.transfers[currentDate] += parseFloat(aData.details.split(' ')[5]);
                        } else if (aData.action === 'service charge') {
                            data.amount[currentDate] += parseFloat(aData.details.split(' ')[3]);
                        } else if (aData.action === 'purchased miner') {
                            if ($.inArray(currentDate, alreadyDonePurchaseDate) === -1) {
                                alreadyDonePurchaseDate.push(currentDate);
                                data.amount[currentDate] += parseFloat(financials.purchases[currentDate]);
                            }
                        } else if (aData.action === 'activated code') {
                            data.purchasesPresent[currentDate] = true;
                        } else if (aData.action === 'withdrawal') {
                            data.amount[currentDate] += parseFloat(aData.details.split(' ')[5]);
                            data.withdrawals[currentDate] += parseFloat(aData.details.split(' ')[5]);
                            data.withdrawalPresent[currentDate] = true;
                        } else if (aData.action === 'sold miner') {
                            if ($.inArray(currentDate, alreadyDoneSalesDate) === -1) {
                                alreadyDoneSalesDate.push(currentDate);
                                data.amount[currentDate] += parseFloat(financials.sales[currentDate]);
                            }
                        } else if (aData.action === 'account credit') {
                            data.amount[currentDate] += parseFloat(aData.details.split(' ')[2]);
                        }
                    }

                    for (i = 0; i < days.length; i++) {
                        //Need to convert big float value due to error calculation into correct
                        //8 digit length after comma value.
                        data.amount[days[i]] = data.amount[days[i]]*btcValue;
                        amount = parseFloat(cumulFund + data.amount[days[i]]);
                        funds.push(parseFloat(amount.toFixed(2)));
                        cumulFund += data.amount[days[i]];

                        //Reset all the stored expenses if non used to avoid phantom purchases
                        if (GM_getValue('EXPENSE_' + days[i], 0) !== 0 && data.purchasesPresent[days[i]] === false) {
                            GM_setValue('EXPENSE_' + days[i], 0);
                        }

                        //Add menu items in the configuration panel
                        if (data.purchasesPresent[days[i]] && data.autoPurchasesPresent[days[i]] === 0) {
                            $('div#roi-configure-modal.modal div.expenses').append(
                                    '<div class="expense">' +
                                    '<span class="date">' +
                                        days[i] +
                                    '</span>' +
                                    '&nbsp;<label class="control-label">Amount spend&nbsp;</label>' +
                                    '<input class="input-amount" ' +
                                        'value="'+ GM_getValue('EXPENSE_' + days[i], 0) + '">&nbsp;$' +
                                '</div>');
                        }
                        if (data.autoPurchasesPresent[days[i]] !== 0) {
                            data.autoPurchasesPresent[days[i]]--;
                        }
                        if (data.tranferIsPresent[days[i]]) {
                            checked = '';
                            amount = data.transfers[days[i]]*btcValue;
                            if (GM_getValue('TRANSFER_' + days[i], true)) {
                                cumulReach += parseFloat(amount.toFixed(2));
                                checked = 'checked="checked"';
                            }
                            $('div#roi-configure-modal.modal div.transfers').append(
                                '<div class="transfer">' +
                                    '<input type="checkbox" class="checkbox-transfer" ' + checked + '>&nbsp;' +
                                    '<span class="date">' +
                                        days[i] +
                                    '</span>' +
                                    '&nbsp;<label class="control-label">'+
                                        amount.toFixed(2) +
                                    '&nbsp;USD&nbsp;</label>' +

                                '</div>');
                        }
                        if (data.withdrawalPresent[days[i]]) {
                            checked = '';
                            amount = data.withdrawals[days[i]]*btcValue;
                            if (GM_getValue('WITHDRAWAL_' + days[i], true)) {
                                cumulReach += parseFloat(amount.toFixed(2));
                                checked = 'checked="checked"';
                            }
                            $('div#roi-configure-modal.modal div.withdrawals').append(
                                '<div class="withdrawal">' +
                                    '<input type="checkbox" class="checkbox-withdrawal" ' + checked + '>&nbsp;' +
                                    '<span class="date">' +
                                        days[i] +
                                    '</span>' +
                                    '&nbsp;<label class="control-label">'+
                                        amount.toFixed(2) +
                                    '&nbsp;USD&nbsp;</label>' +

                                '</div>');
                        }
                        amount = cumulReach + parseFloat(GM_getValue('EXPENSE_' + days[i], 0));
                        reach.push(parseFloat(amount.toFixed(2)));
                        cumulReach += parseFloat(GM_getValue('EXPENSE_' + days[i], 0));
                    }

                    if (days.length > GM_getValue('ROI_DISPLAYED_DAYS_QUANTITY')) {
                        dayStart = days.length - GM_getValue('ROI_DISPLAYED_DAYS_QUANTITY');
                    }

                    //Remove unused days
                    days.splice(0, dayStart);
                    funds.splice(0, dayStart);
                    reach.splice(0, dayStart);

                    //Add the series to the chart
                    that.chart.colorCounter = 2;
                    that.chart.addSeries({
                        data: funds,
                        name: 'Fund'
                    });

                    that.chart.colorCounter = 10;
                    that.chart.addSeries({
                        data: reach,
                        name: 'Reach'
                    });

                    //Update the xAxis according to the days
                    that.chart.xAxis[0].setCategories(days);
                    validateConfigurationElement('roi-chart-population');
                    if (callback) {
                        callback();
                    }
                });
            }
        });
    };
    this.constructor(container, ajaxActivityUrl, ajaxFinancialUrl, callback);
    return this;
};