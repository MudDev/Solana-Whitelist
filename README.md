# Solana Whitelist Token Contract

This repository contains a proof of concept implementation of a Solana program for managing a token with a whitelist functionality. The contract allows only whitelisted addresses to perform token transfers. 

## Project Overview

### Contract Functionality

1. **Initialization**: Sets up the contract by initializing the whitelist with the authority's public key.
2. **Add to Whitelist**: Allows the authority to add addresses to the whitelist.
3. **Remove from Whitelist**: Allows the authority to remove addresses from the whitelist.
4. **Token Transfer**: Allows transfers between addresses only if both the sender and receiver are on the whitelist.

### Current Status

- **Proof of Concept**: This project is currently a proof of concept and is not fully functional.
- **Known Issues**: The project is not operational due to issues in the setup and test configurations. Specifically, there are problems with token account creation and transaction simulations.

## Project Structure

- `programs/whitelist_token/`
  - Contains the Solana program written in Rust.
- `tests/whitelist_token.ts`
  - Contains the test cases for the program using the Anchor framework and Node.js.
- `Anchor.toml`
  - Configuration file for the Anchor framework.
- `Cargo.toml`
  - Rust package configuration file.

## Installation

To set up the project, follow these steps:

1. **Clone the repository**:
   ```sh
   git clone https://github.com/yourusername/whitelist-token.git
   cd whitelist-token

2. **Install dependencies**:
Ensure you have Rust and Solana CLI installed. Follow the official installation guides for Rust and Solana CLI.

3. Build the program: `anchor build`

4. Deploy the program: `anchor deploy`