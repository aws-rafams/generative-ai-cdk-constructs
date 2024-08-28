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

import * as fs from 'fs';
import * as path from 'path';
import { CfnDataSource, IModel } from 'aws-cdk-lib/aws-bedrock';

enum ParsingStategyType {
  FOUNDATION_MODEL = 'BEDROCK_FOUNDATION_MODEL'
}

export interface FoundationModelParsingStategyProps {
  /**
   * The Foundational Model to use for parsing such as Claude 3 Sonnet v1.
   */
  readonly parsingModel: IModel;

  /**
   * The prompt which serves as instructions for the parser.
   * @default - "same default instruction prompt as in the AWS Console"
   */
  readonly parsingPrompt?: string;

}


export abstract class ParsingStategy {

  // ------------------------------------------------------
  // FM Parsing Strategy
  // ------------------------------------------------------
  /**
   * This feature allows you to select a foundation model for parsing of
   * non-textual information from documents such as tables and charts.
   * @see https://docs.aws.amazon.com/bedrock/latest/userguide/kb-chunking-parsing.html#kb-advanced-parsing
   */
  public static foundationModel(props: FoundationModelParsingStategyProps): ParsingStategy {
    return {
      configuration: {
        bedrockFoundationModelConfiguration: {
          modelArn: props.parsingModel.modelArn,
          parsingPrompt: {
            parsingPromptText: props.parsingPrompt
              ?? fs.readFileSync(path.join(__dirname, 'default-parsing-prompt.txt'), 'utf8'),
          },
        },
        parsingStrategy: ParsingStategyType.FOUNDATION_MODEL,
      },
    };
  }
  // ------------------------------------------------------
  // Properties
  // ------------------------------------------------------
  /** The CloudFormation property representation of this configuration */
  public abstract configuration: CfnDataSource.ParsingConfigurationProperty;
}

