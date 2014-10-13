var TopDashboard = function(container, scriptFee, genesisFee) {
    this.constructor = function (container, scriptFee, genesisFee) {
        addConfigurationElement('Display top dashboard data', 'top-dashboard-data');
        var bitcoin = parseFloat($('.balance-value').html().replace(',', ""));
        var dollars = parseFloat($('.balanceUSD-value').html().split('<') [0].replace(',', ""));

        if (bitcoin === 0.0) {
            $(container)
                .prepend($('<li>')
                .append($('<a>')
                .append('You need to have some fund to get the BTC rate calculation.')));
        } else {
            var btcValue = (dollars / bitcoin).toString();
            btcValue = btcValue.substring(0, 6);
            var scriptFee = scriptFee / btcValue;
            var genesysFee = genesisFee / btcValue;
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
    };
    this.constructor(container, scriptFee, genesisFee);
    return this;
};