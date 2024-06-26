use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, TokenAccount, Transfer};

declare_id!("qaie7m2JcNLGsW8tY3XtERp63BxYHf9GYiJAA43dGHi");

#[program]
pub mod whitelist_token {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let whitelist = &mut ctx.accounts.whitelist;
        whitelist.authority = *ctx.accounts.authority.key;
        Ok(())
    }

    pub fn add_to_whitelist(ctx: Context<ManageWhitelist>, address: Pubkey) -> Result<()> {
        let whitelist = &mut ctx.accounts.whitelist;
        require!(whitelist.authority == *ctx.accounts.authority.key, Unauthorized);
        whitelist.addresses.push(address);
        Ok(())
    }

    pub fn remove_from_whitelist(ctx: Context<ManageWhitelist>, address: Pubkey) -> Result<()> {
        let whitelist = &mut ctx.accounts.whitelist;
        require!(whitelist.authority == *ctx.accounts.authority.key, Unauthorized);
        whitelist.addresses.retain(|&x| x != address);
        Ok(())
    }

    pub fn transfer(ctx: Context<TransferContext>, amount: u64) -> Result<()> {
        let whitelist = &ctx.accounts.whitelist;
        require!(whitelist.addresses.contains(ctx.accounts.from.key), Unauthorized);
        require!(whitelist.addresses.contains(ctx.accounts.to.key), Unauthorized);

        let cpi_accounts = Transfer {
            from: ctx.accounts.from.to_account_info(),
            to: ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(ctx.accounts.into(), amount)
    }
}

#[account]
pub struct Whitelist {
    pub authority: Pubkey,
    pub addresses: Vec<Pubkey>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 32 * 100)]
    pub whitelist: Account<'info, Whitelist>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ManageWhitelist<'info> {
    #[account(mut)]
    pub whitelist: Account<'info, Whitelist>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct TransferContext<'info> {
    #[account(mut)]
    pub whitelist: Account<'info, Whitelist>,
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
