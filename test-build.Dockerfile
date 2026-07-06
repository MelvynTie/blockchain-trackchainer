FROM hyperledger/fabric-ccenv:2.5.4
COPY web/chaincode/src/ledgerit /chaincode/input/src
RUN cd /chaincode/input/src && go build -mod=readonly -v -o /chaincode/output/chaincode .
