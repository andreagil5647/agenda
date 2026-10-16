# Debugging notes

Write-ups of bugs found while building the web app: what was observed, how it was narrowed
down, the root cause, the fix, and the test that now guards against it. Only real bugs are
recorded here.

| #    | Bug                                                                                                               | Area    |
| ---- | ----------------------------------------------------------------------------------------------------------------- | ------- |
| 0001 | [webpack-cli could not load the .ts config: extension and plugin-shape errors](0001-webpack-config-ts-loading.md) | Tooling |
| 0002 | [Retry-budget test flaked on the delay chain's last step](0002-fake-timer-retry-chain.md)                         | Testing |
| 0003 | [A task added while the list was loading left it loading for good](0003-write-while-loading.md)                   | Data    |

New notes copy [the template](template.md).
