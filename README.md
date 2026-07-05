# LedgerIT

LedgerIT is a Proof-of-Concept (POC) blockchain application that allows users to seamlessly perform CRUD (Create, Read, Update, and Delete) operations on a secure, private blockchain network powered by Hyperledger Fabric.

## Prerequisites

This application has been tested on macOS and Linux environments. Ensure you have the following dependencies installed before proceeding:

- [Node.js v22+ and npm v10+](https://nodejs.org/en/download/package-manager/)
- [Docker v20+ and Docker Compose](https://docs.docker.com/get-docker/)
- [Golang v1.20+](https://golang.org/doc/install)
- [Hyperledger Fabric v2.5.4](https://hyperledger-fabric.readthedocs.io/en/release-2.5/)

### Verify Prerequisites

Verify that the required software is properly installed by running the following command in your terminal:

```sh
docker --version && node --version && go version
```

Ensure your `GOPATH` environment variable is set. You can check this by running:

```sh
echo $GOPATH
```

If it is empty, you can add it to your profile (e.g., `~/.bashrc` or `~/.zshrc`):

```sh
echo 'export GOPATH="$HOME/go"' >> ~/.bashrc
source ~/.bashrc
```

## Instructions

### Installation and Setup

1. **Clone the Repository:**
   Clone the repository into your preferred directory and navigate into it:

   ```sh
   git clone git@github.com:natri96/hyperledger-fabric-POC.git ledgerit
   cd ledgerit
   ```

2. **Bootstrap the Blockchain Network:**
   Run the setup script to download the required Docker images, generate the cryptographic materials, and start the Hyperledger Fabric network (Orderers, Peers, and Certificate Authorities). It will also deploy the chaincode and build the web application container.

   ```sh
   bash start.sh
   ```
   *Note: If you encounter permission issues, you may need to run this command with `sudo`.*

   Upon success, you should see the containers running in your terminal:

   ![Docker-Success](/images/docker-success.png)

3. **Start the Web Application:**
   The `start.sh` script automatically builds and starts the web application in a Docker container mapped to port 3000. 

   However, if you wish to run the application natively for development:

   ```sh
   cd web
   npm install
   npm run serve
   ```

   You should see a success message indicating the server has started:

   ![Web-Success](/images/web-success.png)

### Usage

Open your web browser and navigate to [http://localhost:3000/](http://localhost:3000/) to interact with the application.

### Teardown and Cleanup

To stop the network and clean up all generated containers, volumes, and cryptographic materials, run the provided cleanup script:

```sh
bash clean.sh
```
*Note: Run with `sudo` if you encounter permission errors.*
