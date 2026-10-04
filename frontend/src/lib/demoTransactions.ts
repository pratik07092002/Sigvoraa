/**
 * Pre-built unsigned transactions for one-click demoing. The backend's
 * simulateTransaction call always replaces the blockhash, so these stay
 * valid indefinitely.
 *
 * DEMO_DANGER_TX: a full-balance SPL Token approval against the seeded
 * devnet token account we already reported to the on-chain registry during
 * development -- so it now trips two independent rules at once
 * (unlimited_delegate_approval + known_bad_address_interaction), which
 * makes for a stronger demo than originally planned.
 *
 * DEMO_SAFE_TX: a trivial SOL transfer from a wallet created solely for
 * this demo and never used anywhere else. Deliberately isolated so no
 * future on-chain report can ever contaminate it the way the original
 * safe-demo transaction got contaminated by reusing the danger demo's
 * token account.
 */
export const DEMO_DANGER_TX =
  "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAIEpMcOqP2ti9KElUPZyH4nhhCY+6aXSay2KAEg/vIG17Bq320kN3gFJYE8GkNXYZlrW7zKxjxiN8H677AK0bTsAupzh89P/FMN8th7BqMq6jhZPEfh8GchuklY6zKTv1KnBt324ddloZPZy+FGzut5rBy0he1fWzeROoz1hX7/AKkXsVmpxrwkaDqb2Wsh2dHcTAWDq4QQpCM3qQ94nbDnaAEDAwECAAkEABCl1OgAAAA=";

export const DEMO_SAFE_TX =
  "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDXpic3Lk/MTmUWpuNT8HyxLqJOZHS4ZjyUtNDR2QZqMIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAnVqtB5oKvNSCBarDEztwa+Yaxil3GCQ+JqhUTC4y3NsBAgIAAQwCAAAA6AMAAAAAAAA=";
