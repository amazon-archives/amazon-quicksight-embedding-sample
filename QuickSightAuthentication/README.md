## Usage
Before you can embed an Amazon QuickSight dashboard, you need to publish it and ensure that users are granted necessary permissions. For more information, see  [Embedding Amazon QuickSight Dashboards](https://docs.aws.amazon.com/quicksight/latest/user/embedding-dashboards.html) in the Amazon QuickSight User Guide.

The example below is using QuickSight for authenticating users into the app. Amazon API Gateway is used to expose an API which can be invoked by the web app. The API gateway triggers a function in AWS Lambda, which eventually calls the `GetDashboardEmbedUrl` API with the parameters you pass to the API gateway. A registerd QuickSight userArn is used to invoke embeddiing API to get the embed url.

- Note: Although this setup treats Lambda as an identity broker, it is expected that the lambda or a similar identity broker, gets dashboard embedding url by passing a unique userArn for each user's embedding sessions.

- Its against the user agreement to pass the same userArn for each unique user embedding session.

### Step 1: Setup the Lambda stack using AWS CloudFormation

- Create a new CloudFormation stack using `QuickSightEmbeddingLambda.json`, which you can find inside the cloudformation/ folder of this repo.

- Make a note of the `RootUrl`, which will be an output of the CloudFormation stack. This is our API Gateway endpoint.

- You should see a new lambda function created for you in the AWS Lambda console called `GetDashboardEmbedURL`, and also a new API in the AWS API Gateway console called `GetDashboardEmbedURL`.

- Note: The lambda execution role is given permissions to take the following actions `quicksight:GetDashboardEmbedURL` for all dashboards in the region and `quicksight:GetAuthCode` for all users.

### Step 2: Package and deploy Lambda code

- Inside the lambda/ directory, run

  ```
      npm install
  ```

- Next, package the index.js, package.json, and node_modules into a zip. Run the below command inside the lambda/ directory.

  ```
      zip -r getDashboardEmbedURL.zip *
  ```

- Go to the lambda, inside the AWS console and upload this zip file and hit save.

### Step 3: Setup your web app to call the API Gateway endpoint

- Create a new CloudFormation stack using `QuickSightEmbeddingWebApp.yaml`, which you can find inside the cloudformation/ folder of this repo.

- The cloud formation creates a cloud front endpoint supported by an S3 bucket `quicksightembwebapp-thebucket-xxxxxxxx` bucket.

- Replace the following parameters in the `index.html` within the `web` folder and upload the file to the S3 bucket, and give read permisions to everyone.

  ```
      var awsData = {
            dashboardId: getParameterValues('dashboardid'),
            userArn: getParameterValues('userarn'),
            apiGatewayUrl:'https://<rootUrl>/prod/getDashboardEmbedURL?',
        }
  ```

- Pick the `Domain name` from cloudfront and whitelist it in QuickSight `Domains and Embedding` section of the QuickSight Admin page.

- UserArn is of the form - arn:aws:quicksight:<region>:<awsaccountid>:user/<namespace – “default” if no user is not associated with the specific namespace>/<username>

- UserArn can also be obtained by calling quickSight:DescribeUser AWS SDK API call.

- Link to DescribeUser API call documentation - `https://docs.aws.amazon.com/quicksight/latest/APIReference/API_DescribeUser.html` 

- Try the url in the browser - `https://<DomainName>?dashboardid=<dashboardId>&userarn=<UserArn>` and verify the embedding page load.

- Make sure to use the [Amazon QuickSight Embedding SDK](https://github.com/awslabs/amazon-quicksight-embedding-sdk) for setting up embedding and passing parameter between parent and embedded iframe in your web app.


## License
This library is licensed under the Apache 2.0 License.
