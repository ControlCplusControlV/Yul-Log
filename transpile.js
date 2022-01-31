#!/usr/bin/env node
const yulp = require('yulp');
const fs = require('fs');
const { format } = require('path');
const { exec } = require('child_process');
const { stderr } = require('process');
const solc = require('solc');


/*
  Yul Log is my own toolchain for compiling Yul+ Contracts capable of handing a full 1 and a half frameworks
  Truffle and some very shitty hardhat artifact generation, that hardhat breaks if it sees

  Also with soon to be Yul-Log config support it will be able to support dapptools artifact generation as well
  Also its handling of the file structure is horrible

*/

//collect the arguments
var args = process.argv.slice(2);

//if arg is init, initialize yul-log
if (args.length==1 && args[0]=="init"){
  console.log("Initializing yul-log...")
  yulLogInit();
}

//initialize the yul-log environment
function yulLogInit(){
//clone the truffle yulp box repo and copy the contents into the root directory
exec("git clone https://github.com/ControlCplusControlV/Truffle-Yulp-Box.git\
 && cd Truffle-Yulp-Box\
 && cp -r ./* ../\
 && cd ../\
 && rm -rf Truffle-Yulp-Box",
    function (error, stdout, stderr) {
        if (error !== null) {
             console.log('exec error: ' + error);
        }
    });

//compile the test contract
console.log("Compiling example contract...")
exec("yul-log truffle",
    function (error, stdout, stderr) {
        if (error !== null) {
             console.log('exec error: ' + error);
        }

        console.log('Yul-Log is all set up! You can run "truffle test" to see the example tests in action.')
    });

}


fs.readdir("./Yul+ Contracts/", (err, files) => {
    files.forEach(file => {
        fs.readFile("./Yul+ Contracts/" +file, 'utf8', function (err,data) {
            if (err) {
                return console.log(err);
            }
            let filename = file.split(".")
            let source = yulp.compile(data);
            let output = JSON.parse(solc.compile(JSON.stringify({
                "language": "Yul",
                "sources": { "Target.yul": { "content": yulp.print(source.results) } },
                "settings": {
                  "outputSelection": { "*": { "*": ["*"], "": [ "*" ] } },
                  "optimizer": {
                    "enabled": true,
                    "runs": 0,
                    "details": {
                      "yul": true
                    }
                  }
                }
              })));  
            let contractObjects = Object.keys(output.contracts["Target.yul"])
            let abi = source.signatures.map(v => v.abi.slice(4, -1)).concat(source.topics.map(v => v.abi.slice(6, -1)))
            let bytecode = "0x" + output.contracts["Target.yul"][contractObjects[0]]["evm"]["bytecode"]["object"];
            let deployedBytecode = "0x" + output.contracts["Target.yul"][contractObjects[0]]["evm"]["deployedBytecode"]["object"];
            if (process.argv.indexOf('hardhat') > -1){
              // if hardhat flag is present
              // Still very experimental and breaks a LOT
              // But this does technically create a hardhat artifact 
              // that does work
              var hardhatCompiled = {
                  "_format": "hh-sol-artifact-1",
                  "contractName" : filename,
                  "sourceName" : "contracts/" + filename,
                  "abi" : abi,
                  "bytecode" : bytecode,
                  "deployedBytecode" : deployedBytecode,
                  "linkReferences": {}, // I really don't know what this means
                  "deployedLinkReferences": {} // This either
              }
              const data = JSON.stringify(hardhatCompiled);
              fs.writeFile("./artifacts/" + "contracts/" + filename[0] + '.json', data, (err) => {
                  // In case of a error throw err.
                  if (err) throw err;
              })
            } else if(process.argv.indexOf('truffle') > -1){
              // Write compiled Yul to a Contract 
              fs.writeFile("./contracts/" + filename[0] + '.yul', yulp.print(source.results), (err) => {
                // In case of a error throw err.
                if (err) throw err;
              })
              let abiBlock = ""
              for (let i = 0; i < abi.length; i++) {
                if (abi[i].indexOf("returns") < -1 && abi[i].substring(0, 5) != "event"){
                  abiBlock += abi[i] + "external" +";" + "\n"
                } else {
                    if(abi[i].substring(0, 5) != "event"){
                    //function get() returns (uint256);
                    splitABI = String(abi[i]).split(" ")
                    closeIndex = abi[i].indexOf(")")
                    let funcName = String(abi[i]).substring(0, closeIndex+1) + " external " + String(abi[i]).substring(closeIndex+1, String(abi[i]).length)
                    abiBlock += funcName +";" + "\n"
                  } else {
                    // Handle if its an event
                    abiBlock += abi[i] + ";"

                  }
                }
              } 
              // Convert abi to a solidity like interface
              abi = "pragma solidity ^0.8.10;\n interface " + "YulpInterface" + "{\n" + abiBlock + "\n}"
              // Write abi to an interface then compile that
              let compiledInterface = JSON.parse(solc.compile(JSON.stringify({
                "language": "Solidity",
                "sources": { "Target.sol": { "content": abi } },
                "settings": {
                  "outputSelection": { "*": { "*": ["*"], "": [ "*" ] } },
                  "optimizer": {
                    "enabled": true,
                    "runs": 0,
                    "details": {
                      "yul": false
                    }
                  }
                }
              })));  
              let compiledABI = compiledInterface.contracts["Target.sol"]["YulpInterface"]["abi"]
              // Next run truffle compile
              exec("truffle compile", (error, stdout, stderr) => {
                console.log(stdout)
                // Next read the created .json file, and inject abi into it
                const data = JSON.parse(fs.readFileSync("./build/contracts/" + filename[0] + ".json"))
                data.abi = compiledABI
                data.deployedBytecode = deployedBytecode
                fs.writeFileSync("./build/contracts/" + filename[0] + ".json", JSON.stringify(data, null, 4));
              });
        }else {
          // Default Artifact That Most People can Make use of for web3 Scripts
      let abiBlock = ""
      for (let i = 0; i < abi.length; i++) {
	if (abi[i].indexOf("returns") < -1 && abi[i].substring(0, 5) != "event"){
	  abiBlock += abi[i] + "external" +";" + "\n"
	} else {
	    if(abi[i].substring(0, 5) != "event"){
	    //function get() returns (uint256);
	    splitABI = String(abi[i]).split(" ")
	    closeIndex = abi[i].indexOf(")")
	    let funcName = String(abi[i]).substring(0, closeIndex+1) + " external " + String(abi[i]).substring(closeIndex+1, String(abi[i]).length)
	    abiBlock += funcName +";" + "\n"
	  } else {
	    // Handle if its an event
	    abiBlock += abi[i] + ";"

	  }
	}
      } 
      // Convert abi to a solidity like interface
      abi = "pragma solidity ^0.8.10;\n interface " + "YulpInterface" + "{\n" + abiBlock + "\n}"
          let compiledInterface = JSON.parse(solc.compile(JSON.stringify({
            "language": "Solidity",
            "sources": { "Target.sol": { "content": abi } },
            "settings": {
              "outputSelection": { "*": { "*": ["*"], "": [ "*" ] } },
              "optimizer": {
                "enabled": true,
                "runs": 0,
                "details": {
                  "yul": false
                }
              }
            }
          })));  
          let compiledABI = compiledInterface.contracts["Target.sol"]["YulpInterface"]["abi"]
          var defaultYulplusArtifact = {
            "_format": "Yul+ Artifact Format v0.0.1",
            "contractName" : filename,
            "abi" : compiledABI,
            "bytecode" : bytecode,
            "deployedBytecode" : deployedBytecode,
        }
        fs.writeFileSync("./build/" + filename[0] + ".json", JSON.stringify(defaultYulplusArtifact, null, 4));
        }
    });
  });
})
