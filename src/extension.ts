import * as vscode from 'vscode';
import { sendFeedbackToDatabase, sendCommentFeedbackToDatabase } from './db';

let feedbackTimer: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
	// Start the 10-minute feedback timer when extension activates
	startFeedbackTimer();

	// Register chat participant
	vscode.chat.createChatParticipant("code-tutor", async (request, chatContext, response, token) => {
		const userQuery = request.prompt.trim();

		// Handle /feedback command directly
		if (userQuery.toLowerCase() === '/feedback') {
			await vscode.commands.executeCommand('extension.commentFeedback');
			return;
		}

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
		response.markdown('\n\n**Please rate the response.**');

		response.button({
			command: 'extension.rateResponse',
			title: 'Rate Response',
			tooltip: 'Click to rate this response',
			arguments: [userQuery, fullResponse]
		});
	});

	// Rate response command
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

	// Comment feedback command
	const commentFeedbackCommand = vscode.commands.registerCommand('extension.commentFeedback', async () => {
		const comment = await vscode.window.showInputBox({
			placeHolder: 'Please enter your feedback comment here',
			prompt: 'We appreciate your feedback!'
		});
		if (comment) {
			try {
				await sendCommentFeedbackToDatabase({
					user_comment: comment,
					user_id: null,
					session_id: null
				});
				vscode.window.showInformationMessage('Thanks for your feedback comment!');
			} catch (err) {
				console.error('❌ Comment feedback send error:', err);
				vscode.window.showErrorMessage('Failed to send feedback comment');
			}
		}
	});
	context.subscriptions.push(commentFeedbackCommand);

	// Timer-based prompt to give feedback
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
		}, 10 * 60 * 1000); // 10 minutes
	}
}

export function deactivate() {
	if (feedbackTimer) {
		clearTimeout(feedbackTimer);
	}
}
