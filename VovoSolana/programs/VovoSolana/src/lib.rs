use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Transfer, ID};

use solana_program::{
    program::{ invoke, invoke_signed},
};
use audaces_protocol::state::PositionType;

mod utils;
use utils::*;

#[program]
pub mod vovo {
    use super::*;

    #[state]
    pub struct VovoData {
        pub authority: Pubkey,
        pub nonce: u8,
        pub token_mint: Pubkey,
        pub token_pool: Pubkey,
        pub withdraw_fee: u64,
        pub performance_fee: u64,
        pub leverage: u64,
        pub total_trade_profit: u64,

        pub mer_reward_token:Pubkey,
        pub usdc_reward_token:Pubkey,

        pub mercurial_lp_token:Pubkey,

        pub bonfida_user_account:Pubkey,


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
            user_account_size: u64,

            mer_reward_token:Pubkey,
            usdc_reward_token:Pubkey,

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

                mer_reward_token,
                usdc_reward_token,

                bonfida_user_account:*ctx.accounts.bonfida_user_account.key,
                mercurial_lp_token:*ctx.accounts.authority.key //temp

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
        pub fn withdraw(&mut self, ctx: Context<Withdraw>, amount: u64, mercurial_withdraw_min_amount:u64)->Result<()>{

            if ctx.accounts.user_info.deposit_balance <= 0 {
                return Err(ErrorCode::NoDepositedBalance.into());
            }
            
            let mut _amount = amount;
            if ctx.accounts.user_info.deposit_balance < amount {
                _amount = ctx.accounts.user_info.deposit_balance;
            }

            // withdraw from Mercurial
            let ix = mercurial_stable_swap_n_pool_instructions::instruction::remove_liquidity(
                ctx.accounts.mercurial_program.key,
                ctx.accounts.mercurial_swap_account.key,
                ctx.accounts.mercurial_token_program_id.key,
                ctx.accounts.mercurial_pool_authority.key,
                ctx.accounts.mercurial_transfer_authority.key,
                vec![ctx.accounts.mercurial_swap_token.key],
                ctx.accounts.mercurial_pool_token_mint.key,
                vec![&ctx.accounts.token_pool_account.key()],
                ctx.accounts.mercurial_lp_token.key,
                _amount,
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
                    ctx.accounts.token_pool_account.to_account_info().clone(),
                    ctx.accounts.mercurial_lp_token.clone()
                    ],
            )?;

            
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
        
        pub fn earn(&mut self, ctx: Context<Earn>,min_mint_amount:u64)->Result<()>{
            
            let ix = mercurial_stable_swap_n_pool_instructions::instruction::add_liquidity(
                ctx.accounts.mercurial_program.key,
                ctx.accounts.mercurial_swap_account.key,
                ctx.accounts.mercurial_token_program_id.key,
                ctx.accounts.mercurial_pool_authority.key,
                ctx.accounts.mercurial_transfer_authority.key,
                vec![ctx.accounts.mercurial_swap_token.key, None, None],
                ctx.accounts.mercurial_pool_token_mint.key,
                vec![&ctx.accounts.token_pool.key(), None, None],
                ctx.accounts.mercurial_lp_token.key,
                vec![ctx.accounts.token_pool.amount, 0, 0],
                min_mint_amount
            )?;

            invoke_signed(
                &ix,
                &[
                    ctx.accounts.mercurial_swap_account.clone(), 
                    ctx.accounts.mercurial_token_program_id.clone(), 
                    ctx.accounts.mercurial_pool_authority.clone(), 
                    ctx.accounts.mercurial_transfer_authority.clone(),
                    ctx.accounts.mercurial_swap_token.clone(),
                    ctx.accounts.mercurial_pool_token_mint.clone(),
                    ctx.accounts.token_pool.to_account_info().clone(),
                    ctx.accounts.mercurial_lp_token.clone()
                ],
                &[
                    &[
                        ctx.program_id.as_ref(),
                        &[ctx.accounts.vovo_data.nonce]
                    ]
                ]
                
            )?;

            ctx.accounts.vovo_data.mercurial_lp_token = *ctx.accounts.mercurial_lp_token.key;

            Ok(())
        }
        
        pub fn bonfida_poke(
            &mut self, 
            ctx: Context<Poke>,
            min_out_amount: u64,

            closing_collateral: u64,
            closing_v_coin: u64,
            position_index: u16,
            predicted_entry_price: u64,
            maximum_slippage_margin: u64,

            side: u8, 
            instance_index: u8, 
            collateral: u64, 
            leverage: u64, 
        )->Result<()>{

            // swap reward to USDC
            let ix = mercurial_stable_swap_n_pool_instructions::instruction::exchange(
                ctx.accounts.mercurial_program.key,
                ctx.accounts.mercurial_swap_account.key,
                ctx.accounts.mercurial_token_program_id.key,
                ctx.accounts.mercurial_pool_authority.key,
                ctx.accounts.mercurial_transfer_authority.key,
                vec![ctx.accounts.mercurial_swap_token.key],
                &ctx.accounts.mer_reward_token.key(),
                &ctx.accounts.usdc_reward_token.key(),
                ctx.accounts.mer_reward_token.amount,
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
                    ctx.accounts.mer_reward_token.to_account_info().clone(),
                    ctx.accounts.usdc_reward_token.to_account_info().clone(),
                    ],
            )?;

            // close position
            let mut ix = audaces_protocol::instruction::cpi::close_position
            (
                *ctx.accounts.audaces_protocol_program_id.key,
                *ctx.accounts.market_account.key,
                *ctx.accounts.market_signer_account.key,
                ctx.accounts.market_vault.key(),
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
                    ctx.accounts.market_vault.to_account_info().clone(),
                    ctx.accounts.bonfida_bnb.clone(),
                    ctx.accounts.oracle_account.clone(),
                    ctx.accounts.user_account_owner.clone(),
                    ctx.accounts.user_account.clone(),
                    ctx.accounts.trade_label.clone(),
                    ctx.accounts.memory_page.clone(),
                ]
            )?;

            ix = audaces_protocol::instruction::cpi::withdraw_budget(
                *ctx.accounts.audaces_protocol_program_id.key,
                *ctx.accounts.market_account.key,
                *ctx.accounts.market_signer_account.key,
                ctx.accounts.market_vault.key(),
                ctx.accounts.market_vault.amount,
                *ctx.accounts.target_account.key,
                *ctx.accounts.open_positions_owner_account.key,
                *ctx.accounts.open_positions_account.key,
            );

            invoke(
                &ix, 
                &[
                    ctx.accounts.token_program.clone(),
                    ctx.accounts.market_account.clone(),
                    ctx.accounts.market_signer_account.clone(),
                    ctx.accounts.market_vault.to_account_info().clone(),
                    ctx.accounts.open_positions_account.clone(),
                    ctx.accounts.source_owner.clone(),
                    ctx.accounts.source_token_account.clone(),
                ]
            )?;

            ix = audaces_protocol::instruction::cpi::add_budget(
                *ctx.accounts.audaces_protocol_program_id.key,
                *ctx.accounts.market_account.key,
                ctx.accounts.market_vault.key(),
                ctx.accounts.usdc_reward_token.amount, 
                *ctx.accounts.source_owner.key,
                *ctx.accounts.source_token_account.key,
                *ctx.accounts.open_positions_account.key,
            );

            invoke(
                &ix, 
                &[
                    ctx.accounts.token_program.clone(),
                    ctx.accounts.market_account.clone(),
                    ctx.accounts.market_vault.to_account_info().clone(),
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
                ctx.accounts.market_vault.key(),
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
                    ctx.accounts.market_vault.to_account_info().clone(),
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
    pub fn create_user(ctx: Context<CreateUser>, nonce: u8)->ProgramResult{
        ctx.accounts.user_info.owner = *ctx.accounts.owner.key;
        ctx.accounts.user_info.deposit_balance = 0;
        ctx.accounts.user_info.bump = nonce;
        Ok(())
    }
}

#[account]
#[derive(Default)]
pub struct UserInfo {
    owner: Pubkey,
    deposit_balance: u64,
    bump: u8
}

#[derive(Accounts)]
pub struct InitializeVovoData<'info> {
    #[account(signer)]
    authority: AccountInfo<'info>,
    token_mint: AccountInfo<'info>,
    token_pool_account: AccountInfo<'info>,

    bonfida_program_id: AccountInfo<'info>,
    bonfida_user_account: AccountInfo<'info>,

}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    user_info: ProgramAccount<'info, UserInfo>,
    #[account(mut)]
    from: AccountInfo<'info>,
    #[account(mut)]
    token_pool_account: Account<'info, TokenAccount>,
    #[account(signer)]
    owner: AccountInfo<'info>,
    #[account("token_program.key == &token::ID")]
    token_program: AccountInfo<'info>,
}


#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct CreateUser<'info> {
    #[account(
    init,
    seeds = [b"vovo-user-seed", owner.key.as_ref()],
    bump = bump,
    payer = owner,
    )] 
    user_info: ProgramAccount<'info, UserInfo>,
    owner: AccountInfo<'info>,
    rent: Sysvar<'info, Rent>,
    system_program: AccountInfo<'info>,
}
#[derive(Accounts)]
pub struct Withdraw<'info> {
    vovo_data: ProgramAccount<'info, VovoData>,
    #[account(mut)]
    user_info: ProgramAccount<'info, UserInfo>,
    #[account(mut)]
    to: AccountInfo<'info>,
    token_pool_account: Account<'info, TokenAccount>,
    pool_signer: AccountInfo<'info>,
    owner: AccountInfo<'info>,
    #[account("token_program.key == &token::ID")]
    token_program: AccountInfo<'info>,

    mercurial_program:AccountInfo<'info>,
    mercurial_swap_account:AccountInfo<'info>,
    mercurial_token_program_id:AccountInfo<'info>,
    mercurial_pool_authority:AccountInfo<'info>,
    mercurial_transfer_authority:AccountInfo<'info>,
    mercurial_swap_token:AccountInfo<'info>,
    mercurial_pool_token_mint:AccountInfo<'info>,
    mercurial_lp_token:AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Earn<'info> {
    token_program: AccountInfo<'info>,
    #[account(mut)]
    vovo_data: ProgramAccount<'info, VovoData>,

    mercurial_program:AccountInfo<'info>,
    #[account(mut)]
    mercurial_swap_account:AccountInfo<'info>,
    mercurial_token_program_id:AccountInfo<'info>,
    mercurial_pool_authority:AccountInfo<'info>,
    mercurial_transfer_authority:AccountInfo<'info>,
    #[account(mut)]
    mercurial_swap_token:AccountInfo<'info>,
    #[account(mut)]
    mercurial_pool_token_mint:AccountInfo<'info>,
    #[account(mut)]
    token_pool:Account<'info, TokenAccount>,
    #[account(mut)]
    mercurial_lp_token:AccountInfo<'info>,
}
#[derive(Accounts)]
pub struct MercurialWithdraw<'info> {
    token_program: AccountInfo<'info>,
    vovo_data: ProgramAccount<'info, VovoData>,

    
}


#[derive(Accounts)]
pub struct Poke<'info> {
    token_program: AccountInfo<'info>,
    vovo_data: ProgramAccount<'info, VovoData>,

    mercurial_program:AccountInfo<'info>,
    mercurial_swap_account:AccountInfo<'info>,
    mercurial_token_program_id:AccountInfo<'info>,
    mercurial_pool_authority:AccountInfo<'info>,
    mercurial_transfer_authority:AccountInfo<'info>,
    mercurial_swap_token:AccountInfo<'info>,
    mercurial_pool_token_mint:AccountInfo<'info>,
    mer_reward_token:Account<'info, TokenAccount>,
    usdc_reward_token:Account<'info, TokenAccount>,
    
    audaces_protocol_program_id: AccountInfo<'info>,
    market_account: AccountInfo<'info>,
    market_signer_account: AccountInfo<'info>,
    market_vault: Account<'info, TokenAccount>,
    target_account: AccountInfo<'info>,
    open_positions_owner_account: AccountInfo<'info>,
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
