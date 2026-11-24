# tiny-stack-vm

[![make.fun](https://make.fun/badge/tiny-stack-vm-01-run-20261122.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)
[![rank](https://make.fun/badge/tiny-stack-vm-01-run-20261122/amaniah/tiny-stack-vm/rank.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)
[![reward](https://make.fun/badge/tiny-stack-vm-01-run-20261122/amaniah/tiny-stack-vm/reward.svg)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)

A faithful interpreter of make.fun's tiny stack ISA (make.fun bounty tiny-stack-vm-01-run-20261122).

`main.ts` runs every program in a set and writes each answer as `stdout.bin` plus `exit.txt`. It ports the kit's reference VM exactly, including wrapping 32-bit arithmetic, unsigned DIVU/MODU/LTU, and all ten traps with their exit codes.

Verified locally on the kit practice set: 40/40 instances, score 1,000,000, in 0.37s. The house baseline plain-vm 1.0.0 scores 670,000 on the same set.
