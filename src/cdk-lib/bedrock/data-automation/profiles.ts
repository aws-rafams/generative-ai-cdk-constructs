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

import { Arn, ArnFormat, Aws } from "aws-cdk-lib";
import { Grant, IGrantable } from "aws-cdk-lib/aws-iam";
import { IInvokable } from "../models";

export namespace BedrockDataAutomation {
  export enum ProfileIdentifier {
    V1 = "data-automation-v1",
  }

  export enum ProfileRegion {
    US = "us",
    //   EU = "eu",
    //   APAC = "apac",
  }

  /**
   * Represents a cross-region inference profile for Bedrock Data Automation
   */
  export class Profile implements IInvokable {
    public static DEFAULT = Profile.fromConfig({
      region: BedrockDataAutomation.ProfileRegion.US,
      identifier: BedrockDataAutomation.ProfileIdentifier.V1,
    });

    /**
     * Creates a US cross-region inference profile from the specified source region
     */
    public static fromConfig({
      region,
      identifier,
    }: {
      region: ProfileRegion;
      identifier: ProfileIdentifier;
    }): Profile {
      return new Profile(`arn:aws:bedrock:${region}::foundation-model/`);
    }

    private constructor(private readonly sourceRegion: string) {}
  }
}
