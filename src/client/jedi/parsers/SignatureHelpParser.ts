import { SignatureHelp } from 'vscode';
import * as vscode from "vscode";
import * as proxy from "../../providers/jediProxy";

const DOCSTRING_PARAM_PATTERNS = [
    "\\s*:type\\s*PARAMNAME:\\s*([^\\n, ]+)", // Sphinx
    "\\s*:param\\s*(\\w?)\\s*PARAMNAME:[^\\n]+",  // Sphinx param with type
    "\\s*@type\\s*PARAMNAME:\\s*([^\\n, ]+)"  // Epydoc
];

/**
 * Extrct the documentation for parameters from a given docstring
 * 
 * @param {string} paramName Name of the parameter
 * @param {string} docString The docstring for the function
 * @returns {string} Docstring for the parameter
 */
function extractParamDocString(paramName: string, docString: string): string {
    let paramDocString = "";
    // In docstring the '*' is escaped with a backslash
    paramName = paramName.replace(new RegExp("\\*", "g"), "\\\\\\*");

    DOCSTRING_PARAM_PATTERNS.forEach(pattern => {
        if (paramDocString.length > 0) {
            return;
        }
        pattern = pattern.replace("PARAMNAME", paramName);
        let regExp = new RegExp(pattern);
        let matches = regExp.exec(docString);
        if (matches && matches.length > 0) {
            paramDocString = matches[0];
            if (paramDocString.indexOf(":") >= 0) {
                paramDocString = paramDocString.substring(paramDocString.indexOf(":") + 1);
            }
            if (paramDocString.indexOf(":") >= 0) {
                paramDocString = paramDocString.substring(paramDocString.indexOf(":") + 1);
            }
        }
    });

    return paramDocString.trim();
}
export class SignatureHelpParser {
    public static parse(data: proxy.IArgumentsResult): SignatureHelp {
        if (!data || !Array.isArray(data.definitions) || data.definitions.length === 0) {
            return new SignatureHelp();
        }
        let signature = new SignatureHelp();
        signature.activeSignature = 0;

        data.definitions.forEach(def => {
            signature.activeParameter = def.paramindex;
            // Don't display the documentation, as vs code doesn't format the docmentation
            // i.e. line feeds are not respected, long content is stripped
            let sig = <vscode.SignatureInformation>{
                // documentation: def.docstring,
                label: def.description,
                parameters: []
            };
            sig.parameters = def.params.map(arg => {
                if (arg.docstring.length === 0) {
                    arg.docstring = extractParamDocString(arg.name, def.docstring);
                }
                return <vscode.ParameterInformation>{
                    documentation: arg.docstring.length > 0 ? arg.docstring : arg.description,
                    label: arg.description.length > 0 ? arg.description : arg.name
                };
            });
            signature.signatures.push(sig);
        });
        return signature;
    }
}