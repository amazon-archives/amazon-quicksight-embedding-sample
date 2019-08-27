global.fetch = require('node-fetch');
const AWS = require('aws-sdk');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');

const cognitoAuthorizedRoleArn = 'arn:aws:iam::735340738645:role/QuickSightCognito-CognitoAuthorizedRole-DONTQD3QC0G5';
const cognitoUnAuthorizedRoleArn = 'arn:aws:iam::735340738645:role/QuickSightCognito-CognitoUnAuthorizedRole-141SXICAP8IGJ';

exports.handler = function(event, context, callback) {
    return sendRes(event, context, callback);
};

const registerUser = (accountId, sessionName, roleArn) => {
    return new Promise((resolve, reject) => {

        const registerUserParams = {
            AwsAccountId: accountId,
            Email: 'xyz@abc.com',
            IdentityType: 'IAM',
            Namespace: 'default',
            UserRole: 'READER',
            IamArn: roleArn,
            SessionName: sessionName
        };

        const quicksight = new AWS.QuickSight({
            region: 'us-east-1',
        });
        quicksight.registerUser(registerUserParams, function(err, data) {
            if (err) {
                // error occurred
                console.log(err, err.stack);
                if (err.code && err.code === 'ResourceExistsException') {
                    resolve('user already registered');
                } else {
                    reject(err);
                }
            } else {
                // successful response
                setTimeout(function() {
                    resolve('successfully registered user');
                }, 2000);
            }
        });
    });
}

const getDashboardURL = (accountId, dashboardId, openIdToken, roleArn, sessionName, resetDisabled, undoRedoDisabled) => {
    return new Promise((resolve, reject) => {
        const stsClient = new AWS.STS();
        let stsParams = {
            RoleSessionName: sessionName,
            WebIdentityToken: openIdToken,
            RoleArn: roleArn
        }

        stsClient.assumeRoleWithWebIdentity(stsParams, function(err, data) {
            if (err) {
                console.log('Error assuming role');
                console.log(err, err.stack);
                reject(err);
            } else {
                const getDashboardParams = {
                    AwsAccountId: accountId,
                    DashboardId: dashboardId,
                    IdentityType: 'IAM',
                    ResetDisabled: resetDisabled,
                    SessionLifetimeInMinutes: 600,
                    UndoRedoDisabled: undoRedoDisabled
               };

                const quicksightGetDashboard = new AWS.QuickSight({
                    region: process.env.AWS_REGION,
                    credentials: {
                        accessKeyId: data.Credentials.AccessKeyId,
                        secretAccessKey: data.Credentials.SecretAccessKey,
                        sessionToken: data.Credentials.SessionToken,
                        expiration: data.Credentials.Expiration
                    }
                });

                quicksightGetDashboard.getDashboardEmbedUrl(getDashboardParams, function(err, data) {
                    if (err) {
                        console.log(err, err.stack);
                        reject(err);
                    } else {
                        const result = {
                            "statusCode": 200,
                            "headers": {
                                "Access-Control-Allow-Origin": "*",
                                "Access-Control-Allow-Headers": "Content-Type"
                            },
                            "body": JSON.stringify(data),
                            "isBase64Encoded": false
                        }
                        resolve(result);
                    }
                });
            }
        });
    });
}

const sendRes = (event, context, callback) => {
    const accountId = context.invokedFunctionArn.match(/\d{3,}/)[0];
    const dashboardId = decodeURIComponent(event.dashboardId || event.queryStringParameters.dashboardId);
    const openIdToken = decodeURIComponent(event.openIdToken || event.queryStringParameters.openIdToken);
    const authenticated = decodeURIComponent(event.authenticated || event.queryStringParameters.authenticated);
    const sessionName = decodeURIComponent(event.sessionName || event.queryStringParameters.sessionName);
    const resetDisabledParam = decodeURIComponent(event.resetDisabled || event.queryStringParameters.resetDisabled);
    const undoRedoDisabledParam = decodeURIComponent(event.undoRedoDisabled || event.queryStringParameters.undoRedoDisabled);

    console.log("Initial variables:");
    console.log(`accountID = ${accountId}`);
    console.log(`dashboardID = ${dashboardId}`);
    console.log(`openIdToken = ${openIdToken}`);
    console.log(`authenticated = ${authenticated}`);
    console.log(`sessionName = ${sessionName}`);
    console.log(`resetDisabledParam = ${resetDisabledParam}`);
    console.log(`undoRedoDisabledParam = ${undoRedoDisabledParam}`);

    if (!accountId) {
        const error = new Error("accountId is unavailable");
        callback(error);
    }
    if (!dashboardId) {
        const error = new Error("dashboardId is unavailable");
        callback(error);
    }
    if (!openIdToken) {
        const error = new Error("openIdToken is unavailable");
        callback(error);
    }
    if (!authenticated) {
        const error = new Error("authenticated flag is unavailable");
        callback(error);
    }
    if (!sessionName) {
        const error = new Error("sessionName is unavailable");
        callback(error);
    }
    if (!resetDisabledParam) {
        const error = new Error("resetDisabledParam flag is unavailable");
        callback(error);
    }
    if (!undoRedoDisabledParam) {
        const error = new Error("undoRedoDisabledParam flag is unavailable");
        callback(error);
    }

    let roleArn = null;
    if (authenticated === "true") {
        roleArn = cognitoAuthorizedRoleArn;
    } else {
        roleArn = cognitoUnAuthorizedRoleArn;
    }

    const resetDisabled = resetDisabledParam === "true" ? true : false;
    const undoRedoDisabled = undoRedoDisabledParam === "true" ? true : false;

    const registerUserPromise = registerUser(accountId, sessionName, roleArn);
    registerUserPromise.then(function(){
        const getDashboardEmbedUrlPromise = getDashboardURL(accountId, dashboardId, openIdToken, roleArn, sessionName, resetDisabled, undoRedoDisabled);
        getDashboardEmbedUrlPromise.then(function(result){
            const dashboardEmbedUrlResult = result;
            if (dashboardEmbedUrlResult && dashboardEmbedUrlResult.statusCode === 200) {
                callback(null, result);
            } else {
                console.log('getDashboardEmbedUrl failed');
            }
        }, function(err){
            console.log(err, err.stack);
        });
    }, function(err){
        console.log(err, err.stack);
    });
}
