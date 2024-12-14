<div align = "center">
    <img src = "https://user-images.githubusercontent.com/87505840/196835270-bb77df87-9880-4933-b0ff-289eb54c0202.svg" height = "" width = "40%">
    <h2>Drag and Drop Framework (https://loopar.io/Doc)</h2>
</div>


# Installation
### Via NPX
``` 
sudo npx loopar-env project-name --port 8080
````

### Clone from Git
 ````
1. git clone https://github.com/alphabit-technology/loopar-framework.git project-name
2. cd project-name
3. npm install
4. npm run dev
````

> When any last proccess is completed, you can navigate in your browser, next the system show for you a wizard installation when you can define your DataBase type and conecction data, next you need define your project data, then your installation is completed.

Now you can to start a design your projects


# Build for Production
Loopar leverages the power of Vite to simplify the production deployment process. With just a few commands, your application is ready for production:
 ````
sudo npm run build
sudo NODE_ENV=production npm run start
````

#### For enhanced management and monitoring, you can use PM2:
 ````
 pm2 start "sudo NODE_ENV=production npm run start" --name "loopar" 
 ````

To achieve greater stability and scalability, consider setting up a reverse proxy with Nginx, which provides improved load balancing, security, and performance optimization for your production environment.

This straightforward process ensures that deploying Loopar is efficient and reliable, allowing you to focus on building and scaling your applications.

