# Merchi SDK JavaScript

A comprehensive JavaScript SDK for interacting with the Merchi platform API. This SDK provides a robust interface for managing products, orders, users, and other Merchi platform features.

## Installation

```bash
npm install merchi_sdk_js
# or
yarn add merchi_sdk_js
```

## Quick Start

```javascript
import { merchi } from 'merchi_sdk_js';

// Initialize the SDK with your backend and websocket URIs
const merchiClient = merchi('https://your-backend-uri.com', 'wss://your-websocket-uri.com');

// Example: Get current user
merchiClient.getCurrentUser(
  (status, data) => {
    console.log('User data:', data);
  },
  (error) => {
    console.error('Error:', error);
  }
);
```

## Features

- **Authentication & User Management**
  - User session management
  - Token-based authentication
  - User profile management

- **Product Management**
  - Create and manage products
  - Handle product variations
  - Manage inventory

- **Order Processing**
  - Create and manage orders
  - Handle quotes
  - Process payments
  - Manage shipments

- **Company & Domain Management**
  - Company profile management
  - Domain settings
  - User roles and permissions

- **Real-time Updates**
  - WebSocket integration for real-time notifications
  - Subscription management for live updates

## API Reference

### Core Functions

- `merchi(backendUri, websocketUri)` - Initialize the SDK
- `getCurrentUser(success, error, embed)` - Get current user information
- `initSessionByToken(tokenStringForUser, success, error, embed)` - Initialize session with token

### Entity Management

The SDK provides comprehensive entity management for:
- Products
- Orders
- Users
- Companies
- Domains
- Shipments
- Payments
- And more...

## Dependencies

- axios: ^0.27.2
- browser-or-node: ^2.1.1
- form-data: ^4.0.0
- moment-timezone: ^0.5.33
- uuid: ^8.3.2

## Development

### Building

```bash
# Install dependencies
npm install

# Build the library
npm run build
```

### Testing

```bash
# Run tests
npm test
```

## License

This project is licensed under the GPL-3.0-only License - see the LICENSE file for details.

## Support

For support, please contact Merchi support or open an issue in the repository.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 