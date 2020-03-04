global.fetch = require('node-fetch');
const AWS = require('aws-sdk');

exports.handler = function(event, context, callback) {
    return sendRes(event, context, callback);
};

const getDashboardURL = (accountId, dashboardId, userArn, resetDisabled, undoRedoDisabled) => {
    return new Promise((resolve, reject) => {
        
        const getDashboardParams = {
            AwsAccountId: accountId,
            DashboardId: dashboardId,
            UserArn: userArn,
            IdentityType: 'QUICKSIGHT',
            ResetDisabled: resetDisabled,
            SessionLifetimeInMinutes: 600,
            UndoRedoDisabled: undoRedoDisabled
        };

        const quicksightGetDashboard = new AWS.QuickSight({
            region: process.env.AWS_REGION,
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
    });
}

const sendRes = (event, context, callback) => {
    const accountId = context.invokedFunctionArn.match(/\d{3,}/)[0];
    const dashboardId = decodeURIComponent(event.dashboardId || event.queryStringParameters.dashboardId);
    const userArn = decodeURIComponent(event.userArn || event.queryStringParameters.userArn);
    const resetDisabledParam = decodeURIComponent(event.resetDisabled || event.queryStringParameters.resetDisabled);
    const undoRedoDisabledParam = decodeURIComponent(event.undoRedoDisabled || event.queryStringParameters.undoRedoDisabled);

    console.log("Initial variables:");
    console.log(`accountID = ${accountId}`);
    console.log(`dashboardID = ${dashboardId}`);
    console.log(`userArn = ${userArn}`);
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
    if (!userArn) {
        const error = new Error("userArn is unavailable");
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

    const resetDisabled = resetDisabledParam === "true";
    const undoRedoDisabled = undoRedoDisabledParam === "true";
    
    const getDashboardEmbedUrlPromise = getDashboardURL(accountId, dashboardId, userArn, resetDisabled, undoRedoDisabled);
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
}
