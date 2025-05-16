// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { sendFeedbackToDatabase } from './db'; // Import your database function

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	vscode.chat.createChatParticipant("code-tutor", async (request, chatContext, response, token) => {
		// string that user entered
		const userQuery = request.prompt;

		const chatModels = await vscode.lm.selectChatModels({ family: 'gpt-4' })

		const messages = [
			vscode.LanguageModelChatMessage.User(userQuery)
		]
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
				await sendFeedbackToDatabase({ question, response: fullResponse, rating });
				vscode.window.showInformationMessage('Thanks for your feedback!');
			} catch (err) {
				console.error('❌ Feedback send error:', err);
				vscode.window.showErrorMessage('Failed to send feedback');
			}
		});

		context.subscriptions.push(feedbackCommand); // Use the outer context for subscriptions
	})
}


// This method is called when your extension is deactivated
export function deactivate() { }
