# Breaking Down Billing Information from Morpheus #

This is a Node.js script which:
1. Gets billing information of different accounts from Morpheus for the period of last month,
2. Breaks down the information into usage details, and
3. Exports the details into CSV files.

## Requirements ##
- Tested on:
    - CentOS 7 1908
    - Node.js 12.16.1
    - Morpheus 4.2.0
- Requires API access to Morpheus and master tenant admin credential to get billing information

## Configuration Instructions ##
1. Modify `.env` for your application environment.
2. `npm init`
3. `npm install axios --save`
4. `npm install qs-stringify --save`
5. `npm install dotenv --save`
6. `npm install debug --save`

## Running Instructions ##
1. `node morpheus-billing.js`