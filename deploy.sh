#!/bin/bash
# Script to bootstrap the channel and deploy the chaincode using the Fabric v2 lifecycle

echo "##########################################################"
echo "### Channel Creation and Chaincode Deployment Script ###"
echo "##########################################################"

# Wait for the containers to be ready
sleep 10

# Create the channel block
docker exec cli peer channel create -o orderer:7050 -c ledgerit -f /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/channel.tx --outputBlock /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ledgerit.block --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/ledgerit-orderer/orderers/orderer/msp/tlscacerts/tlsca.ledgerit-orderer-cert.pem

sleep 3

# Join the channel
docker exec cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ledgerit.block

# Update anchor peers
docker exec cli peer channel update -o orderer:7050 -c ledgerit -f /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/LedgerITOrgMSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/ledgerit-orderer/orderers/orderer/msp/tlscacerts/tlsca.ledgerit-orderer-cert.pem

echo "##########################################################"
echo "### Chaincode Lifecycle ###"
echo "##########################################################"

# 1. Package the chaincode using CCAAS pattern
cat << 'EOF' > connection.json
{
  "address": "ledgerit-chaincode:9999",
  "dial_timeout": "10s",
  "tls_required": false
}
EOF

cat << 'EOF' > metadata.json
{
    "type": "ccaas",
    "label": "ledgerit_1.0"
}
EOF

tar cfz code.tar.gz connection.json
tar cfz ledgerit.tar.gz metadata.json code.tar.gz
rm connection.json metadata.json code.tar.gz

# Copy the CCAAS package into the CLI container
docker cp ledgerit.tar.gz cli:/opt/gopath/src/github.com/hyperledger/fabric/peer/ledgerit.tar.gz

# 2. Install the chaincode
docker exec cli peer lifecycle chaincode install ledgerit.tar.gz

# Extract the package ID
PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled | grep ledgerit_1.0 | awk '{print $3}' | sed 's/,//')
echo "Package ID is ${PACKAGE_ID}"

# 2.5 Start the external chaincode container
echo "Starting ledgerit-chaincode container..."
export PACKAGE_ID=${PACKAGE_ID}
export COMPOSE_PROJECT_NAME=ledgerit
docker-compose -f network/docker-compose.yml up -d --build ledgerit-chaincode
sleep 10

# 3. Approve for My Org
docker exec cli peer lifecycle chaincode approveformyorg -o orderer:7050 --ordererTLSHostnameOverride orderer --channelID ledgerit --name ledgerit --version 1.0 --package-id ${PACKAGE_ID} --sequence 1 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/ledgerit-orderer/orderers/orderer/msp/tlscacerts/tlsca.ledgerit-orderer-cert.pem

# 4. Check commit readiness
docker exec cli peer lifecycle chaincode checkcommitreadiness --channelID ledgerit --name ledgerit --version 1.0 --sequence 1 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/ledgerit-orderer/orderers/orderer/msp/tlscacerts/tlsca.ledgerit-orderer-cert.pem --output json

# 5. Commit the chaincode
docker exec cli peer lifecycle chaincode commit -o orderer:7050 --ordererTLSHostnameOverride orderer --channelID ledgerit --name ledgerit --version 1.0 --sequence 1 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/ledgerit-orderer/orderers/orderer/msp/tlscacerts/tlsca.ledgerit-orderer-cert.pem --peerAddresses ledgerit-peer:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ledgerit-org/peers/ledgerit-peer/tls/ca.crt

# Wait for commit to propagate
sleep 3

# 6. Invoke InitLedger
docker exec cli peer chaincode invoke -o orderer:7050 --ordererTLSHostnameOverride orderer --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/ledgerit-orderer/orderers/orderer/msp/tlscacerts/tlsca.ledgerit-orderer-cert.pem -C ledgerit -n ledgerit --peerAddresses ledgerit-peer:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ledgerit-org/peers/ledgerit-peer/tls/ca.crt -c '{"function":"initLedger","Args":[]}'

echo "Chaincode deployed successfully!"
