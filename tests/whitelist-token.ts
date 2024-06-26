import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { WhitelistToken } from "../target/types/";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { assert } from "chai";

describe("whitelist_token", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.WhitelistToken as Program<WhitelistToken>;

  let whitelistAccount: Keypair;
  let mint: Keypair;
  let fromTokenAccount: PublicKey;
  let toTokenAccount: PublicKey;

  before(async () => {
    whitelistAccount = Keypair.generate();
    mint = Keypair.generate();

    await program.rpc.initialize({
      accounts: {
        whitelist: whitelistAccount.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [whitelistAccount],
    });

    // Create mint
    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(
        provider.wallet.publicKey,
        1000000000
      ),
      "confirmed"
    );

    const mintRent = await program.provider.connection.getMinimumBalanceForRentExemption(82);
    await program.rpc.initialize({
      accounts: {
        mint: mint.publicKey,
        rent: mintRent,
        systemProgram: SystemProgram.programId,
      },
      signers: [mint],
      instructions: [
        SystemProgram.createAccount({
          fromPubkey: provider.wallet.publicKey,
          newAccountPubkey: mint.publicKey,
          lamports: mintRent,
          space: 82,
          programId: TOKEN_PROGRAM_ID,
        }),
      ],
    });

    const fromTokenAccount = await createTokenAccount(mint.publicKey, provider.wallet.publicKey, provider.wallet.publicKey);
    const toTokenAccount = await createTokenAccount(mint.publicKey, provider.wallet.publicKey, provider.wallet.publicKey);
  });

  it("Adds an address to the whitelist", async () => {
    const addressToAdd = Keypair.generate().publicKey;
    await program.rpc.addToWhitelist(addressToAdd, {
      accounts: {
        whitelist: whitelistAccount.publicKey,
        authority: provider.wallet.publicKey,
      },
    });

    const account = await program.account.whitelist.fetch(whitelistAccount.publicKey);
    assert.isTrue(account.addresses.includes(addressToAdd));
  });

  it("Removes an address from the whitelist", async () => {
    const addressToRemove = Keypair.generate().publicKey;
    await program.rpc.addToWhitelist(addressToRemove, {
      accounts: {
        whitelist: whitelistAccount.publicKey,
        authority: provider.wallet.publicKey,
      },
    });

    await program.rpc.removeFromWhitelist(addressToRemove, {
      accounts: {
        whitelist: whitelistAccount.publicKey,
        authority: provider.wallet.publicKey,
      },
    });

    const account = await program.account.whitelist.fetch(whitelistAccount.publicKey);
    assert.isFalse(account.addresses.includes(addressToRemove));
  });

  it("Transfers tokens between whitelisted addresses", async () => {
    const address1 = Keypair.generate().publicKey;
    const address2 = Keypair.generate().publicKey;

    await program.rpc.addToWhitelist(address1, {
      accounts: {
        whitelist: whitelistAccount.publicKey,
        authority: provider.wallet.publicKey,
      },
    });

    await program.rpc.addToWhitelist(address2, {
      accounts: {
        whitelist: whitelistAccount.publicKey,
        authority: provider.wallet.publicKey,
      },
    });

    const amount = new anchor.BN(100);

    await program.rpc.transfer(amount, {
      accounts: {
        whitelist: whitelistAccount.publicKey,
        from: fromTokenAccount,
        to: toTokenAccount,
        authority: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
    });

    const fromAccount = await getTokenAccount(provider, fromTokenAccount);
    const toAccount = await getTokenAccount(provider, toTokenAccount);

    assert.equal(fromAccount.amount.toNumber(), 0);
    assert.equal(toAccount.amount.toNumber(), amount.toNumber());
  });

  async function createTokenAccount(
    mint: PublicKey,
    owner: PublicKey,
    payer: PublicKey
  ): Promise<PublicKey> {
    const tokenAccount = Keypair.generate();
    const rentExemption =
      await program.provider.connection.getMinimumBalanceForRentExemption(165);
    await program.rpc.initialize({
      accounts: {
        tokenAccount: tokenAccount.publicKey,
        mint: mint,
        owner: owner,
        rent: rentExemption,
        systemProgram: SystemProgram.programId,
      },
      signers: [tokenAccount],
      instructions: [
        SystemProgram.createAccount({
          fromPubkey: payer,
          newAccountPubkey: tokenAccount.publicKey,
          lamports: rentExemption,
          space: 165,
          programId: TOKEN_PROGRAM_ID,
        }),
      ],
    });
    return tokenAccount.publicKey;
  }

  async function getTokenAccount(provider, pubkey) {
    const accountInfo = await provider.connection.getParsedAccountInfo(pubkey);
    return accountInfo.value.data.parsed.info;
  }
});
