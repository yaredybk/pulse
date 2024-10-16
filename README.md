# pulse
# Pulse Chat App

# Description
Pulse is a real-time chat application designed to connect users seamlessly through text messaging. Built using Node.js, Express, postgresql and redis, Pulse leverages modern technologies to ensure secure and efficient communication.

# Features
- User Authentication: Secure user registration and login.
- Real-time Messaging: Instant message delivery and receipt.
- Chat Rooms: Create and join chat rooms for group conversations.  - not implimented yet
- User Profiles: View and edit user profiles.
- Secure Connections: Implemented security best practices with Helmet, OAuth2 and express-session.

# Getting Started
## Prerequisites
- Node.js (v10.13 or higher)
- NPM (v6.0 or higher)
- Redis (for session management)
- PostgreSQL (for database)

## Installation
1. Clone the repository:
   git clone https://github.com/yaredybk/pulse.git
   cd pulse

2. Install dependencies:
   npm install

3. Set up environment variables:
   Create a .env file in the root directory and add the following:

   PORT=5000
   NODE_ENV=development

   # DATABASE
   DB_USER=123abcd
   DB_HOST=localhost
   DB_DATABASE=public
   DB_PASSWORD=123abcd
   DB_PORT=5432

   # REDIS
   REDIS_URL=redis://127.0.0.1:6379

   # express-session
   SESSION_KEY=123abcd

   # auth0
   AUTH0_ISSUER_BASE_URL=https://....us.auth0.com
   AUTH0_AUDIENCE=domain
   AUTH0_CLIENT_ID=123abcd
   AUTH0_SECRET=123abcd

   # Websocket
   WS_LIMIT=50
   WS_TIMEOUT=300000

5. Initialize postgress database using 
   - /sql/init.sql
   - /sql/views.sql

5. Run the server:
   npm start

6. Open your browser and navigate to http://localhost:5000.

# Usage
1. Register: Go to /api/login to create a new account.
2. Login: Go to /api/login to log in to your account.
3. Create Chat Room: Go to /api/room/ to create a new chat room. - not implimented yet
4. Join Chat Room: Go to /room/:roomId to join an existing chat room. - not implimented yet
5. Send Messages: Use the chat interface to send and receive messages in real-time. - using websocket

# Dependencies
- connect-redis: ^7.1.1
- dotenv: ^16.4.5
- express: ^4.21.1
- express-openid-connect: ^2.17.1
- express-session: ^1.18.0
- helmet: ^8.0.0
- pg: ^8.13.0
- redis: ^4.7.0
- ws: ^8.18.0

# Contributing
  -

# License
This project is licensed under the MIT License - see the LICENSE file for details.

# Authors
- Yared Bekuru - https://github.com/yaredybk

# Acknowledgments
Special thanks to all contributors and the open-source community for making this project possible.


- This README file is improved by LLM #AI -
