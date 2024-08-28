/**
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */
import * as integ from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BedrockFoundationModel, KnowledgeBase, ChunkingStrategy, ParsingStategy, CustomTransformation } from '../../../../src/cdk-lib/bedrock';


const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-cdk-bedrock-data-sources-integ-test');

const kb = new KnowledgeBase(stack, 'MyKnowledgeBase', {
  name: 'MyKnowledgeBase',
  embeddingsModel: BedrockFoundationModel.COHERE_EMBED_MULTILINGUAL_V3,
});

const bucket = new Bucket(stack, 'Bucket', {});
const lambdaFunction = new Function(stack, 'MyFunction', {
  runtime: cdk.aws_lambda.Runtime.PYTHON_3_9,
  handler: 'index.handler',
  code: cdk.aws_lambda.Code.fromInline('print("Hello, World!")'),
});

kb.addWebCrawlerDataSource({
  sourceUrls: ['https://docs.aws.amazon.com/'],
  chunkingStrategy: ChunkingStrategy.HIERARCHICAL_COHERE,
  customTransformation: CustomTransformation.lambda({
    lambdaFunction: lambdaFunction,
    s3BucketUri: `s3://${bucket.bucketName}/chunk-processor/`,
  }),
});

kb.addS3DataSource({
  bucket,
  chunkingStrategy: ChunkingStrategy.SEMANTIC,
  parsingStrategy: ParsingStategy.foundationModel({
    parsingModel: BedrockFoundationModel.ANTHROPIC_CLAUDE_SONNET_V1_0.asIModel(stack),
  }),
});

new integ.IntegTest(app, 'ServiceTest', {
  testCases: [stack],
  cdkCommandOptions: {
    destroy: {
      args: {
        force: true,
      },
    },
  },
});

app.synth();