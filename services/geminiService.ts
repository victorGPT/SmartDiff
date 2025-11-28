import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, Language, PatchPlan, TokenUsage, AnalysisPersona } from "../types";
import { TRANSLATIONS, PERSONA_PROMPTS } from "../constants";

const MODEL_NAME = "gemini-2.5-flash";

// Helper to create client instance on demand
const getAIClient = (apiKey: string) => new GoogleGenAI({ apiKey });

export const analyzeDiff = async (
  apiKey: string,
  v1Text: string, 
  v2Text: string, 
  lang: Language, 
  knownVersion?: string,
  persona: AnalysisPersona = 'general'
): Promise<AnalysisResult> => {
  
  const ai = getAIClient(apiKey);
  const t = TRANSLATIONS[lang];
  const targetLangName = t.analysisPromptLang;
  const personaInstruction = PERSONA_PROMPTS[persona];

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      version: { type: Type.STRING, description: "The new calculated semantic version (e.g., 1.1.0)" },
      previousVersion: { type: Type.STRING, description: "The previous version detected or inferred" },
      bumpType: { type: Type.STRING, enum: ["Major", "Minor", "Patch"], description: "The type of version bump" },
      summary: { type: Type.STRING, description: `A concise executive summary of all changes in ${targetLangName}` },
      changes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "Unique ID for the change" },
            type: { 
              type: Type.STRING, 
              enum: ["feat", "fix", "docs", "refactor", "style", "perf"],
              description: "Conventional commit type"
            },
            title: { type: Type.STRING, description: `Short title of the change in ${targetLangName}` },
            description: { type: Type.STRING, description: `Detailed explanation of what changed in ${targetLangName}` },
            lines: {
              type: Type.OBJECT,
              properties: {
                start: { type: Type.INTEGER, description: "Start line number in the NEW document (1-based)" },
                end: { type: Type.INTEGER, description: "End line number in the NEW document (1-based)" },
              },
              required: ["start", "end"]
            }
          },
          required: ["id", "type", "title", "description", "lines"]
        }
      }
    },
    required: ["version", "bumpType", "summary", "changes", "previousVersion"]
  };

  // Pre-process V2 with line numbers to help the AI identify location
  const v2Lines = v2Text.split('\n');
  const v2WithLines = v2Lines.map((line, idx) => `${idx + 1}: ${line}`).join('\n');

  const prompt = `
    You are an expert Semantic Versioning manager and Diff Analyzer.
    
    Your task is to compare two documents (V1 and V2) and generate a structured changelog.
    
    Target Audience / Persona: "${persona}"
    Persona Instruction: ${personaInstruction}
    
    Input V1 (Original):
    ${v1Text}
    
    Input V2 (New Version - with line numbers for reference):
    ${v2WithLines}
    
    Instructions:
    1. Compare V1 and V2 semantically.
    2. Determine the semantic version bump (Major, Minor, or Patch) based on the changes.
    ${knownVersion 
      ? `3. The new version is explicitly set to "${knownVersion}". You MUST use this version string in the output.` 
      : `3. If V1 has a version header, increment from there. If not, start from 1.0.0.`
    }
    4. Identify specific changes. For each change:
       - Categorize it (feat, fix, docs, etc.).
       - Provide a title and description in **${targetLangName}**.
       - **Tone & Detail**: strictly follow the Persona Instruction above.
       - CRITICAL: Identify the start and end line numbers in V2 where this change is located/visible. Use the line numbers provided in the V2 input.
    
    IMPORTANT CONSTRAINT:
    - Ignore changes inside sections named "Changelog", "History", "Update Log", or similar archival sections. These are historical records.
    - Focus ONLY on the changes in the actual document content (Features, Specs, Configs, etc.) and their immediate effects.
    
    5. Return the result strictly in JSON format according to the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2, // Low temperature for more deterministic analysis
      },
    });

    const text = response.text;
    if (!text) {
        throw new Error("No response from AI");
    }
    
    const result = JSON.parse(text) as AnalysisResult;
    
    // Attach token usage if available
    if (response.usageMetadata) {
      result.usage = {
        promptTokens: response.usageMetadata.promptTokenCount || 0,
        outputTokens: response.usageMetadata.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata.totalTokenCount || 0
      };
    }
    
    return result;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

/**
 * Step 1 of Smart Patch: Analyze intent, create a list of actions, and propose version
 */
export const createPatchPlan = async (apiKey: string, v1Text: string, patchFragment: string, lang: Language): Promise<PatchPlan> => {
  const ai = getAIClient(apiKey);
  const t = TRANSLATIONS[lang];
  const targetLangName = t.analysisPromptLang;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING, description: `Brief overview of the plan in ${targetLangName}` },
      proposedVersion: { type: Type.STRING, description: "The new proposed version number (e.g., 1.1.0)" },
      bumpType: { type: Type.STRING, enum: ["Major", "Minor", "Patch"] },
      actions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            operation: { type: Type.STRING, enum: ["insert", "replace", "delete"] },
            targetSectionHeader: { type: Type.STRING, description: "Target section (e.g. ## 2.1 Login)" },
            reason: { type: Type.STRING, description: `Reasoning in ${targetLangName}` },
            description: { type: Type.STRING, description: `Action description in ${targetLangName}` }
          },
          required: ["operation", "targetSectionHeader", "reason", "description"]
        }
      }
    },
    required: ["summary", "proposedVersion", "bumpType", "actions"]
  };

  const prompt = `
    You are a Document Architect. 
    User wants to apply a "Patch Fragment" to an existing "V1 Document".
    
    Task:
    1. Analyze the "Patch Fragment" semantic meaning.
    2. Detect the current version of "V1 Document" (if any).
    3. Calculate a new version number based on the significance of the changes (Major, Minor, or Patch).
    4. Create a detailed plan with a list of specific actions to apply the patch. You may need multiple actions if the patch affects different sections.
    
    V1 Document:
    ${v1Text}
    
    Patch Fragment:
    ${patchFragment}
    
    Return a structured plan.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.1,
    },
  });

  const text = response.text;
  if (!text) throw new Error("No plan generated");
  
  const plan = JSON.parse(text) as PatchPlan;

  if (response.usageMetadata) {
    plan.usage = {
      promptTokens: response.usageMetadata.promptTokenCount || 0,
      outputTokens: response.usageMetadata.candidatesTokenCount || 0,
      totalTokens: response.usageMetadata.totalTokenCount || 0
    };
  }

  return plan;
};

/**
 * Step 2 of Smart Patch: Generate the full new document
 */
export const generatePatchedDocument = async (
  apiKey: string,
  v1Text: string, 
  patchFragment: string, 
  plan: PatchPlan, 
  targetVersion: string,
  lang: Language
): Promise<{ text: string, usage?: TokenUsage }> => {
  const ai = getAIClient(apiKey);
  const today = new Date().toISOString().split('T')[0];
  
  // Convert actions array to string for prompt
  const actionsText = plan.actions.map((a, i) => 
    `${i+1}. [${a.operation.toUpperCase()}] Target: ${a.targetSectionHeader}. Intent: ${a.description}`
  ).join('\n');

  const prompt = `
    You are an AI Document Editor.
    
    Task: Generate the NEW full document (V2) by applying the Patch Fragment to V1 Document following the specific Plan Actions.
    
    Constraints:
    1. **Principle of Least Change**: ONLY modify the sections identified in the plan. Do NOT rephrase other sections.
    2. **Structure**: Keep the original Markdown structure, indentation, and formatting.
    3. **Flow**: Ensure the inserted/replaced text flows naturally with the surrounding context.
    
    4. **Version & Date Header REPLACEMENT RULE (CRITICAL)**:
       - Scan the document for an existing header block containing "Version" and "Date" info.
       - **ACTION**: You MUST REPLACE the existing version/date values in-place with the new ones: Version: "${targetVersion}", Date: "${today}".
       - **Standard Format**: If updating/inserting, prefer this format:
         > **Version**: ${targetVersion} | **Last Updated**: ${today}
       - **FORBIDDEN**: Do NOT create a second/duplicate header block. Do NOT append a new header if one already exists.
       - **CLEANUP**: If you find multiple old version headers, REMOVE all of them except the one you just updated at the top.
       - **GOAL**: The output document must contain EXACTLY ONE version identifier.
    
    5. **METADATA REMOVAL**:
       - Check if the V1 Document ends with a block containing "SMARTDIFF AI METADATA" or a JSON code block describing the previous version.
       - If found, **REMOVE IT COMPLETELY**. 
       - Do NOT reproduce the old JSON metadata in the output. 
       - The output should end with the document content only.
    
    Plan Actions:
    ${actionsText}
    
    V1 Document:
    ${v1Text}
    
    Patch Fragment:
    ${patchFragment}
    
    Output:
    Return ONLY the complete content of the new V2 document. Do not use markdown code blocks.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      temperature: 0.2,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Failed to generate document");
  
  // Clean up if the model wrapped it in ```markdown
  const cleanText = text.replace(/^```markdown\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');

  let usage: TokenUsage | undefined;
  if (response.usageMetadata) {
    usage = {
      promptTokens: response.usageMetadata.promptTokenCount || 0,
      outputTokens: response.usageMetadata.candidatesTokenCount || 0,
      totalTokens: response.usageMetadata.totalTokenCount || 0
    };
  }

  return { text: cleanText, usage };
};