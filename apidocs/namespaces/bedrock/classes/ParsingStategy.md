[**@cdklabs/generative-ai-cdk-constructs**](../../../README.md) • **Docs**

***

[@cdklabs/generative-ai-cdk-constructs](../../../README.md) / [bedrock](../README.md) / ParsingStategy

# Class: `abstract` ParsingStategy

## Constructors

### new ParsingStategy()

> **new ParsingStategy**(): [`ParsingStategy`](ParsingStategy.md)

#### Returns

[`ParsingStategy`](ParsingStategy.md)

## Properties

### configuration

> `abstract` **configuration**: `ParsingConfigurationProperty`

The CloudFormation property representation of this configuration

## Methods

### foundationModel()

> `static` **foundationModel**(`props`): [`ParsingStategy`](ParsingStategy.md)

This feature allows you to select a foundation model for parsing of 
non-textual information from documents such as tables and charts.

#### Parameters

• **props**: [`FoundationModelParsingStategyProps`](../interfaces/FoundationModelParsingStategyProps.md)

#### Returns

[`ParsingStategy`](ParsingStategy.md)

#### See

https://docs.aws.amazon.com/bedrock/latest/userguide/kb-chunking-parsing.html#kb-advanced-parsing
