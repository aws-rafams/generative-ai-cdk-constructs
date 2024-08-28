[**@cdklabs/generative-ai-cdk-constructs**](../../../README.md) • **Docs**

***

[@cdklabs/generative-ai-cdk-constructs](../../../README.md) / [bedrock](../README.md) / CustomTransformation

# Class: `abstract` CustomTransformation

## Constructors

### new CustomTransformation()

> **new CustomTransformation**(): [`CustomTransformation`](CustomTransformation.md)

#### Returns

[`CustomTransformation`](CustomTransformation.md)

## Properties

### configuration

> `abstract` **configuration**: `CustomTransformationConfigurationProperty`

The CloudFormation property representation of this configuration

## Methods

### lambda()

> `static` **lambda**(`props`): [`CustomTransformation`](CustomTransformation.md)

This feature allows you to use a Lambda function to inject your own logic
into the knowledge base ingestion process.

#### Parameters

• **props**: [`LambdaCustomTransformationProps`](../interfaces/LambdaCustomTransformationProps.md)

#### Returns

[`CustomTransformation`](CustomTransformation.md)

#### See

https://docs.aws.amazon.com/bedrock/latest/userguide/kb-chunking-parsing.html#kb-custom-transformation
