"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const db_1 = require("./db"); // Import your database function
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    vscode.chat.createChatParticipant("code-tutor", async (request, chatContext, response, token) => {
        // string that user entered
        const userQuery = request.prompt;
        const chatModels = await vscode.lm.selectChatModels({ family: 'gpt-4' });
        const messages = [
            vscode.LanguageModelChatMessage.User(userQuery)
        ];
        const chatRequest = await chatModels[0].sendRequest(messages, undefined, token);
        // Initialize a variable to store the full response text
        let fullResponse = '';
        // Collect the response as it comes in
        for await (const token of chatRequest.text) {
            // Append each chunk of text to the full response
            fullResponse += token;
            // Update the response in the chat (this will show incrementally)
            response.markdown(token);
        }
        // Log the full GPT response once it's complete
        console.log('Full GPT Response:', fullResponse);
        // Add feedback buttons after response
        response.button({
            command: 'extension.sendFeedback',
            title: '👍',
            arguments: [userQuery, fullResponse, 'positive']
        });
        response.button({
            command: 'extension.sendFeedback',
            title: '👎',
            arguments: [userQuery, fullResponse, 'negative']
        });
        let feedbackCommand = vscode.commands.registerCommand('extension.sendFeedback', async (question, fullResponse, rating) => {
            console.log('🧪 Feedback button clicked', { question, rating, fullResponse }); // Confirm click
            try {
                await (0, db_1.sendFeedbackToDatabase)({ question, response: fullResponse, rating });
                vscode.window.showInformationMessage('Thanks for your feedback!');
            }
            catch (err) {
                console.error('❌ Feedback send error:', err);
                vscode.window.showErrorMessage('Failed to send feedback');
            }
        });
        context.subscriptions.push(feedbackCommand); // Use the outer context for subscriptions
    });
}
// This method is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map