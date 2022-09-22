# About This Project


## Installing the Script
I am assuming you already have [Node.js](https://nodejs.org/en/) installed. The script was developed and tested with v17.4.0. To install, run the following from the root directory of the project:
```
npm install
```

## Creating the Configuration File
The script needs a file named `.env` with configuration details specified. You can copy the example file (.env.example) provided as a starting template (ie: `cp .env.example .env`). See below for documentation on the various configuration parameters.

- GOTCHI_IDS - (required) a comma separated list of gotchi ID's (ie: `12736,827,19873`)
- ORIGINAL_OWNER_WALLET_ADDRESS - (required if LENDER_WALLET_ADDRESS is not the owner of the gotchis) address of the gotchi owner
- DISCORD_BOT_TOKEN - (required) Token of Discord Bot (needs permission to read message content)
- GOTCHIVERSE_SUBGRAPH - URI of the Gotchiverse Subgraph

## Running the Script
The script can be run with the command:
```
node app.js
```


# Production Use
Simply put, do not use this script in production if you do not know what you're doing. I strongly urge you to implement a more secure method than plaintext for giving a script private keys. In production, a secure secret storage solution (ie: Docker secrets) is highly advisable.

If you do use the script as is in production with a plaintext private key in the configuration file, it is highly recommended that you use dedicated lending hot wallet with only a few MATIC to cover gas costs. Do not keep valuable assets in this wallet. You'll need to set your lending hot wallet as a lending operator. This can be done using [Louper.dev](https://louper.dev/diamond/0x86935F11C86623deC8a25696E1C19a8659CbF95d?network=polygon) or some similar tool to call the `setLendingOperator`  method of the Aavegotchi LendingGetterAndSetterFacet smart contract.

## Using PM2
To run the application in the background, you can use [PM2](https://pm2.keymetrics.io/) to daemonize it. An `ecosystem.config.js` file has been provided with some suggested settings. You can install PM2 globally using `npm install pm2 -g`.

To start the script, use `pm2 start`. To stop the script, you can use `pm2 stop gotchi-manager-analytics` or use `pm2 delete gotchi-manager-analytics`. You can monitor the script with `pm2 logs` or, the prettier version: `pm2 monit`

## Using Docker
A dockerfile is included if you want to run the script inside a Docker container. Here are some suggested commands:

Build the image (from project root):
```
docker build -t gotchi-manager-analytics .
```
Run the container
```
docker run -d --restart unless-stopped gotchi-manager-analytics
```
Please note that the configuration file is part of the docker image, so the image would need to be rebuilt anytime the lending terms or other configuration has changed.
