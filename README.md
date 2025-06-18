# Twilio ConversationRelay Starter App

A starter application for building agentic applications using Twilio's ConversationRelay. This template provides a foundation for creating AI-powered voice and SMS conversations with seamless live agent handoff capabilities. Built with TypeScript, Express, and OpenAI's GPT models.

## Table of Contents

- [Twilio ConversationRelay Starter App](#twilio-conversationrelay-starter-app)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Quick Start](#quick-start)
  - [Project Structure](#project-structure)
  - [Deployment](#deployment)
    - [Local Development](#local-development)
    - [Production Deployment](#production-deployment)
  - [Twilio Services Setup](#twilio-services-setup)
  - [RCS (Rich Communication Services) Setup](#rcs-rich-communication-services-setup)
  - [Environment Variables](#environment-variables)
  - [Customization](#customization)
  - [Contributing](#contributing)
  - [License](#license)

## Overview

This starter app demonstrates how to build agentic applications using Twilio's ConversationRelay. It provides a complete foundation for creating AI assistants that can handle voice calls and SMS conversations, with the ability to seamlessly hand off to human agents when needed.

The app is designed to be easily customizable - you can modify the AI instructions, add new tools, integrate with your own data sources, and extend the functionality to match your specific use case.

## Features

- 🤖 AI-powered voice and SMS conversations using OpenAI GPT-4
- 🎯 Intelligent conversation routing and handling including interruptions. 
- 🔄 Seamless live agent handoff capabilities
- 📱 SMS support with Twilio messaging
- 💳 Integration with Segment for customer profile data
- 📊 Integration with Airtable for additional customer data
- 🎙️ High-quality voice synthesis with ElevenLabs
- 🗣️ Accurate transcription with Deepgram
- 📈 Call scoring and competitive intelligence with Twilio's Conversational Intelligence
- 🛠️ Extensible tool system for custom functionality
- 🔧 Easy customization through instruction and context files

## Prerequisites

- Node.js 18+ and npm
- Twilio Account with:
  - Account SID and Auth Token
  - A phone number for conversations
  - Conversational Intelligence access (optional)
- OpenAI API key
- Segment API key (optional)
- Airtable API key (optional)
- ngrok (for local development)


## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/twilio-conversationrelay-starter.git
   cd twilio-conversationrelay-starter
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Deploy initial Twilio services:
   ```bash
   npm run twilio-init
   ```
   This script will:
   - Create a TaskRouter workspace, queue, and workflow
   - Assign a phone number for conversations
   - Create a messaging service
   - Set up Conversational Intelligence service with:
     - Call scoring operator for agent performance evaluation
     - Competitive intelligence operator for competitor mentions and escalation needs
   - Update your `.env` file with the new SIDs

5. Start the development server:
   ```bash
   npm run dev
   ```

6. In a separate terminal, start ngrok using the same PORT in your env variable:
   ```bash
   ngrok http --domain <your_ngrok_dommain> 3001
   ```

7. Update your Twilio webhook URLs with the ngrok URL in the targeted phone numbers configuration [page](https://console.twilio.com/us1/develop/phone-numbers/manage/incoming):
   - Voice webhook: `https://your-ngrok-url/call` (GET Request)
   - SMS webhook: `https://your-ngrok-url/text` (POST Request)

## Project Structure

```
twilio-conversationrelay-starter/
├── src/
│   ├── routes/             # Express route handlers
│   │   ├── call.ts         # Incoming call handling
│   │   ├── sms.ts          # SMS handling
│   │   ├── liveAgent.ts    # Live agent handoff
│   │   └── conversationRelay.ts  # WebSocket handling
│   ├── tools/              # LLM tools for agentic behavior
│   │   ├── sendToLiveAgent/  # Live agent handoff tool
│   │   ├── getSegmentProfile/ # Customer profile lookup
│   │   ├── getAirtableData/  # Additional customer data
│   │   └── manifest.ts      # Tool definitions
│   ├── lib/                # Shared utilities and types
│   │   ├── prompts/        # AI instruction files
│   │   │   ├── instructions.md  # Main AI instructions
│   │   │   └── context.md       # Context information
│   │   └── utils/          # Helper functions
│   ├── app.ts              # Express app setup
│   └── llm.ts              # LLM service with tool execution
├── scripts/
│   └── twilioInit/         # Twilio service setup
│       ├── services/       # Service creation scripts
│       │   ├── createTaskRouter.ts
│       │   ├── createMessagingService.ts
│       │   └── createConversationalIntelligence.ts
│       └── helpers/        # Deployment utilities
└── dist/                   # Compiled JavaScript
```

## Deployment

### Local Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. In a separate terminal, start ngrok using the same PORT in your env variable:
   ```bash
   ngrok http --domain <your_ngrok_dommain> PORT
   ```

### Production Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Set environment variables:
   - `NODE_ENV=production`
   - `PORT=3005`
   - `LIVE_HOST_URL=your-domain.com`

3. Start the server:
   ```bash
   npm start
   ```


## Environment Variables

Required environment variables:

```env
# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WORKFLOW_SID=your_workflow_sid
TWILIO_CONVERSATION_NUMBER=your_phone_number
TWILIO_CONVERSATIONAL_INTELLIGENCE_SID=your_intelligence_service_sid

# OpenAI
OPENAI_API_KEY=your_openai_key

# Customer Data (Optional)
SEGMENT_TOKEN=your_segment_token
SEGMENT_SPACE=your_segment_space
AIRTABLE_API_KEY=your_airtable_key
AIRTABLE_BASE_ID=your_airtable_base_id
AIRTABLE_BASE_NAME=your_airtable_base_name

# URLs
NGROK_URL=your_ngrok_url  # Development
LIVE_HOST_URL=your_domain # Production
```

### Default Tools
- sendText
- getAirtableData
- upsertAirtableData
- sendRCS
- sendText

## Customization

This starter app is designed to be easily customizable for your specific use case:

### AI Instructions
- Modify `src/lib/prompts/instructions.md` to change the AI's behavior and capabilities
- Update `src/lib/prompts/context.md` to provide relevant context information

### Adding New Tools
- Create new tool directories in `src/tools/`
- Each tool should have an `executor.ts` file with the main logic
- Add tool definitions to `src/tools/manifest.ts`
- Tools can integrate with external APIs, databases, or services

### Data Sources
- The app includes integrations with Segment and Airtable
- You can add your own data sources by creating new tools
- Customer profile data is automatically fetched and provided to the AI

### Voice and Language
- Configure voice settings in the call route
- Support for multiple languages and voice providers
- Easy switching between different transcription and TTS services

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
