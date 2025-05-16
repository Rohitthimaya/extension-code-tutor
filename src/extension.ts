import * as vscode from 'vscode';
import { sendFeedbackToDatabase } from './db';

export function activate(context: vscode.ExtensionContext) {
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
		// ... after receiving and showing the response text
		response.markdown('\n\n**Please rate the response.**');  // two newlines before prompt

		response.button({
			command: 'extension.rateResponse',
			title: 'Rate Response',
			tooltip: 'Click to rate this response',  // no newlines here
			arguments: [userQuery, fullResponse]
		});


		const rateCommand = vscode.commands.registerCommand('extension.rateResponse', async (question: string, answer: string) => {
			const ratings = ['1', '2', '3', '4', '5'];
			const selected = await vscode.window.showQuickPick(ratings, {
				placeHolder: 'Rate this response (1 = Very Satisfied, 2 = Satisfied, 3 = Neutral, 4 = Dissatisfied, 5 = Very Dissatisfied)'
			});
			if (selected) {
				try {
					await sendFeedbackToDatabase({
						question,
						response: answer,
						rating: parseInt(selected)
					});
					vscode.window.showInformationMessage(`Thanks for your feedback! You rated: ${selected}`);
				} catch (err) {
					console.error('❌ Feedback send error:', err);
					vscode.window.showErrorMessage('Failed to send feedback');
				}
			}
		});

		context.subscriptions.push(rateCommand);
	});
}

export function deactivate() { }
