# Squads MCP: Secure Multisig Management for Solana

![Squads MCP](squads.png)


[![npm version](https://img.shields.io/npm/v/squads-mcp.svg)](https://www.npmjs.com/package/squads-mcp)
[![npm downloads](https://img.shields.io/npm/dm/squads-mcp.svg)](https://www.npmjs.com/package/squads-mcp)

A secure Model Context Protocol (MCP) implementation for Squads multisig management on Solana blockchain. This toolkit prioritizes security at every step while enabling LLMs to safely interact with multisig accounts.

## 🔐 Security-First Design

Squads MCP implements multiple security layers to protect your assets and multisig operations:

- **Local Private Key Storage**: Keys never leave your device, unlike web wallets or browser extensions
- **Permission Separation**: Distinct INITIATE, EXECUTE, and VOTE roles prevent single-point compromise
- **Time Lock Support**: Configure mandatory waiting periods before sensitive transactions execute
- **Comprehensive Security Auditing**: Built-in `AUDIT_MULTISIG_SECURITY` tool scores your configuration
- **Security-Focused Schemas**: Every tool includes explicit security warnings and verification steps
- **Threshold Recommendations**: Smart defaults for different multisig types (Reserve, Operations, etc.)
- **Secure Connection Management**: Easily switch between networks for testing and production

## 📋 Features

### Multisig Management

- Create new multisig accounts with customizable permissions
- Import existing multisig accounts
- Audit multisig security with detailed recommendations
- Configure thresholds, permissions, and time locks

### Transaction Handling

- Create and manage proposals
- Vote on proposals (approve/reject)
- Execute approved transactions
- Cancel pending proposals

### Asset Management

- View SOL and token balances in vaults
- Transfer SOL from vaults
- Fund vaults

## 🛡️ Security Best Practices

The implementation promotes Squads security best practices:

1. **Separation of Duties**:

   - Keep INITIATE and EXECUTE roles separate
   - Avoid giving ALL permissions to any member

2. **Proper Thresholds**:

   - For Reserve multisigs: 6+ members, 4+ threshold
   - For Program Upgrade multisigs: 6+ members, 4+ threshold
   - For Operations multisigs: 3+ members, 2+ threshold

3. **Time Locks**:

   - Reserve: 3600+ seconds (1 hour)
   - Program Upgrade: 600+ seconds (10 minutes)
   - Operations: 300+ seconds (5 minutes)

4. **Hardware Security**:
   - Use hardware wallets for critical multisigs
   - Consider multiple hardware wallet vendors

## 🔧 How It Works

This project leverages the Model Context Protocol (MCP) to enable secure interaction between LLMs and Squads multisig functionality. MCP provides a standardized way for AI models to use external tools while maintaining security and context.

```
┌─────────┐    ┌──────────────┐    ┌────────────┐    ┌────────┐
│   LLM   │<-->│ MCP Protocol │<-->│ Squads MCP │<-->│ Solana │
└─────────┘    └──────────────┘    └────────────┘    └────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js v16+
- Solana CLI tools (optional)
- A Solana wallet (preferably a hardware wallet for production use)

### Installation

#### Option 1: From NPM (Recommended)

```bash
# Using npm
npm install squads-mcp

# Using yarn
yarn add squads-mcp

# Using pnpm
pnpm add squads-mcp
```

#### Option 2: From Source

```bash
git clone https://github.com/dorkydhruv/squads-mcp.git
cd squads-mcp
pnpm install
pnpm build
```

### Configuration for `claude_desktop_config.json`

```json
{
  "mcpServers": {
    "squads-mcp": {
      "command": "node",
      "args": [
        "node_modules/squads-mcp/dist/index.js" // If installed from npm
        // OR use "/ABSOLUTE/PATH/TO/YOUR/MCP/PROJECT/FILE" if built from source
      ]
    }
  }
}
```

## 📚 Available Tools

### Configuration Tools

- `CONNECTION_UPDATE`: Set Solana connection
- `SHOW_CONFIG`: Display current configuration

### Squads Multisig Tools

- `CREATE_SQUADS_MULTISIG`: Create a new multisig
- `IMPORT_SQUADS_MULTISIG`: Import existing multisig
- `GET_MULTISIG_ACCOUNT`: View multisig details
- `AUDIT_MULTISIG_SECURITY`: Security audit with recommendations

### Proposal Management

- `CREATE_PROPOSAL`: Create a new proposal
- `APPROVE_PROPOSAL`: Vote to approve a proposal
- `REJECT_PROPOSAL`: Vote to reject a proposal
- `CANCEL_PROPOSAL`: Cancel a pending proposal
- `GET_PROPOSAL`: View a specific proposal
- `GET_PROPOSALS`: List all proposals

### Transaction Execution

- `EXECUTE_CONFIG_TRANSACTION`: Execute configuration changes
- `EXECUTE_VAULT_TRANSACTION`: Execute vault transactions

### Asset Management

- `GET_ASSETS`: View assets in a multisig vault
- `FUND_VAULT`: Send SOL to a vault
- `TRANSFER_SOL_FROM_VAULT`: Send SOL from a vault

## 🛠️ Security Audit Tool: Technical Deep Dive

The `AUDIT_MULTISIG_SECURITY` tool provides enterprise-grade security analysis of Squads multisig configurations:

### Technical Implementation

- **Quantitative Security Scoring**: Implements a multi-dimensional security algorithm (0-100) evaluating 15+ risk factors including threshold ratios, permission structures, and time lock durations
- **Automated Vulnerability Detection**: Scans for common security misconfigurations including single-point failures, inadequate thresholds, and insufficient time locks
- **Role-Based Access Control Analysis**: Evaluates separation of duties across INITIATE, EXECUTE, and VOTE permissions, flagging cases where excessive permissions are concentrated
- **Risk Assessment Matrix**: Categorizes findings into Critical, High, Medium, and Low severity with color-coded outputs and remediation recommendations

### Security Features

- **Threshold Optimization Engine**: Calculates optimal threshold settings based on multisig purpose, member count, and asset value exposure
- **Time Lock Validation**: Enforces minimum time lock periods calibrated to risk profiles (1+ hour for Reserve, 10+ minutes for Upgrades, etc.)
- **Configuration Hardening**: Generates specific security-hardening recommendations with implementation instructions
- **Compliance Verification**: Checks configurations against industry best practices for Solana multisig management
- **JSON Export**: Provides machine-readable output for integration with security monitoring systems

The tool was developed using TypeScript with specialized cryptographic validation routines and a proprietary scoring algorithm based on blockchain security research.

## 🔒 Security Recommendations

1. **Always verify addresses**: Double-check multisig addresses before operations
2. **Follow the two-minute rule**: Wait at least 2 minutes after approvals before executing critical transactions
3. **Run regular security audits**: Use `AUDIT_MULTISIG_SECURITY` after any configuration changes
4. **Implement proper access control**: Separate proposal creation from execution roles
5. **Use secure devices**: Perform sensitive operations on dedicated, secure devices
6. **Consider transaction simulation**: Test critical transactions in a safe environment first

## 🧩 Protocol Overview: Model Context Protocol (MCP)

This project is built on the [Model Context Protocol (MCP)](https://github.com/modelcontextprotocol/spec), an open protocol for secure, context-aware automation and agent workflows. MCP enables tools and agents (including LLMs) to interact with user data and actions in a controlled, auditable, and privacy-preserving way. By leveraging MCP, Squads MCP ensures that all tool invocations are contextually validated and logged, reducing the risk of unauthorized or unintended actions.

## 🛡️ Additional Security Considerations

- **No Third-Party Custody**: All private keys are managed and stored locally. There is no cloud sync, remote backup, or third-party custody, minimizing the risk of remote compromise.
- **Direct Solana RPC Usage**: All blockchain interactions are performed directly from your environment, with no intermediaries or delegated signing. Only the locally stored private key is used for signing transactions, and only with explicit user action.
- **Transparency and Auditability**: Tools like `SHOW_CONFIG`, `GET_MULTISIG_ACCOUNT`, and `GET_PROPOSALS` provide full visibility into your configuration, multisig state, and proposal history, supporting transparency and review.
- **Explicit Security Warnings**: Tool schemas and prompts include explicit warnings and verification steps (e.g., "Double-check this address", "Use a hardware wallet for large amounts").
- **Operational Security Guidance**: The built-in audit tool provides actionable recommendations, such as using hardware wallets, segmenting treasuries, and rotating keys. Time lock checks enforce best practices for critical accounts.
- **No Implicit Actions**: All actions require explicit invocation and confirmation, reducing the risk of accidental or automated misuse.
- **Minimal Attack Surface**: The codebase is designed to minimize dependencies and avoid unnecessary network exposure. Only essential ports and endpoints are enabled.

## 🧑‍💻 Developer Notes

- All tools are registered in index.ts and exposed via the MCP server.
- The codebase is modular, making it easy to extend with new tools or adapt to future MCP or Squads protocol updates.
- Security is a process: regularly review, audit, and update your configuration and dependencies.

## 📕 Additional Resources

- [Squads Protocol](https://squads.so/)
- [Model Context Protocol](https://github.com/modelcontextprotocol)
- [Solana Foundation](https://solana.com/)
- [NPM Package](https://www.npmjs.com/package/squads-mcp)