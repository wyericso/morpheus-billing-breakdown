'use strict';

require('dotenv').config({path: __dirname + '/.env'});
const axios = require('axios');
const stringify = require('qs-stringify');
const fs = require('fs');

(async () => {
    try {
        // login Morpheus
        let response = await axios.post(
            process.env.MORPHEUS_API_URL +
            '/oauth/token?grant_type=password&scope=write&client_id=morph-api',
            stringify({
                username: process.env.USERNAME,
                password: process.env.PASSWORD
            })
        );
        let token = response.data.access_token;
        process.stdout.write('Token retrieved.\n');

        // retrieve accounts
        response = await axios.get(process.env.MORPHEUS_API_URL + '/api/accounts', {
            headers: { 'Authorization': 'BEARER' + token },
        });
        process.stdout.write('Accounts retrieved.\n');
        let accounts = response.data.accounts.map(account => ({
            id: account.id,
            name: account.name
        }));

        // set billing information period
        let date = new Date();
        let startDate = new Date(Date.UTC(date.getFullYear(), date.getMonth()-1, 1)); // last month start
        let endDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), 0)); // last month end

        accounts.forEach(async (account) => {
            // get billing information of each account
            try {
                response = await axios.get(
                    process.env.MORPHEUS_API_URL + '/api/billing/account/' + account.id +
                    '?startDate=' + startDate.toISOString() + '&endDate=' + endDate.toISOString(),
                    {
                        headers: { 'Authorization': 'BEARER' + token },
                    }
                );
                process.stdout.write('Billing information of account ' + account.name + ' retrieved.\n');

                // write header to CSV file
                fs.mkdirSync(__dirname + '/output', { recursive: true });
                let csvFile = __dirname + '/output/' + account.name + '.csv';
                let wstream = fs.createWriteStream(csvFile);
                wstream.write(
                    'Cloud,Instance,Usage Start Date,Usage End Date,Hours,Currency,' +
                    'Price on,Price per Quantity per Hour,Price per Quantity,Quantity,Price\n'
                );

                // traverse billing information and write to CSV file
                response.data.billingInfo.zones.forEach((zone) => {
                    zone.instances.instances.forEach((instance) => {
                        instance.containers.forEach((container) => {
                            container.usages.forEach((usage) => {
                                usage.applicablePrices.forEach((applicablePrice) => {
                                    applicablePrice.prices.forEach((price) => {
                                        wstream.write(
                                            zone.zoneName + ',' +
                                            instance.name + ',' +
                                            usage.startDate + ',' +
                                            usage.endDate + ',' +
                                            applicablePrice.numUnits + ',' +
                                            applicablePrice.currency + ',' +
                                            price.type + ',' +
                                            price.pricePerUnit + ',' +
                                            price.price + ',' +
                                            price.quantity + ',' +
                                            (price.price * price.quantity) + '\n'
                                        );
                                    });
                                });
                            });
                        });
                    });
                });
                wstream.end();
                process.stdout.write(csvFile + ' saved.\n');
            }
            catch (err) {
                process.stderr.write(err + '\n');
            }
        });
    }
    catch (err) {
        process.stderr.write(err + '\n');
    }
})();
