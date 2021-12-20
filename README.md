# 📦 Yul Log 📦

Yul Log is a package designed to serve as an easy to use unified toolchain for writing and using Yul+ Contracts. It's named after the dessert, partially to fit with Truffle's theme.

Yul Log reads from a directory called "Yul+ Contracts" within the local context, and expects only files with the .yulp extension inside. It will then compile your contracts and put the artifacts in ./artifacts/contracts for hardhat, and for truffle it will transpile them to Yul and put them in your contracts directory, then use truffle to compile it down to useable artifacts.

Currently Truffle is supported and Hardhat is close by, alternatively you can just utilize the default created artifacts inside of your own framework.

## Commands

```
yul-log
```

This will compile .yulp contracts inside of a "Yul+ Contracts" Directory in the current context into a special json file with the following format

```
{
    "_format": "Yul+ Artifact Format v0.0.1",
    "contractName" : filename,
    "abi" : abi,
    "bytecode" : bytecode,
    "deployedBytecode" : deployedBytecode,
}
```

You can then use this json file however you would like in your current project.

```
yul-log truffle
```

This will compile .yulp contracts inside of a "Yul+ Contracts" Directory at the root of the project into truffle artifacts, which can then be treated like regular truffle contracts when testing.

```
yul-log hardhat
```
This will compile .yulp contracts inside of a "Yul+ Contracts" Directory at the root of the project into hardhat solidity artifacts (Use sig"" to remain compatible). Command is still very much a WIP, however it will generate a partial artifact that fits with a hardhat Solidity artifact, and can be treated similarly. However this isn't fully supported at the moment so expect issues and frequent manual fixes.
