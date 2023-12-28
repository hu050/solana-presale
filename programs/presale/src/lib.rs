use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{ Token, Transfer, Mint, TokenAccount, transfer }
};
use anchor_lang::solana_program::{program::invoke, system_instruction };
use std::mem::size_of;

declare_id!("J1g88rh5zyqG17AXAd66MUXTfRMa2sksR1wSDP6Ly3NC");

const PREFIX: &str = "aliensale";
const POOL_AUTH_PDA_SEED: &str = "pool-auth";
const SWAP_RATE: u64 = 3000000;
pub const DISCRIMINATOR_LENGTH: usize = 8;

#[program]
pub mod presale {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state_account = &mut ctx.accounts.state_account;

        state_account.owner = ctx.accounts.user_authority.key();
        Ok(())
    }

    pub fn deposit_sol(
        ctx: Context<DepositSOL>,
        amount: u64
    ) -> Result<()> {
        msg!("Deposit SOL");
        let sol_amount: u64 = **ctx.accounts.user_authority.lamports.borrow();
        require_gte!(sol_amount, amount, CommonError::InsufficientAmount);

        invoke(
            &system_instruction::transfer(
                ctx.accounts.user_authority.key,
                ctx.accounts.state_account.to_account_info().key,
                amount
            ),
            &[
                ctx.accounts.user_authority.to_account_info().clone(),
                ctx.accounts.state_account.to_account_info().clone(),
                ctx.accounts.system_program.to_account_info().clone()
            ]
        )?;

        let transfer_amount = amount * SWAP_RATE / 10;


        //--- Find PDA 
        let (program_pda, program_pda_bump) = find_pool_auth_pda();
    
        if program_pda != ctx.accounts.pool_authority.key() {
            return Err(CommonError::InvalidTokenAccountOwner.into());
        }

        let seeds = &[
            POOL_AUTH_PDA_SEED.as_bytes(),
            &[program_pda_bump]
        ];
        let signer = &[&seeds[..]];

        let pool_balance = ctx.accounts.pool_token.amount;
        require_gte!(pool_balance, transfer_amount, CommonError::InsufficientAmount);

        // Create the MintTo struct for our context 
        let cpi_accounts = Transfer { 
            from: ctx.accounts.pool_token.to_account_info(), 
            to: ctx.accounts.user_token_ata.to_account_info(), 
            authority: ctx.accounts.pool_authority.to_account_info(), 
        }; 
 
        let cpi_program = ctx.accounts.token_program.to_account_info(); 

        // Create the CpiContext we need for the request 
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer); 
 
        // Execute anchor's helper function to mint tokens 
        transfer(cpi_ctx, transfer_amount)?; 

        Ok(())
    }


    pub fn withdraw_sol(
        ctx: Context<WithdrawSOL>,
        amount: u64
    ) -> Result<()> {
        
        let state_account = &mut ctx.accounts.state_account;

        if state_account.owner != ctx.accounts.user_authority.key() {
            return Err(CommonError::InvalidOwner.into());
        }

        **ctx.accounts.state_account.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.user_authority.try_borrow_mut_lamports()? += amount;
        Ok(())
    }

    pub fn withdraw_token(
        ctx: Context<WithdrawToken>,
        amount: u64
    ) -> Result<()> {

        let state_account = &mut ctx.accounts.state_account;

        if state_account.owner != ctx.accounts.user_authority.key() {
            return Err(CommonError::InvalidOwner.into());
        }
        //--- Find PDA 
        let (program_pda, program_pda_bump) = find_pool_auth_pda();
    
        if program_pda != ctx.accounts.pool_authority.key() {
            return Err(CommonError::InvalidTokenAccountOwner.into());
        }

        let seeds = &[
            POOL_AUTH_PDA_SEED.as_bytes(),
            &[program_pda_bump]
        ];
        let signer = &[&seeds[..]];

        if program_pda != ctx.accounts.pool_authority.key() {
            return Err(CommonError::InvalidTokenAccountOwner.into());
        }

        // Create the MintTo struct for our context 
        let cpi_accounts = Transfer { 
            from: ctx.accounts.pool_token.to_account_info(), 
            to: ctx.accounts.user_token_ata.to_account_info(), 
            authority: ctx.accounts.pool_authority.to_account_info(), 
        }; 
 
        let cpi_program = ctx.accounts.token_program.to_account_info(); 

        // Create the CpiContext we need for the request 
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer); 
 
        // Execute anchor's helper function to mint tokens 
        transfer(cpi_ctx, amount)?; 

        Ok(())
    }
}

// return POOL auth PDA address
pub fn find_pool_auth_pda() -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[POOL_AUTH_PDA_SEED.as_bytes()],
        &ID,
    )
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    // Token program authority
    #[account(mut)]
    pub user_authority: Signer<'info>,
    // State Accounts
    #[account(
        init,
        seeds = [PREFIX.as_bytes()],
        bump,
        payer = user_authority,
        space = size_of::<StateAccount>() + DISCRIMINATOR_LENGTH
    )]
    pub state_account: Box<Account<'info, StateAccount>>,

    /// token_mint
    pub token_mint: Box<Account<'info, Mint>>,
    /// pool ATA
    #[account(init_if_needed,
        associated_token::mint = token_mint,
        associated_token::authority = pool_authority,
        payer = user_authority
    )]
    pub pool_ata: Box<Account<'info, TokenAccount>>,
    /// CHECK: this is safe. Pool auth
    #[account(mut, seeds = [POOL_AUTH_PDA_SEED.as_ref()], bump)]
    pub pool_authority: AccountInfo<'info>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
pub struct DepositSOL<'info> {
    #[account(mut)]
    pub user_authority: Signer<'info>,
    #[account(
        mut,
        seeds = [PREFIX.as_bytes()],
        bump
    )]
    pub state_account: Box<Account<'info, StateAccount>>,
    #[account(mut)]
    pub token_mint: Box<Account<'info, Mint>>,
    /// User Reward ATA
    #[account(
        init_if_needed,
        associated_token::mint = token_mint,
        associated_token::authority = user_authority,
        payer = user_authority
    )]
    pub user_token_ata: Box<Account<'info, TokenAccount>>,

    /// Pool Alien ATA
    #[account(mut, 
        constraint=pool_token.mint==token_mint.key() @CommonError::InvalidTokenAccountMint,
        constraint=pool_token.owner==pool_authority.key() @CommonError::InvalidTokenAccountOwner
    )]
    pub pool_token: Box<Account<'info, TokenAccount>>,
    /// CHECK: this is safe. Pool auth
    #[account(mut, seeds = [POOL_AUTH_PDA_SEED.as_ref()], bump)]
    pub pool_authority: AccountInfo<'info>,
    // Programs and Sysvars
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
pub struct WithdrawSOL<'info> {
    #[account(mut)]
    pub user_authority: Signer<'info>,
    #[account(
        mut,
        seeds = [PREFIX.as_bytes()],
        bump
    )]
    pub state_account: Box<Account<'info, StateAccount>>,
    // Programs and Sysvars
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawToken<'info> {
    #[account(mut)]
    pub user_authority: Signer<'info>,
    #[account(
        mut,
        seeds = [PREFIX.as_bytes()],
        bump
    )]
    pub state_account: Box<Account<'info, StateAccount>>,
    #[account(mut)]
    pub token_mint: Box<Account<'info, Mint>>,
    /// User Token ATA
    #[account(
        init_if_needed,
        associated_token::mint = token_mint,
        associated_token::authority = user_authority,
        payer = user_authority
    )]
    pub user_token_ata: Box<Account<'info, TokenAccount>>,

    /// Pool Alien ATA
    #[account(mut, 
        constraint=pool_token.mint==token_mint.key() @CommonError::InvalidTokenAccountMint,
        constraint=pool_token.owner==pool_authority.key() @CommonError::InvalidTokenAccountOwner
    )]
    pub pool_token: Box<Account<'info, TokenAccount>>,
    /// CHECK: this is safe. Pool auth
    #[account(mut, seeds = [POOL_AUTH_PDA_SEED.as_ref()], bump)]
    pub pool_authority: AccountInfo<'info>,
    // Programs and Sysvars
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>
}

#[account]
#[derive(Default)]
pub struct StateAccount {
    pub owner: Pubkey
}

#[error_code]
pub enum CommonError {
    // Insufficient funds
    #[msg("Insufficient funds")]
    InsufficientAmount,
    // Invalid Owner
    #[msg("Invalid Owner")]
    InvalidOwner,
    // Invalid Token Account Owner
    #[msg("Invalid Token Account Owner")]
    InvalidTokenAccountOwner,
    #[msg("Invalid Token Account Mint")]
    InvalidTokenAccountMint,
}