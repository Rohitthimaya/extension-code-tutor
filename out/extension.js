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
const vscode = __importStar(require("vscode"));
const db_1 = require("./db");
let feedbackTimer;
function activate(context) {
    // Start the 10-minute feedback timer when extension activates
    startFeedbackTimer();
    vscode.chat.createChatParticipant("code-tutor", async (request, chatContext, response, token) => {
        const userQuery = request.prompt;
        const chatModels = await vscode.lm.selectChatModels({ family: 'gpt-4' });
        const messages = [vscode.LanguageModelChatMessage.User(userQuery)];
        const chatRequest = await chatModels[0].sendRequest(messages, undefined, token);
        let fullResponse = '';
        for await (const token of chatRequest.text) {
            fullResponse += token;
            response.markdown(token);
        }
        console.log('Full GPT Response:', fullResponse + "\n");
        // Show prompt and one "Rate" button
        response.markdown('\n\n**Please rate the response.**'); // two newlines before prompt
        response.button({
            command: 'extension.rateResponse',
            title: 'Rate Response',
            tooltip: 'Click to rate this response',
            arguments: [userQuery, fullResponse]
        });
        const rateCommand = vscode.commands.registerCommand('extension.rateResponse', async (question, answer) => {
            const ratings = ['1', '2', '3', '4', '5'];
            const selected = await vscode.window.showQuickPick(ratings, {
                placeHolder: 'Rate this response (1 = Very Satisfied, 2 = Satisfied, 3 = Neutral, 4 = Dissatisfied, 5 = Very Dissatisfied)'
            });
            if (selected) {
                try {
                    await (0, db_1.sendFeedbackToDatabase)({
                        question,
                        response: answer,
                        rating: parseInt(selected)
                    });
                    vscode.window.showInformationMessage(`Thanks for your feedback! You rated: ${selected}`);
                }
                catch (err) {
                    console.error('❌ Feedback send error:', err);
                    vscode.window.showErrorMessage('Failed to send feedback');
                }
            }
        });
        context.subscriptions.push(rateCommand);
    });
    // New command to handle feedback comment input from user
    const commentFeedbackCommand = vscode.commands.registerCommand('extension.commentFeedback', async () => {
        const comment = await vscode.window.showInputBox({
            placeHolder: 'Please enter your feedback comment here',
            prompt: 'We appreciate your feedback!'
        });
        if (comment) {
            try {
                await (0, db_1.sendCommentFeedbackToDatabase)({
                    user_comment: comment,
                    user_id: null,
                    session_id: null
                });
                vscode.window.showInformationMessage('Thanks for your feedback comment!');
            }
            catch (err) {
                console.error('❌ Comment feedback send error:', err);
                vscode.window.showErrorMessage('Failed to send feedback comment');
            }
        }
    });
    context.subscriptions.push(commentFeedbackCommand);
    // Function to start/reset the 10-minute timer
    function startFeedbackTimer() {
        if (feedbackTimer) {
            clearTimeout(feedbackTimer);
        }
        feedbackTimer = setTimeout(() => {
            vscode.window.showInformationMessage('Please provide your feedback for this extension.', 'Provide Feedback')
                .then(selection => {
                if (selection === 'Provide Feedback') {
                    vscode.commands.executeCommand('extension.commentFeedback');
                }
            });
        }, 10000); // 10 minutes in ms
    }
}
function deactivate() {
    if (feedbackTimer) {
        clearTimeout(feedbackTimer);
    }
}
//# sourceMappingURL=extension.js.map