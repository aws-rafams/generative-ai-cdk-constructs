[**@cdklabs/generative-ai-cdk-constructs**](../../../README.md) • **Docs**

***

[@cdklabs/generative-ai-cdk-constructs](../../../README.md) / [bedrock](../README.md) / ChunkingStrategy

# Class: `abstract` ChunkingStrategy

## Properties

### configuration

> `abstract` **configuration**: `ChunkingConfigurationProperty`

The CloudFormation property representation of this configuration

***

### DEFAULT

> `readonly` `static` **DEFAULT**: [`ChunkingStrategy`](ChunkingStrategy.md)

Fixed Sized Chunking with the default chunk size of 300 tokens and 20% overlap.

***

### FIXED\_SIZE

> `readonly` `static` **FIXED\_SIZE**: [`ChunkingStrategy`](ChunkingStrategy.md)

Fixed Sized Chunking with the default chunk size of 300 tokens and 20% overlap.
You can adjust these values based on your specific requirements using the
`ChunkingStrategy.fixedSize(params)` method.

***

### HIERARCHICAL

> `readonly` `static` **HIERARCHICAL**: [`ChunkingStrategy`](ChunkingStrategy.md)

Hierarchical Chunking with the default of Overlap tokens: 60,
Max parent token size: 1500, and Max child token size: 300.
You can adjust these values based on your specific requirements using the
`ChunkingStrategy.hierarchical(params)` method.

***

### NONE

> `readonly` `static` **NONE**: [`ChunkingStrategy`](ChunkingStrategy.md)

Amazon Bedrock treats each file as one chunk. Suitable for documents that
are already pre-processed or text split.

***

### SEMANTIC

> `readonly` `static` **SEMANTIC**: [`ChunkingStrategy`](ChunkingStrategy.md)

Semantic Chunking with the default of bufferSize: 0,
breakpointPercentileThreshold: 95, and maxTokens: 300.
You can adjust these values based on your specific requirements using the
`ChunkingStrategy.semantic(params)` method.

## Methods

### fixedSize()

> `static` **fixedSize**(`props`): [`ChunkingStrategy`](ChunkingStrategy.md)

Method for customizing a fixed sized chunking strategy.

#### Parameters

• **props**: `FixedSizeChunkingConfigurationProperty`

#### Returns

[`ChunkingStrategy`](ChunkingStrategy.md)

***

### hierarchical()

> `static` **hierarchical**(`props`): [`ChunkingStrategy`](ChunkingStrategy.md)

Method for customizing a hierarchical chunking strategy.

#### Parameters

• **props**: [`HierarchicalChunkingProps`](../interfaces/HierarchicalChunkingProps.md)

#### Returns

[`ChunkingStrategy`](ChunkingStrategy.md)

***

### semantic()

> `static` **semantic**(`props`): [`ChunkingStrategy`](ChunkingStrategy.md)

Method for customizing a semantic chunking strategy.

#### Parameters

• **props**: `SemanticChunkingConfigurationProperty`

#### Returns

[`ChunkingStrategy`](ChunkingStrategy.md)
