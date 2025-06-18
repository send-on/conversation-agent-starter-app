// External npm packages
import 'dotenv/config';
import OpenAI from 'openai';

// Local imports
import { LLMEvents, Store, TypedEventEmitter } from './lib/types';
import { log } from './lib/utils/logger';
import { tools } from './tools/manifest';
import { executeTool } from './tools/executors';

// ========================================
// LLM Configuration
// ========================================

export class LLMService {
  private openai: OpenAI;
  private model: string;
  private store: Store = { context: {}, msgs: [] };
  private emitter = new TypedEventEmitter<LLMEvents>();
  private customerNumber: string;

  constructor(customerNumber: string) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = 'gpt-4.1';
    this.customerNumber = customerNumber;
  }

  public async notifyInitialCallParams() {
    this.addMessage({
      role: 'system',
      content: `The customer's phone number is ${this.customerNumber}.`,
    });
  }

  // Event emitter methods
  on: (typeof this.emitter)['on'] = (...args) => this.emitter.on(...args);
  emit: (typeof this.emitter)['emit'] = (...args) => this.emitter.emit(...args);

  // Add message to conversation history
  addMessage = (msg: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }) => {
    this.store.msgs.push(msg);
    return this;
  };

  // Process conversation and get response
  run = async () => {
    try {
      const stream = await this.openai.chat.completions.create({
        model: this.model,
        messages: this.store.msgs,
        stream: true,
        temperature: 0.1,
        tools: Object.entries(tools).map(([_key, tool]) => {
          return tool.manifest;
        }),
      });

      let fullText = '';
      let currentChunk = '';
      let toolCallInProgress = false;
      let toolCallBuffer = '';
      let currentToolName = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        const toolCalls = chunk.choices[0]?.delta?.tool_calls;

        if (toolCalls) {
          toolCallInProgress = true;

          // Buffer tool call data
          if (toolCalls[0]?.function?.name) {
            currentToolName = toolCalls[0].function.name;
          }
          if (toolCalls[0]?.function?.arguments) {
            toolCallBuffer += toolCalls[0].function.arguments;
          }

          // Try to parse the buffered arguments
          try {
            const args = JSON.parse(toolCallBuffer);
            // If we get here, we have valid JSON - execute the tool
            log.yellow('relay.tool', 'Executing tool', {
              name: currentToolName,
              args: toolCallBuffer,
            });

            const result = await executeTool(currentToolName, args);
            log.yellow('relay.tool', 'Tool execution result', { result });

            if (result.success) {
              this.addMessage({
                role: 'system',
                content: `Tool call ${currentToolName} succeeded with data: ${JSON.stringify(
                  result.data
                )}`,
              });

              // Handle live agent handoff
              if (currentToolName === 'sendToLiveAgent') {
                this.emit('handoff', result.data);
                return; // End the conversation
              }
            } else {
              this.addMessage({
                role: 'system',
                content: `Tool call ${currentToolName} failed: ${result.error}`,
              });
            }

            // Reset buffers after execution
            toolCallBuffer = '';
            currentToolName = '';
            toolCallInProgress = false;

            // Add a prompt to continue the conversation
            this.addMessage({
              role: 'system',
              content:
                'Please continue the conversation based on the gathered information.',
            });
          } catch (e) {
            // JSON parsing failed - continue buffering
            continue;
          }
        }

        if (content) {
          currentChunk += content;
          fullText += content;

          // Send chunks of text for TTS
          if (
            currentChunk.length >= 10 ||
            content.includes('.') ||
            content.includes('?')
          ) {
            this.emit('text', currentChunk, false);
            currentChunk = '';
          }
        }
      }

      // Send any remaining text
      if (currentChunk) {
        this.emit('text', currentChunk, false);
      }

      // Send final chunk and full text
      if (fullText.length > 1) {
        this.emit('text', '', true, fullText);
      } else {
        this.run();
      }

      // Add assistant's response to conversation history
      if (fullText || toolCallInProgress) {
        this.addMessage({
          role: 'assistant',
          content: fullText,
        });
      }
    } catch (error) {
      log.error('llm', 'Conversation error', { error });
      // Add error message to conversation history
      this.addMessage({
        role: 'assistant',
        content:
          'I apologize, but I encountered an error. Could you please try again?',
      });
    }
  };
}
