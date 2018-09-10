#!usr/bin/bash

#######################
# JABIL Co.           #
# Trackchainer        #
# Author : Melvyn Tie #
#######################

# Exit on first error, print all commands.
set -ev

################################################################################
# GENERATE THE CHANNEL ARTIFACTS
################################################################################


# define the channel name
export CHANNEL_NAME=trackchainer

# export the build path
export PATH=$GOPATH/src/trackchainer/hyperledger/fabric/build/bin:${PWD}/binary:${PWD}:$PATH
export FABRIC_CFG_PATH=${PWD}/network

# remove previous crypto material and config transactions
rm -fr ./network/cli/peers/*
mkdir -p ./network/cli/peers

# generate crypto material
cryptogen generate --config=./network/crypto-config.yaml --output=./network/cli/peers
if [ "$?" -ne 0 ]; then
  echo "Failed to generate crypto material..."
  exit 1
fi

# generate genesis block for orderer
configtxgen -profile OneOrgOrdererGenesis -outputBlock ./network/cli/peers/genesis.block
if [ "$?" -ne 0 ]; then
  echo "Failed to generate orderer genesis block..."
  exit 1
fi

# generate channel configuration transaction
configtxgen -profile OneOrgChannel -outputCreateChannelTx ./network/cli/peers/channel.tx -channelID $CHANNEL_NAME
if [ "$?" -ne 0 ]; then
  echo "Failed to generate channel configuration transaction..."
  exit 1
fi

cp -r ./network/cli/peers/channel.tx ./web/

# generate anchor peer transaction
configtxgen -profile OneOrgChannel -outputAnchorPeersUpdate ./network/cli/peers/TrackchainerOrgMSPanchors.tx -channelID $CHANNEL_NAME -asOrg TrackchainerOrgMSP
if [ "$?" -ne 0 ]; then
  echo "Failed to generate anchor peer update for orgMSP..."
  exit 1
fi

################################################################################
# CHANGE THE FILENAME
################################################################################

export PEERORGPATH=./network/cli/peers/peerOrganizations

# change sk files name to key.pem
for sk in $(find . -name "*_sk") ; do mv "$sk" "$(dirname $sk)/key.pem"; done

# change cert.pem files to cert.pem
#for cert in $(find . -name "*-cert.pem") ; do mv "$cert" "$(dirname $cert)/cert.pem"; done


################################################################################
# MOVE THE FILE
################################################################################


export ORDERERS=./network/cli/peers/ordererOrganizations
export PEERS=./network/cli/peers/peerOrganizations

# remove the folder contents
rm -rf ./network/{orderer,peer}/crypto/*
rm -rf ./network/org/{ca,tls}/*

# create the directories
mkdir -p ./network/{orderer,org,peer}
mkdir -p ./network/{orderer,peer}/crypto

# change permission
# sudo chown -R melvyn:melvyn ./*

# move the cypto files
cp -r $ORDERERS/${CHANNEL_NAME}-orderer/orderers/orderer0/{msp,tls} ./network/orderer/crypto
cp -r $PEERS/${CHANNEL_NAME}-org/peers/${CHANNEL_NAME}-peer/{msp,tls} ./network/peer/crypto
# cp -r $PEERS/org.${CHANNEL_NAME}.com/peers/peer1.org.${CHANNEL_NAME}.com/{msp,tls} ./network/peer1/crypto
# cp -r $PEERS/org.${CHANNEL_NAME}.com/peers/peer2.org.${CHANNEL_NAME}.com/{msp,tls} ./network/peer2/crypto
cp -r ./network/cli/peers/genesis.block ./network/orderer/crypto
cp -r ./network/cli/peers/channel.tx ./network/orderer/crypto
cp -r ./network/cli/peers/channel.tx ./web/

export ORG=./network/org

# remove the folder contents
rm -rf $ORG/{ca,tls}/*

# create the directories
mkdir -p $ORG/{ca,tls}

# move the ca files
cp -r $PEERS/${CHANNEL_NAME}-org/ca/* $ORG/ca
cp -r $PEERS/${CHANNEL_NAME}-org/tlsca/* $ORG/tls

mv $ORG/ca/*-cert.pem $ORG/ca/cert.pem
mv $ORG/tls/*-cert.pem $ORG/tls/cert.pem

mkdir -p ./network/peer/{peer,users,configtx}
cp -r $PEERS/${CHANNEL_NAME}-org/peers/${CHANNEL_NAME}-peer/msp ./network/peer/
cp -r $PEERS/${CHANNEL_NAME}-org/users ./network/peer/
cp ./network/cli/peers/channel.tx ./network/peer/configtx/
cp ./network/cli/peers/genesis.block ./network/peer/configtx/

################################################################################
# CREATE KEY-STORE DIRECTORY
################################################################################

export CERTS=./network/hfc-key-store/

# delete previous creds
rm -rf ./network/hfc-key-store/*
rm -rf ./web/certs/*
# create hfc-key-store
mkdir -p ./network/hfc-key-store
mkdir -p ./web/certs

# move peer credentials into the keyValStore
cp -r ./network/orderer/crypto/tls/ca.crt $CERTS/orderer0.pem
cp -r ./network/peer/crypto/tls/ca.crt $CERTS/org.pem
# cp -r ./network/peer1/crypto/tls/ca.crt $CERTS/org.pem
# cp -r ./network/peer2/crypto/tls/ca.crt $CERTS/org.pem

# move admin credentials into the keyValStore
cp -r $PEERS/${CHANNEL_NAME}-org/users/Admin@${CHANNEL_NAME}-org/msp/keystore/* $CERTS/Admin@${CHANNEL_NAME}-org-key.pem
cp -r $PEERS/${CHANNEL_NAME}-org/users/Admin@${CHANNEL_NAME}-org/msp/signcerts/* $CERTS/

cp -r $CERTS/* ./web/certs/
# change permission
# sudo chown -R melvyn:melvyn ./*

################################################################################
# PULL THE IMAGES
################################################################################

dockerFabricPull() {
  local FABRIC_TAG=$1
  for IMAGES in peer orderer ; do
      echo "==> FABRIC IMAGE: $IMAGES"
      echo
      docker pull hyperledger/fabric-$IMAGES:$FABRIC_TAG
      docker tag hyperledger/fabric-$IMAGES:$FABRIC_TAG hyperledger/fabric-$IMAGES
  done
}

dockerCaPull() {
      local CA_TAG=$1
      echo "==> FABRIC CA IMAGE"
      echo
      docker pull hyperledger/fabric-ca:$CA_TAG
      docker tag hyperledger/fabric-ca:$CA_TAG hyperledger/fabric-ca
}

BUILD=
DOWNLOAD=
if [ $# -eq 0 ]; then
    BUILD=true
    PUSH=true
    DOWNLOAD=true
else
    for arg in "$@"
        do
            if [ $arg == "build" ]; then
                BUILD=true
            fi
            if [ $arg == "download" ]; then
                DOWNLOAD=true
            fi
    done
fi

if [ $DOWNLOAD ]; then
   : ${CA_TAG:="x86_64-1.1.0"}
   : ${FABRIC_TAG:="x86_64-1.1.0"}

   echo "===> Pulling fabric Images"
   dockerFabricPull ${FABRIC_TAG}

   echo "===> Pulling fabric ca Image"
   dockerCaPull ${CA_TAG}
   echo
   echo "===> List out hyperledger docker images"
   docker images | grep hyperledger*
fi

if [ $BUILD ];
    then
    echo '############################################################'
    echo '#                 BUILDING CONTAINER IMAGES                #'
    echo '############################################################'
    docker build -t orderer0:latest network/orderer
    docker build -t trackchainer-peer:latest network/peer
    docker build -t trackchainer-ca:latest network/org
    #docker build -t web:latest web/
fi

################################################################################
# BUILD THE NETWORK
################################################################################

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1
export COMPOSE_PROJECT_NAME=trackchainer

# bring down the network
docker-compose -f network/docker-compose.yml down

# bring up the network
docker-compose -f network/docker-compose.yml up -d

################################################################################
# THE END
################################################################################
