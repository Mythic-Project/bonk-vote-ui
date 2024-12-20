export type VsrIdl = {
  "metadata": {
    "version": "0.2.4",
    "name": "voter_stake_registry",
    "spec": "none"
  },
  "instructions": [
    {
      "name": "withdraw",
      "discriminator": [
        183,  18,  70, 156,
        148, 109, 161,  34
      ],      
      "accounts": [
        {
          "name": "registrar",
          "writable": false,
          "signer": false
        },
        {
          "name": "voter",
          "writable": true,
          "signer": false
        },
        {
          "name": "voterAuthority",
          "writable": false,
          "signer": true
        },
        {
          "name": "tokenOwnerRecord",
          "writable": false,
          "signer": false
        },
        {
          "name": "voterWeightRecord",
          "writable": true,
          "signer": false
        },
        {
          "name": "vault",
          "writable": true,
          "signer": false
        },
        {
          "name": "destination",
          "writable": true,
          "signer": false
        },
        {
          "name": "tokenProgram",
          "writable": false,
          "signer": false
        }
      ],
      "args": [
        {
          "name": "depositEntryIndex",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "closeVoter",
      "discriminator": [
        117,  35, 234,
        247, 206, 131,
        182, 149
      ],
      "accounts": [
        {
          "name": "registrar",
          "writable": false,
          "signer": false
        },
        {
          "name": "voter",
          "writable": true,
          "signer": false
        },
        {
          "name": "voterAuthority",
          "writable": false,
          "signer": true
        },
        {
          "name": "solDestination",
          "writable": true,
          "signer": false
        },
        {
          "name": "tokenProgram",
          "writable": false,
          "signer": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "voter",
      "discriminator": [
        241,  93, 35, 191,
        254, 147, 17, 202
      ]     
    },
    {
      "name": "registrar",
      "discriminator": [
        193, 202, 205,  51,
        78, 168, 150, 128
      ]
    }
  ],
  "types": [
    {
      "name": "voter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "voterAuthority",
            "type": "pubkey"
          },
          {
            "name": "registrar",
            "type": "pubkey"
          },
          {
            "name": "deposits",
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "DepositEntry"
                  }
                },
                32
              ]
            }
          },
          {
            "name": "voterBump",
            "type": "u8"
          },
          {
            "name": "voterWeightRecordBump",
            "type": "u8"
          },
          {
            "name": "reserved",
            "type": {
              "array": [
                "u8",
                94
              ]
            }
          }
        ]
      }
    },
    {
      "name": "DepositEntry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lockup",
            "type": {
              "defined": {
                "name": "Lockup"
              }
            }
          },
          {
            "name": "amountDepositedNative",
            "type": "u64"
          },
          {
            "name": "amountInitiallyLockedNative",
            "type": "u64"
          },
          {
            "name": "isUsed",
            "type": "bool"
          },
          {
            "name": "allowClawback",
            "type": "bool"
          },
          {
            "name": "votingMintConfigIdx",
            "type": "u8"
          },
          {
            "name": "reserved",
            "type": {
              "array": ["u8", 29]
            }
          }
        ]
      }
    },
    {
      "name": "Lockup",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "startTs",
            "type": "i64"
          },
          {
            "name": "endTs",
            "type": "i64"
          },
          {
            "name": "kind",
            "type": {
              "defined": {
                "name": "LockupKind"
              }
            }
          },
          {
            "name": "reserved",
            "type": {
              "array": ["u8", 15]
            }
          }
        ]
      }
    },
    {
      "name": "LockupKind",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "None"
          },
          {
            "name": "Daily"
          },
          {
            "name": "Monthly"
          },
          {
            "name": "Cliff"
          },
          {
            "name": "Constant"
          }
        ]
      }
    },
    {
      "name": "registrar",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "governanceProgramId",
            "type": "pubkey"
          },
          {
            "name": "realm",
            "type": "pubkey"
          },
          {
            "name": "realmGoverningTokenMint",
            "type": "pubkey"
          },
          {
            "name": "realmAuthority",
            "type": "pubkey"
          },
          {
            "name": "reserved1",
            "type": {
              "array": ["u8", 32]
            }
          },
          {
            "name": "votingMints",
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "VotingMintConfig"
                  }
                },
                4
              ]
            }
          },
          {
            "name": "timeOffset",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "reserved2",
            "type": {
              "array": ["u8", 7]
            }
          },
          {
            "name": "reserved3",
            "type": {
              "array": ["u64", 11]
            }
          }
        ]
      }
    },
    {
      "name": "VotingMintConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "grantAuthority",
            "type": "pubkey"
          },
          {
            "name": "baselineVoteWeightScaledFactor",
            "type": "u64"
          },
          {
            "name": "maxExtraLockupVoteWeightScaledFactor",
            "type": "u64"
          },
          {
            "name": "lockupSaturationSecs",
            "type": "u64"
          },
          {
            "name": "digitShift",
            "type": "i8"
          },
          {
            "name": "reserved1",
            "type": {
              "array": ["u8", 7]
            }
          },
          {
            "name": "reserved2",
            "type": {
              "array": ["u64", 7]
            }
          }
        ]
      }
    }
  ],
  "address": "vsr2nfGVNHmSY8uxoBGqq8AQbwz3JwaEaHqGbsTPXqQ"
}