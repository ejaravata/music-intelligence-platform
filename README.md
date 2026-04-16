# CIS 5500 Project - Group 4

Welcome to Hotify DB! Here are list of instructions in order to connect to our server.

1. Clone the repository in your terminal using this command
```
git clone https://github.com/yujeremy21/CIS5500-Project
```
- Once you are in the CIS5500-Project folder, you should be able to view all the folders using ls command and see the following output
```
$ ls
client/  data_cleaning/  README.md  server/
```
- You will need permission to clone this repository. Email Jeremy Yu at yujeremy@seas.upenn.edu to be granted permission to the repository.

2. Make sure you have Node.js installed. Once that is complete, install NPM within the server and client folders using these commands (assuming Node.js is already installed on system) 
*Note-you only need to do this step once for each folder
```
cd server 
npm install 
cd ..
cd client 
npm install
cd ..
```

3. Open a new command prompt window in vscode
- Use these commands to start the server
```
cd server
npm start
```

4. Open a NEW command prompt window
- Use these commands to setup and start the client
```
cd client
npm run build
npm run dev
```
- In the folder /server the following files should be included:
```
$ls
config.json
package.json
package-lock.json
```
- Important cRDS connection credentials for connecting to our database such as local host, port number rds_db and rds_host are listed in config.json:
```
{
  "rds_host": "database-cis5500-finalproject.cjpux38yq27o.us-east-1.rds.amazonaws.com",
  "rds_port": "5432",
  "rds_user": "cis5500student",
  "rds_password": "Spring2026!?",
  "rds_db": "music_db",
  "server_host": "localhost",
  "server_port": "8080",
  "frontend_url": "http://localhost:5173"
}
```
- Important dependency versions needed to run our application are listed below in server/package.json:
```
{
  "name": "server",
  "version": "1.0.0",
  "private": true,
  "main": "server.js",
  "scripts": {
    "start": "nodemon server.js",
    "test": "jest --coverage"
  },
  "dependencies": {
    "bcrypt": "^6.0.0",
    "cors": "^2.8.5",
    "dotenv": "^17.4.2",
    "express": "^4.18.2",
    "express-session": "^1.19.0",
    "nodemon": "^2.0.20",
    "passport": "^0.7.0",
    "passport-github2": "^0.1.12",
    "passport-google-oauth20": "^2.0.0",
    "pg": "^8.12.0",
    "supertest": "^6.3.3"
  },
  "devDependencies": {
    "jest": "^29.3.1"
  }
}
```
- Our exact versions of each package in the application dependency tree for installs and maintenance are listed in server/package-lock.json.

5. To start the application, go to a browser and enter this into the search bar
```
http://localhost:5173/
```

6. Login using the guest account username and password, or create your own account using a previously existing Google account, Github account or your own email.
```
username: guestuser@gmail.com
password: 12345
```

- Explore Hotify and enjoy our appliction!
