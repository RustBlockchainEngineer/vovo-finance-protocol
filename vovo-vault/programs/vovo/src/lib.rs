use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Transfer, ID};

use solana_program::{
    program::{ invoke},
};
use audaces_protocol::state::PositionType;

#[program]
pub mod vovo {
    use super::*;

    #[account]
    pub struct VovoData {
        pub authority: Pubkey,
        pub nonce: u8,
        pub token_mint: Pubkey,
        pub token_pool: Pubkey,
        pub withdraw_fee: u64,
        pub performance_fee: u64,
        pub leverage: u64,
        pub total_trade_profit: u64,

        // for Mercurial
        // pub mercurial_program_id:Pubkey,
        // pub mercurial_swap_account:Pubkey,
        // pub mercurial_token_program_id:Pubkey,
        // pub mercurial_pool_authority:Pubkey,
        // pub mercurial_transfer_authority:Pubkey,
        // pub mercurial_swap_token:Pubkey,
        // pub mercurial_pool_token_mint:Pubkey,
        // pub mercurial_source_token:Pubkey,
        // pub mercurial_lp_token:Pubkey,


        // pub mercurial_reward_token:Pubkey,

        // pub mercurial_withdraw_min_amount: u64
    }

    impl VovoData {
        pub fn new(
            ctx: Context<InitializeVovoData>, 
            nonce: u8, 
            withdraw_fee: u64, 
            performance_fee: u64, 
            leverage: u64, 
            total_trade_profit: u64,

            // mercurial_program_id:Pubkey,
            // mercurial_swap_account:Pubkey,
            // mercurial_token_program_id:Pubkey,
            // mercurial_pool_authority:Pubkey,
            // mercurial_transfer_authority:Pubkey,
            // mercurial_swap_token:Pubkey,
            // mercurial_pool_token_mint:Pubkey,
            // mercurial_source_token:Pubkey,
            // mercurial_lp_token:Pubkey,

            // mercurial_reward_token:Pubkey,

            // mercurial_withdraw_min_amount:u64

        ) -> Result<Self> {
            Ok(Self {
                authority: *ctx.accounts.authority.key,
                token_mint: *ctx.accounts.token_mint.key,
                token_pool: *ctx.accounts.token_pool_account.key,
                nonce,
                withdraw_fee,
                performance_fee,
                leverage,
                total_trade_profit,

                // mercurial_program_id,
                // mercurial_swap_account,
                // mercurial_token_program_id,
                // mercurial_pool_authority,
                // mercurial_transfer_authority,
                // mercurial_swap_token,
                // mercurial_pool_token_mint,
                // mercurial_source_token,
                // mercurial_lp_token,

                // mercurial_reward_token,

                // mercurial_withdraw_min_amount
            })
        }
        pub fn deposit(&mut self, ctx: Context<Deposit>, amount: u64)->Result<()>{
            
            // transfer from user to pool
            let cpi_accounts = Transfer {
                from: ctx.accounts.from.clone(),
                to: ctx.accounts.token_pool_account.to_account_info().clone(),
                authority: ctx.accounts.owner.clone(),
            };

            let cpi_program = ctx.accounts.token_program.clone();
            
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

            token::transfer(cpi_ctx, amount)?;

            ctx.accounts.user_info.deposit_balance += amount;

            Ok(())
        }
        pub fn withdraw(&mut self, ctx: Context<Withdraw>, amount: u64)->Result<()>{
            if ctx.accounts.user_info.deposit_balance <= 0 {
                return Err(ErrorCode::NoDepositedBalance.into());
            }
            
            let mut _amount = amount;
            if ctx.accounts.user_info.deposit_balance < amount {
                _amount = ctx.accounts.user_info.deposit_balance;
            }

            // withdraw from Mercurial
            // mercurial_withdraw()
            
            // transfer from pool to user
            let cpi_accounts = Transfer {
                from: ctx.accounts.token_pool_account.to_account_info().clone(),
                to: ctx.accounts.to.clone(),
                authority: ctx.accounts.pool_signer.clone(),
            };

            let seeds = &[
                ctx.accounts.vovo_data.token_mint.as_ref().clone(),
                &[ctx.accounts.vovo_data.nonce],
            ];
            let signer = &[&seeds[..]];

            let cpi_program = ctx.accounts.token_program.clone();
            
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts,signer);

            token::transfer(cpi_ctx, _amount)?;

            ctx.accounts.user_info.deposit_balance -= _amount;

            Ok(())
        }
        pub fn add_reward(&mut self, ctx: Context<AddReward>, amount: u64)->Result<()>{
            
            // transfer from user to pool
            let cpi_accounts = Transfer {
                from: ctx.accounts.from.clone(),
                to: ctx.accounts.token_reward_account.to_account_info().clone(),
                authority: ctx.accounts.owner.clone(),
            };

            let cpi_program = ctx.accounts.token_program.clone();
            
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

            token::transfer(cpi_ctx, amount)?;

            Ok(())
        }
        pub fn mercurial_deposit(&mut self, ctx: Context<MercurialDeposit>, amount: u64,min_mint_amount:u64)->Result<()>{
            
            let ix = mercurial_stable_swap_n_pool_instructions::instruction::add_liquidity(
                ctx.accounts.mercurial_program.key,
                ctx.accounts.mercurial_swap_account.key,
                ctx.accounts.mercurial_token_program_id.key,
                ctx.accounts.mercurial_pool_authority.key,
                ctx.accounts.mercurial_transfer_authority.key,
                vec![ctx.accounts.mercurial_swap_token.key],
                ctx.accounts.mercurial_pool_token_mint.key,
                vec![ctx.accounts.mercurial_source_token.key],
                ctx.accounts.mercurial_lp_token.key,
                vec![amount],
                min_mint_amount
            )?;

            invoke(
                &ix,
                &[
                    ctx.accounts.mercurial_swap_account.clone(), 
                    ctx.accounts.mercurial_token_program_id.clone(), 
                    ctx.accounts.mercurial_pool_authority.clone(), 
                    ctx.accounts.mercurial_transfer_authority.clone(),
                    ctx.accounts.mercurial_swap_token.clone(),
                    ctx.accounts.mercurial_pool_token_mint.clone(),
                    ctx.accounts.mercurial_source_token.clone(),
                    ctx.accounts.mercurial_lp_token.clone()
                    ],
            )?;

            Ok(())
        }
        pub fn mercurial_withdraw(&mut self, ctx: Context<MercurialWithdraw>, amount: u64,  mercurial_withdraw_min_amount:u64)->Result<()>{
            
            let ix = mercurial_stable_swap_n_pool_instructions::instruction::remove_liquidity(
                ctx.accounts.mercurial_program.key,
                ctx.accounts.mercurial_swap_account.key,
                ctx.accounts.mercurial_token_program_id.key,
                ctx.accounts.mercurial_pool_authority.key,
                ctx.accounts.mercurial_transfer_authority.key,
                vec![ctx.accounts.mercurial_swap_token.key],
                ctx.accounts.mercurial_pool_token_mint.key,
                vec![ctx.accounts.mercurial_dest_token.key],
                ctx.accounts.mercurial_lp_token.key,
                amount,
                vec![mercurial_withdraw_min_amount]
            )?;

            invoke(
                &ix,
                &[
                    ctx.accounts.mercurial_swap_account.clone(), 
                    ctx.accounts.mercurial_token_program_id.clone(), 
                    ctx.accounts.mercurial_pool_authority.clone(), 
                    ctx.accounts.mercurial_transfer_authority.clone(),
                    ctx.accounts.mercurial_swap_token.clone(),
                    ctx.accounts.mercurial_pool_token_mint.clone(),
                    ctx.accounts.mercurial_dest_token.clone(),
                    ctx.accounts.mercurial_lp_token.clone()
                    ],
            )?;

            Ok(())
        }
        pub fn mercurial_exchange(&mut self, ctx: Context<MercurialExchange>, amount: u64,min_out_amount: u64)->Result<()>{
            
            let ix = mercurial_stable_swap_n_pool_instructions::instruction::exchange(
                ctx.accounts.mercurial_program.key,
                ctx.accounts.mercurial_swap_account.key,
                ctx.accounts.mercurial_token_program_id.key,
                ctx.accounts.mercurial_pool_authority.key,
                ctx.accounts.mercurial_transfer_authority.key,
                vec![ctx.accounts.mercurial_swap_token.key],
                ctx.accounts.mercurial_source_token.key,
                ctx.accounts.mercurial_dest_token.key,
                amount,
                min_out_amount,
            )?;

            invoke(
                &ix,
                &[
                    ctx.accounts.mercurial_swap_account.clone(), 
                    ctx.accounts.mercurial_token_program_id.clone(), 
                    ctx.accounts.mercurial_pool_authority.clone(), 
                    ctx.accounts.mercurial_transfer_authority.clone(),
                    ctx.accounts.mercurial_swap_token.clone(),
                    ctx.accounts.mercurial_source_token.clone(),
                    ctx.accounts.mercurial_dest_token.clone(),
                    ],
            )?;

            Ok(())
        }
        pub fn bonfida_poke(
            &mut self, 
            ctx: Context<Poke>,
            closing_collateral: u64,
            closing_v_coin: u64,
            position_index: u16,
            predicted_entry_price: u64,
            maximum_slippage_margin: u64,

            budget_amount: u64,

            side: u8, 
            instance_index: u8, 
            collateral: u64, 
            leverage: u64, 
        )->Result<()>{

            // close position
            let mut ix = audaces_protocol::instruction::cpi::close_position
            (
                *ctx.accounts.audaces_protocol_program_id.key,
                *ctx.accounts.market_account.key,
                *ctx.accounts.market_signer_account.key,
                *ctx.accounts.market_vault.key,
                *ctx.accounts.oracle_account.key,
                *ctx.accounts.instance_account.key,
                *ctx.accounts.user_account.key,
                *ctx.accounts.user_account_owner.key,
                *ctx.accounts.bonfida_bnb.key,
                &vec![*ctx.accounts.memory_page.key],
                closing_collateral,
                closing_v_coin,
                position_index,
                predicted_entry_price,
                maximum_slippage_margin,
                None, 
                None,
            );

            invoke(
                &ix, 
                &[
                    ctx.accounts.token_program.clone(),
                    ctx.accounts.clock_sysvar.clone(),
                    ctx.accounts.market_account.clone(),
                    ctx.accounts.instance_account.clone(),
                    ctx.accounts.market_signer_account.clone(),
                    ctx.accounts.market_vault.clone(),
                    ctx.accounts.bonfida_bnb.clone(),
                    ctx.accounts.oracle_account.clone(),
                    ctx.accounts.user_account_owner.clone(),
                    ctx.accounts.user_account.clone(),
                    ctx.accounts.trade_label.clone(),
                    ctx.accounts.memory_page.clone(),
                ]
            )?;

            ix = audaces_protocol::instruction::cpi::add_budget(
                *ctx.accounts.audaces_protocol_program_id.key,
                *ctx.accounts.market_account.key,
                *ctx.accounts.market_vault.key,
                budget_amount, 
                *ctx.accounts.source_owner.key,
                *ctx.accounts.source_token_account.key,
                *ctx.accounts.open_positions_account.key,
            );

            invoke(
                &ix, 
                &[
                    ctx.accounts.token_program.clone(),
                    ctx.accounts.market_account.clone(),
                    ctx.accounts.market_signer_account.clone(),
                    ctx.accounts.market_vault.clone(),
                    ctx.accounts.open_positions_account.clone(),
                    ctx.accounts.source_owner.clone(),
                    ctx.accounts.source_token_account.clone(),
                ]
            )?;

            let _side = if side == 0 { PositionType::Short} else {PositionType::Long};

            ix = audaces_protocol::instruction::cpi::open_position(
                *ctx.accounts.audaces_protocol_program_id.key,
                *ctx.accounts.market_account.key,
                *ctx.accounts.market_signer_account.key,
                *ctx.accounts.market_vault.key,
                *ctx.accounts.oracle_account.key,
                *ctx.accounts.instance_account.key,
                *ctx.accounts.user_account.key,
                *ctx.accounts.user_account_owner.key,
                *ctx.accounts.bonfida_bnb.key,
                &vec![*ctx.accounts.memory_page.key],
                _side,
                instance_index,
                collateral,
                leverage,
                predicted_entry_price,
                maximum_slippage_margin,
                None,
                None
            );

            invoke(
                &ix, 
                &[
                    ctx.accounts.token_program.clone(),
                    ctx.accounts.clock_sysvar.clone(),
                    ctx.accounts.market_account.clone(),
                    ctx.accounts.instance_account.clone(),
                    ctx.accounts.market_signer_account.clone(),
                    ctx.accounts.market_vault.clone(),
                    ctx.accounts.bonfida_bnb.clone(),
                    ctx.accounts.user_account_owner.clone(),
                    ctx.accounts.user_account.clone(),
                    ctx.accounts.trade_label.clone(),
                    ctx.accounts.oracle_account.clone(),
                    ctx.accounts.memory_page.clone(),
                ]
            )?;

            Ok(())
        }
    }
    
    #[account]
    pub struct UserInfo {
        owner: Pubkey,
        deposit_balance: u64,
    }

    impl UserInfo {
        pub fn new(ctx: Context<InitializeUserInfo>) -> Result<Self> {
            Ok(Self {
                owner:*ctx.accounts.owner.key,
                deposit_balance: 0
            })
        }
    }
}

#[derive(Accounts)]
pub struct InitializeVovoData<'info> {
    #[account(signer)]
    authority: AccountInfo<'info>,
    token_mint: AccountInfo<'info>,
    token_pool_account: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    vovo_data: ProgramAccount<'info, VovoData>,
    user_info: ProgramAccount<'info, UserInfo>,
    #[account(mut)]
    from: AccountInfo<'info>,
    token_pool_account: Account<'info, TokenAccount>,
    owner: AccountInfo<'info>,
    #[account("token_program.key == &token::ID")]
    token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    vovo_data: ProgramAccount<'info, VovoData>,
    user_info: ProgramAccount<'info, UserInfo>,
    #[account(mut)]
    to: AccountInfo<'info>,
    token_pool_account: Account<'info, TokenAccount>,
    pool_signer: AccountInfo<'info>,
    owner: AccountInfo<'info>,
    #[account("token_program.key == &token::ID")]
    token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct AddReward<'info> {
    vovo_data: ProgramAccount<'info, VovoData>,
    #[account(mut)]
    from: AccountInfo<'info>,
    token_reward_account: Account<'info, TokenAccount>,
    owner: AccountInfo<'info>,
    #[account("token_program.key == &token::ID")]
    token_program: AccountInfo<'info>,
}
#[derive(Accounts)]
pub struct MercurialDeposit<'info> {
    token_program: AccountInfo<'info>,
    vovo_data: ProgramAccount<'info, VovoData>,

    mercurial_program:AccountInfo<'info>,
    mercurial_swap_account:AccountInfo<'info>,
    mercurial_token_program_id:AccountInfo<'info>,
    mercurial_pool_authority:AccountInfo<'info>,
    mercurial_transfer_authority:AccountInfo<'info>,
    mercurial_swap_token:AccountInfo<'info>,
    mercurial_pool_token_mint:AccountInfo<'info>,
    mercurial_source_token:AccountInfo<'info>,
    mercurial_lp_token:AccountInfo<'info>,
}
#[derive(Accounts)]
pub struct MercurialWithdraw<'info> {
    token_program: AccountInfo<'info>,
    vovo_data: ProgramAccount<'info, VovoData>,

    mercurial_program:AccountInfo<'info>,
    mercurial_swap_account:AccountInfo<'info>,
    mercurial_token_program_id:AccountInfo<'info>,
    mercurial_pool_authority:AccountInfo<'info>,
    mercurial_transfer_authority:AccountInfo<'info>,
    mercurial_swap_token:AccountInfo<'info>,
    mercurial_pool_token_mint:AccountInfo<'info>,
    mercurial_dest_token:AccountInfo<'info>,
    mercurial_lp_token:AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct MercurialExchange<'info> {
    token_program: AccountInfo<'info>,
    vovo_data: ProgramAccount<'info, VovoData>,

    mercurial_program:AccountInfo<'info>,
    mercurial_swap_account:AccountInfo<'info>,
    mercurial_token_program_id:AccountInfo<'info>,
    mercurial_pool_authority:AccountInfo<'info>,
    mercurial_transfer_authority:AccountInfo<'info>,
    mercurial_swap_token:AccountInfo<'info>,
    mercurial_pool_token_mint:AccountInfo<'info>,
    mercurial_source_token:AccountInfo<'info>,
    mercurial_dest_token:AccountInfo<'info>,
}


#[derive(Accounts)]
pub struct Poke<'info> {
    token_program: AccountInfo<'info>,
    vovo_data: ProgramAccount<'info, VovoData>,
    
    audaces_protocol_program_id: AccountInfo<'info>,
    market_account: AccountInfo<'info>,
    market_signer_account: AccountInfo<'info>,
    market_vault: AccountInfo<'info>,
    oracle_account: AccountInfo<'info>,
    instance_account: AccountInfo<'info>,
    user_account: AccountInfo<'info>,
    user_account_owner: AccountInfo<'info>,
    bonfida_bnb: AccountInfo<'info>,
    memory_page: AccountInfo<'info>,

    source_owner: AccountInfo<'info>,
    source_token_account: AccountInfo<'info>,
    open_positions_account: AccountInfo<'info>,

    clock_sysvar: AccountInfo<'info>,
    trade_label: AccountInfo<'info>,
}
#[derive(Accounts)]
pub struct InitializeUserInfo<'info> {
    owner: AccountInfo<'info>,
}

#[error]
pub enum ErrorCode {
    #[msg("Incorrect Option Owner")]
    IncorrectOwner,
    #[msg("Incorrect current price")]
    IncorrectCurrentPrice,
    #[msg("no deposited balance")]
    NoDepositedBalance,
}
