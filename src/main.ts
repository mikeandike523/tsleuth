/**
 * The main entry point and command/feature router for tsleuth
 */

import yargs from 'yargs'
import {z} from 'zod'

import { formatZodErrorForFeature } from './lib/validation/format-zod-error-for-feature';
import { ExitCode } from "./lib/types/exit-code";


import { featureCD, featureCDArgsSchema} from "./features/cd";
import { FeatureArgumentsObject } from './lib/types/feature';


const features = {
  cd: featureCD
}

const featureSchemas = {
  cd: featureCDArgsSchema
}



function main() {

  const argv = yargs(process.argv.slice(2)).argv as unknown  as {
    callingDirectory: string;
    _: Array<string>;
    [key: string]: unknown;
    listFeatures?: boolean;
  }

  if(!argv.callingDirectory) {
    process.stderr.write("The launcher for tsleuth is broken. Please check the integrity of your installation.\n")
    process.exit(ExitCode.BrokenInstallation)
  }

  if(argv.listFeatures) {
    const featureList = Object.keys(features)
    process.stdout.write("Features:\n"+featureList.join("\n"))
    process.exit(ExitCode.Success)
  }

  const featureName = argv._[0]

  if(!featureName) {
    process.stderr.write("You must specify a feature to run. You can use the flag --list-features.\n")
    process.exit(ExitCode.MissingArguments)
  }

  const listOfFeatureNames = Object.keys(features)

  if(!listOfFeatureNames.includes(featureName)) {
    process.stderr.write("The feature "+featureName+" is not available. You can use the flag --list-features to see a list of available features.\n")
    process.exit(ExitCode.InvalidFeature)
  }

  const featureArgs:FeatureArgumentsObject = {}

  const keys = Object.keys(argv)

  for(const key of keys) {
    if(![
      "listFeatures",
      "callingDirectory",
      "_",
    ].includes(key)) {
      featureArgs[key] = argv[key] as FeatureArgumentsObject[keyof FeatureArgumentsObject]
    }

  }

  const validator = featureSchemas[featureName as keyof typeof featureSchemas]

  try {
    const parsedArgs = validator.parse(featureArgs) as FeatureArgumentsObject

    const feature = features[featureName as keyof typeof features]

    const result = feature(argv.callingDirectory, parsedArgs)

    if(result instanceof Promise) {
      result.then(exitCode => {
        process.exit(exitCode)
      }).catch(error => {
        process.stderr.write('Feature '+featureName+' failed with an error that was not internally handled');
        process.exit(ExitCode.UnknownError)
      })
    }else{
      process.exit(result)
    }

  }catch(error: unknown) {
    if(error instanceof z.ZodError) {
      const formattedError = formatZodErrorForFeature(error, featureName as string)
      process.stderr.write(formattedError)
      process.exit(ExitCode.InvalidArguments)
    }else{
      if(error instanceof Error) {
        process.stderr.write("could not parse arguments: "+error.message+"\n")
        process.exit(ExitCode.ArgumentParsingFailure)
      }else if(
        typeof error === "string" || typeof error === "number" || typeof error === "boolean" || typeof error === "symbol" || typeof error === "bigint" || typeof error === "undefined" || typeof error === "function" || (error===null) 
      ){
        process.stderr.write(`could not parse arguments: ${error?.toString()??'unknown'}\n`)
        process.exit(ExitCode.ArgumentParsingFailure)
      }
      else{
        process.stderr.write("Could not parse arguments due to unknown error: "+error+"\n")
        process.exit(ExitCode.ArgumentParsingFailure)
      }
    }
  } 

  process.stderr.write("Failed to ensure selected feature and arguments are valid.\n");
  process.exit(ExitCode.ArgumentParsingFailure)


}

main()