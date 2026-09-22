const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy PartnerVerification
  const PartnerVerification = await hre.ethers.getContractFactory("PartnerVerification");
  const partnerVerification = await PartnerVerification.deploy(deployer.address);
  await partnerVerification.waitForDeployment();
  const partnerAddress = await partnerVerification.getAddress();
  console.log("PartnerVerification deployed to:", partnerAddress);

  // Deploy VehicleRegistry
  const VehicleRegistry = await hre.ethers.getContractFactory("VehicleRegistry");
  const vehicleRegistry = await VehicleRegistry.deploy(deployer.address);
  await vehicleRegistry.waitForDeployment();
  const vehicleAddress = await vehicleRegistry.getAddress();
  console.log("VehicleRegistry deployed to:", vehicleAddress);

  // Output deployment addresses to file for backend consumption
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    partnerVerificationAddress: partnerAddress,
    vehicleRegistryAddress: vehicleAddress,
    timestamp: new Date().toISOString()
  };

  const outPath = path.resolve(__dirname, "../deployment.json");
  fs.writeFileSync(outPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to:", outPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
