FROM docker.io/hyperledger/fabric-peer:2.5.4

RUN mkdir /peer
COPY /crypto /peer/crypto
COPY /msp /etc/hyperledger/msp/peer
COPY /users /etc/hyperledger/msp/users
COPY /configtx /etc/hyperledger/configtx 