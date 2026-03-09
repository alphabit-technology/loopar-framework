<div align = "center">
    <img src = "https://user-images.githubusercontent.com/87505840/196835270-bb77df87-9880-4933-b0ff-289eb54c0202.svg" height = "" width = "40%">
    <h2>Drag and Drop Framework (https://loopar.build/Doc)</h2>
</div>

# Prerequisites
> 1. Node JS 22+
> 2. Yarn 4+ (required)

# Installation
## Automatic Installation
### With NPX
````shell
sudo npx loopar-install project-name --port 8080
````
> Your server will start automatically in the dev environment.

## Manual Installation
### Clone from Git
````shell
git clone https://github.com/alphabit-technology/loopar-framework.git project-name
cd project-name
````
##### Install with yarn
````shell
yarn install
yarn run dev
````
>[!IMPORTANT]
> Loopar uses a workspace-based monorepo structure. **Yarn 4+ is required** for installation — other package managers (npm, pnpm) are not supported and may cause dependency resolution errors.

> If you don't have Yarn 4, enable it via Corepack (included with Node.js 16.9+):
> ```shell
> corepack enable
> yarn set version stable
> ```

When the process is completed, navigate to your browser. The system will show a wizard installation where you can define your database type and connection data, then your project data. Once completed, you can start designing your projects.