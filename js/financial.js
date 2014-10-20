var Financial = function(container, ajaxUrl, callback) {
    var that = this;
    var chart;
    this.constructor = function (container, ajaxUrl, callback) {

        addConfigurationElement('Create financial chart', 'financial-chart-creation');
        if ($(container).length) {
            $(container)
                    .prepend('<div id="financialTrackingContainer"' +
                            'style="min-width: 310px; height: 400px; margin: 0 auto">' +
                            '</div>');
            that.chart = new Highcharts.Chart({
                chart: {
                    renderTo: 'financialTrackingContainer',
                    defaultSeriesType: 'spline',
                    events: {
                        load: that.populate(callback, ajaxUrl)
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
    };
    this.populate = function(callback, ajaxUrl) {
        $.ajax({
            url: ajaxUrl,
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
                            if (GM_getValue('FINANCIAL_REVERT_DEBITS', false)) {
                                debitsGrouped[currentDate] += parseFloat(debitAmount);
                            } else {
                                debitsGrouped[currentDate] -= parseFloat(debitAmount);
                            }
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
                    if (GM_getValue('FINANCIAL_REVERT_DEBITS', false)) {
                        currentIncome = creditsGrouped[days[i]] + debitsGrouped[days[i]];
                    }
                    income.push(parseFloat(currentIncome.toFixed(8)));
                }

                //Remove unused days
                days.splice(0, dayStart);

                //Add the series to the chart
                that.chart.colorCounter = 10;
                that.chart.addSeries({
                    data: income,
                    name: 'Income'
                });
                that.chart.colorCounter = 5;
                that.chart.addSeries({
                    data: debits,
                    name: 'Debits'
                });
                that.chart.colorCounter = 2;
                that.chart.addSeries({
                    data: credits,
                    name: 'Credits'
                });

                //Update the xAxis according to the days
                that.chart.xAxis[0].setCategories(days);
                validateConfigurationElement('financial-chart-population');
                if (callback) {
                    callback();
                }
            }
        });
    };
    this.constructor(container, ajaxUrl, callback);
    return this;
};