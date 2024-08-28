[**@cdklabs/generative-ai-cdk-constructs**](../../../README.md) • **Docs**

***

[@cdklabs/generative-ai-cdk-constructs](../../../README.md) / [bedrock](../README.md) / LambdaCustomTransformationProps

# Interface: LambdaCustomTransformationProps

## Properties

### lambdaFunction

> `readonly` **lambdaFunction**: `IFunction`

The Lambda function to use to process documents.

***

### s3BucketUri

> `readonly` **s3BucketUri**: `string`

An S3 bucket URL/path to store your input documents to run your 
Lambda function on and to also store the output of the documents.

#### Example

```ts
"s3://my-bucket/chunk-processor/"
```
