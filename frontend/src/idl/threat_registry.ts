/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/threat_registry.json`.
 */
export type ThreatRegistry = {
  "address": "Cy4jqUsSnq2Z9rK2Lv7FtkkdziXN7ZBRNGKC5edkbnBU",
  "metadata": {
    "name": "threatRegistry",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Sigvoraa on-chain Threat Registry"
  },
  "instructions": [
    {
      "name": "addReporter",
      "discriminator": [
        158,
        153,
        12,
        6,
        217,
        41,
        252,
        157
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "reporterAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  112,
                  111,
                  114,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "arg",
                "path": "newReporter"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "newReporter",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "clearThreat",
      "discriminator": [
        17,
        98,
        93,
        133,
        2,
        179,
        41,
        16
      ],
      "accounts": [
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "threatEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  104,
                  114,
                  101,
                  97,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "target"
              }
            ]
          }
        },
        {
          "name": "signer",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "target",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "disputeThreat",
      "discriminator": [
        207,
        22,
        22,
        80,
        32,
        56,
        78,
        35
      ],
      "accounts": [
        {
          "name": "threatEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  104,
                  114,
                  101,
                  97,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "target"
              }
            ]
          }
        },
        {
          "name": "disputer",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "target",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "initializeRegistry",
      "discriminator": [
        189,
        181,
        20,
        17,
        174,
        57,
        249,
        59
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "removeReporter",
      "discriminator": [
        165,
        229,
        140,
        210,
        40,
        24,
        27,
        34
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "reporterAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  112,
                  111,
                  114,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "arg",
                "path": "reporter"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "config"
          ]
        }
      ],
      "args": [
        {
          "name": "reporter",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "reportThreat",
      "discriminator": [
        248,
        73,
        90,
        46,
        239,
        83,
        2,
        61
      ],
      "accounts": [
        {
          "name": "threatEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  104,
                  114,
                  101,
                  97,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "target"
              }
            ]
          }
        },
        {
          "name": "reporterAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  112,
                  111,
                  114,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "reporter"
              }
            ]
          }
        },
        {
          "name": "reporter",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "target",
          "type": "pubkey"
        },
        {
          "name": "category",
          "type": {
            "defined": {
              "name": "threatCategory"
            }
          }
        },
        {
          "name": "severity",
          "type": "u8"
        },
        {
          "name": "evidenceHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "registryConfig",
      "discriminator": [
        23,
        118,
        10,
        246,
        173,
        231,
        243,
        156
      ]
    },
    {
      "name": "reporter",
      "discriminator": [
        233,
        37,
        148,
        250,
        155,
        158,
        118,
        161
      ]
    },
    {
      "name": "threatEntry",
      "discriminator": [
        148,
        237,
        14,
        147,
        245,
        185,
        167,
        16
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Only the registry authority can perform this action"
    },
    {
      "code": 6001,
      "name": "reporterCountOverflow",
      "msg": "Reporter count overflow"
    },
    {
      "code": 6002,
      "name": "invalidSeverity",
      "msg": "Severity must be between 0 and 100"
    },
    {
      "code": 6003,
      "name": "invalidStatus",
      "msg": "Threat entry is not in the expected status for this action"
    }
  ],
  "types": [
    {
      "name": "registryConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "reporterCount",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "reporter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "reporter",
            "type": "pubkey"
          },
          {
            "name": "reputation",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "threatCategory",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "drainer"
          },
          {
            "name": "rugPull"
          },
          {
            "name": "maliciousProgram"
          },
          {
            "name": "phishing"
          },
          {
            "name": "other"
          }
        ]
      }
    },
    {
      "name": "threatEntry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "target",
            "type": "pubkey"
          },
          {
            "name": "category",
            "type": {
              "defined": {
                "name": "threatCategory"
              }
            }
          },
          {
            "name": "severity",
            "type": "u8"
          },
          {
            "name": "evidenceHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "reporter",
            "type": "pubkey"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "threatStatus"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "threatStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "active"
          },
          {
            "name": "disputed"
          },
          {
            "name": "cleared"
          }
        ]
      }
    }
  ]
};
