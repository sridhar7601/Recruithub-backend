import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class SQSService {
  private sqs: AWS.SQS;
  private queueUrl: string | undefined;

  constructor() {
    // Initialize AWS SQS
    this.sqs = new AWS.SQS({
      region: process.env['AWS_REGION'] || 'us-west-2',
    });
    
    // Get queue URL from environment variables
    this.queueUrl = process.env['PROFILE_EVALUATOR_QUEUE_URL'];
    
    if (!this.queueUrl) {
      console.warn('PROFILE_EVALUATOR_QUEUE_URL environment variable is not set');
    }
  }

  /**
   * Send a message to the SQS queue
   * @param message The message to send
   * @returns The message ID
   */
  async sendMessage(message: any): Promise<string> {
    if (!this.queueUrl) {
      throw new Error('SQS Queue URL is not configured');
    }

    const params: AWS.SQS.SendMessageRequest = {
      QueueUrl: this.queueUrl!, // Non-null assertion (we've checked above)
      MessageBody: JSON.stringify(message),
    };

    try {
      const result = await this.sqs.sendMessage(params).promise();
      return result.MessageId!;
    } catch (error: unknown) {
      console.error('Error sending message to SQS:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to send message to SQS: ${errorMessage}`);
    }
  }

  /**
   * Receive a message from the SQS queue
   * @returns The message or null if no messages are available
   */
  async receiveMessage(): Promise<AWS.SQS.Message | null> {
    if (!this.queueUrl) {
      throw new Error('SQS Queue URL is not configured');
    }

    const params: AWS.SQS.ReceiveMessageRequest = {
      QueueUrl: this.queueUrl!, // Non-null assertion (we've checked above)
      MaxNumberOfMessages: 1, // Only get one message at a time
      WaitTimeSeconds: 0, // Don't wait for messages (use short polling)
      VisibilityTimeout: 3600, // 1 hour visibility timeout
      AttributeNames: ['All'],
      MessageAttributeNames: ['All']
    };

    try {
      const result = await this.sqs.receiveMessage(params).promise();
      return result.Messages && result.Messages.length > 0 ? result.Messages[0] : null;
    } catch (error: unknown) {
      console.error('Error receiving message from SQS:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to receive message from SQS: ${errorMessage}`);
    }
  }

  /**
   * Delete a message from the SQS queue
   * @param message The message to delete
   */
  async deleteMessage(message: AWS.SQS.Message): Promise<void> {
    if (!this.queueUrl) {
      throw new Error('SQS Queue URL is not configured');
    }

    if (!message.ReceiptHandle) {
      throw new Error('Message does not have a receipt handle');
    }

    const params: AWS.SQS.DeleteMessageRequest = {
      QueueUrl: this.queueUrl!, // Non-null assertion (we've checked above)
      ReceiptHandle: message.ReceiptHandle
    };

    try {
      await this.sqs.deleteMessage(params).promise();
    } catch (error: unknown) {
      console.error('Error deleting message from SQS:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete message from SQS: ${errorMessage}`);
    }
  }

  /**
   * Change the visibility timeout of a message
   * @param message The message to update
   * @param timeoutSeconds The new visibility timeout in seconds
   */
  async changeMessageVisibility(message: AWS.SQS.Message, timeoutSeconds: number): Promise<void> {
    if (!this.queueUrl) {
      throw new Error('SQS Queue URL is not configured');
    }

    if (!message.ReceiptHandle) {
      throw new Error('Message does not have a receipt handle');
    }

    const params: AWS.SQS.ChangeMessageVisibilityRequest = {
      QueueUrl: this.queueUrl!,
      ReceiptHandle: message.ReceiptHandle,
      VisibilityTimeout: timeoutSeconds
    };

    try {
      await this.sqs.changeMessageVisibility(params).promise();
    } catch (error: unknown) {
      console.error('Error changing message visibility:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to change message visibility: ${errorMessage}`);
    }
  }
}
