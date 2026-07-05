#!/bin/bash
# Script to bootstrap the channel and deploy the chaincode using the Fabric v2 lifecycle

echo "##########################################################"
echo "### Channel Creation and Chaincode Deployment Script ###"
echo "##########################################################"

# Wait for the containers to be ready
sleep 10

# Create the channel block
docker exec cli peer channel create -o orderer0:7050 -c ledgerit -f /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/channel.tx --outputBlock /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ledgerit.block --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/ledgerit-orderer/orderers/orderer0/msp/tlscacerts/tlsca.ledgerit-orderer-cert.pem

sleep 3

# Join the channel
docker exec cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ledgerit.block

# Update anchor peers
docker exec cli peer channel update -o orderer0:7050 -c ledgerit -f /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/LedgerITOrgMSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/ledgerit-orderer/orderers/orderer0/msp/tlscacerts/tlsca.ledgerit-orderer-cert.pem

echo "##########################################################"
echo "### Chaincode Lifecycle ###"
echo "##########################################################"

# 1. Package the chaincode
docker exec cli peer lifecycle chaincode package ledgerit.tar.gz --path /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/ --lang golang --label ledgerit_1.0

# 2. Install the chaincode
docker exec cli peer lifecycle chaincode install ledgerit.tar.gz

# Extract the package ID
PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled | grep ledgerit_1.0 | awk '{print $3}' | sed 's/,//')
echo "Package ID is ${PACKAGE_ID}"

# 3. Approve for My Org
docker exec cli peer lifecycle chaincode approveformyorg -o orderer0:7050 --ordererTLSHostnameOverride orderer0 --channelID ledgerit --name ledgerit --version 1.0 --package-id ${PACKAGE_ID} --sequence 1 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/ledgerit-orderer/orderers/orderer0/msp/tlscacerts/tlsca.ledgerit-orderer-cert.pem

# 4. Check commit readiness
docker exec cli peer lifecycle chaincode checkcommitreadiness --channelID ledgerit --name ledgerit --version 1.0 --sequence 1 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/ledgerit-orderer/orderers/orderer0/msp/tlscacerts/tlsca.ledgerit-orderer-cert.pem --output json

# 5. Commit the chaincode
docker exec cli peer lifecycle chaincode commit -o orderer0:7050 --ordererTLSHostnameOverride orderer0 --channelID ledgerit --name ledgerit --version 1.0 --sequence 1 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/ledgerit-orderer/orderers/orderer0/msp/tlscacerts/tlsca.ledgerit-orderer-cert.pem --peerAddresses ledgerit-peer:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ledgerit-org/peers/ledgerit-peer/tls/ca.crt

# Wait for commit to propagate
sleep 3

# 6. Invoke InitLedger
docker exec cli peer chaincode invoke -o orderer0:7050 --ordererTLSHostnameOverride orderer0 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/ledgerit-orderer/orderers/orderer0/msp/tlscacerts/tlsca.ledgerit-orderer-cert.pem -C ledgerit -n ledgerit --peerAddresses ledgerit-peer:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ledgerit-org/peers/ledgerit-peer/tls/ca.crt -c '{"function":"initLedger","Args":[]}'

echo "Chaincode deployed successfully!"
