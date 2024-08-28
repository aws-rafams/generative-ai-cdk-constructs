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

import { CfnDataSource } from "aws-cdk-lib/aws-bedrock";
import { IFunction } from "aws-cdk-lib/aws-lambda";

export interface LambdaCustomTransformationProps {
  /**
   * The Lambda function to use to process documents.
   */
  readonly lambdaFunction: IFunction;

  /**
   * An S3 bucket URL/path to store your input documents to run your 
   * Lambda function on and to also store the output of the documents.
   * @example "s3://my-bucket/chunk-processor/"
   */
  readonly s3BucketUri: string;
}

export abstract class CustomTransformation {

  // ------------------------------------------------------
  // Lambda Transformation Strategy
  // ------------------------------------------------------
  /**
   * This feature allows you to use a Lambda function to inject your own logic 
   * into the knowledge base ingestion process.
   * @see https://docs.aws.amazon.com/bedrock/latest/userguide/kb-chunking-parsing.html#kb-custom-transformation
   */
  public static lambda(props: LambdaCustomTransformationProps): CustomTransformation {
    return {
      configuration: {
        intermediateStorage: {
          s3Location: {
            uri: props.s3BucketUri
          }
        },
        transformations: [
          {
            stepToApply: "POST_CHUNKING",
            transformationFunction: {
              transformationLambdaConfiguration: {
                lambdaArn: props.lambdaFunction.functionArn
              }
            }
          }
        ]
      }
    }
  }
  // ------------------------------------------------------
  // Properties
  // ------------------------------------------------------
  /** The CloudFormation property representation of this configuration */
  public abstract configuration: CfnDataSource.CustomTransformationConfigurationProperty;
}